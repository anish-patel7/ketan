"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatusTag from "@/components/ui/StatusTag";
import {
  Input, Select, Table, Tabs, Button, Tooltip, Modal, Form, message,
} from "antd";
import {
  Search, ScanLine, AlertTriangle, Plus, LayoutGrid,
  CheckCircle2, Building2,
} from "lucide-react";
import {
  loadMastersheets, formatSubjectLabel, makeSamples,
  PROJECT_TIMEPOINTS, PROJECT_NAMES, PROJECT_ANALYTES,
  type MasterSheetSample, type MasterSheetSampleStatus, type MasterSheet, type MasterSheetStatus,
  persistMastersheets,
} from "./mastersheet";

const { Option } = Select;

// ── Status cell style config ──────────────────────────────────────────────────

const STATUS_CELL: Record<MasterSheetSampleStatus, {
  bg: string; border: string; text: string; symbol: string;
}> = {
  available: { bg: "#E8F5E9", border: "#81C784", text: "#2E7D32", symbol: "✓" },
  retrieved: { bg: "#E3F2FD", border: "#64B5F6", text: "#1565C0", symbol: "↑" },
  reserved:  { bg: "#FFF8E1", border: "#FFB74D", text: "#E65100", symbol: "◷" },
  excluded:  { bg: "#FFEBEE", border: "#EF9A9A", text: "#C62828", symbol: "✕" },
  missing:   { bg: "#F5F5F5", border: "#BDBDBD", text: "#9E9E9E", symbol: "—" },
};

function formatToday(): string {
  return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Freezer equipment ─────────────────────────────────────────────────────────

const FREEZERS = [
  { id:"FRZ-01", name:"Freezer 1 (−70°C)", temp:"−71.2°C", status:"Normal",  capacity:480, used:312 },
  { id:"FRZ-02", name:"Freezer 2 (−70°C)", temp:"−69.8°C", status:"Normal",  capacity:480, used:198 },
  { id:"FRZ-03", name:"Freezer 3 (−20°C)", temp:"−19.4°C", status:"Normal",  capacity:320, used:87  },
  { id:"FRZ-04", name:"Fridge 1 (2–8°C)",  temp:"4.1°C",   status:"Warning", capacity:200, used:44  },
];

// ── CellChip component ────────────────────────────────────────────────────────

function CellChip({ sample }: { sample: MasterSheetSample | null }) {
  if (!sample) {
    return (
      <div style={{
        width: 52, height: 30, display:"flex", alignItems:"center", justifyContent:"center",
        color:"#C8C8C8", fontSize:13,
      }}>—</div>
    );
  }
  const cfg = STATUS_CELL[sample.status];
  const tip = (
    <div style={{ fontSize:11, lineHeight:1.7 }}>
      <div style={{ fontFamily:"monospace", fontWeight:700, marginBottom:2 }}>{sample.id}</div>
      <div>Clinic ID: {sample.clinicId}</div>
      <div>Location: {sample.freezer} · {sample.location}</div>
      <div>F/T cycles: {sample.ft}</div>
      <div style={{ marginTop:4 }}>
        <span style={{
          background:cfg.bg, border:`1px solid ${cfg.border}`,
          color:cfg.text, padding:"1px 6px", borderRadius:4, fontSize:10, fontWeight:700,
        }}>
          {sample.status.toUpperCase()}
        </span>
      </div>
    </div>
  );
  return (
    <Tooltip title={tip} overlayStyle={{ maxWidth:280 }}>
      <div style={{
        width:52, height:30,
        display:"flex", alignItems:"center", justifyContent:"center",
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 5,
        color: cfg.text,
        fontSize: 14,
        fontWeight: 700,
        cursor: "pointer",
        textDecoration: sample.status === "excluded" ? "line-through" : "none",
        userSelect: "none",
      }}>
        {cfg.symbol}
        {sample.ft >= 2 && (
          <span style={{ fontSize:8, marginLeft:1, color:"#E65100", fontWeight:900 }}>!</span>
        )}
      </div>
    </Tooltip>
  );
}

// ── Inventory table columns ───────────────────────────────────────────────────

const sampleColumns = [
  {
    title:"Sample ID", dataIndex:"id", key:"id",
    render:(v:string) => (
      <span style={{ fontFamily:"monospace", fontSize:11, color:"var(--accent)", fontWeight:600 }}>{v}</span>
    ),
  },
  {
    title:"Project", dataIndex:"project", key:"project",
    render:(v:string) => <span style={{ fontSize:12 }}>{v}</span>,
  },
  {
    title:"Analyte", dataIndex:"analyte", key:"analyte",
    render:(v:string) => (
      <span style={{
        background:"var(--accent-light)", color:"var(--accent)",
        padding:"1px 7px", borderRadius:4, fontSize:11, fontWeight:700,
      }}>{v}</span>
    ),
  },
  {
    title:"Subject", dataIndex:"subject", key:"subject",
    render:(v:string) => (
      <span style={{ fontFamily:"monospace", fontWeight:700, fontSize:13 }}>{v}</span>
    ),
  },
  { title:"Period", dataIndex:"period", key:"period" },
  {
    title:"Time Point", dataIndex:"tp", key:"tp",
    render:(v:string) => <span style={{ fontFamily:"monospace", fontSize:12 }}>{v}</span>,
  },
  {
    title:"Clinic ID", dataIndex:"clinicId", key:"clinicId",
    render:(v:string) => (
      <span style={{ fontFamily:"monospace", fontSize:10, color:"var(--text-muted)" }}>{v}</span>
    ),
  },
  {
    title:"Freezer", dataIndex:"freezer", key:"freezer",
    render:(v:string) => (
      <span style={{ fontSize:11, fontFamily:"monospace", color:"var(--status-info)" }}>{v}</span>
    ),
  },
  {
    title:"Location", dataIndex:"location", key:"location",
    render:(v:string) => <span style={{ fontSize:11, fontFamily:"monospace" }}>{v}</span>,
  },
  {
    title:"F/T", dataIndex:"ft", key:"ft",
    render:(v:number) => (
      <span style={{
        fontSize:12,
        color: v >= 3 ? "var(--status-fail)" : v >= 2 ? "var(--status-warn)" : "var(--text-secondary)",
        fontWeight: v >= 2 ? 600 : 400,
      }}>
        {v}{v >= 3 ? " ⚠" : ""}
      </span>
    ),
  },
  {
    title:"Status", dataIndex:"status", key:"status",
    render:(v:string) => <StatusTag status={v} />,
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FreezerPage() {
  const [activeTab, setActiveTab] = useState("inventory");

  // Inventory filters
  const [search,        setSearch]        = useState("");
  const [filterAnalyte, setFilterAnalyte] = useState<string | undefined>();
  const [filterProject, setFilterProject] = useState<string | undefined>();
  const [filterStatus,  setFilterStatus]  = useState<string | undefined>();

  // Mastersheet filters
  const [msProject, setMsProject] = useState("");
  const [msAnalyte, setMsAnalyte] = useState("");
  const [msPeriod,  setMsPeriod]  = useState("");

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [qaOpen,     setQaOpen]     = useState(false);
  const [qaPass,     setQaPass]     = useState("");
  const [form] = Form.useForm();

  // ── Data ───────────────────────────────────────────────────────────────────
  const allSheets   = loadMastersheets();
  const allSamples  = allSheets.flatMap(ms => ms.samples);

  const statusCounts = {
    available: allSamples.filter(s => s.status === "available").length,
    reserved:  allSamples.filter(s => s.status === "reserved").length,
    retrieved: allSamples.filter(s => s.status === "retrieved").length,
    excluded:  allSamples.filter(s => s.status === "excluded").length,
  };
  const ftWarnings = allSamples.filter(s => s.ft >= 2).length;

  const allAnalytes = [...new Set(allSamples.map(s => s.analyte))].sort();
  const allProjects = [...new Set(allSamples.map(s => s.project))].sort();

  // Inventory filtered
  const inventoryFiltered = allSamples.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || s.id.toLowerCase().includes(q)
      || s.subject.toLowerCase().includes(q)
      || s.clinicId.toLowerCase().includes(q);
    return matchSearch
      && (!filterAnalyte || s.analyte === filterAnalyte)
      && (!filterProject || s.project === filterProject)
      && (!filterStatus  || s.status  === filterStatus);
  });

  // ── Mastersheet matrix ─────────────────────────────────────────────────────
  // Shows the most recently created sheet for the project regardless of status,
  // so a freshly submitted (not-yet-approved) mastersheet is visible for QA review.
  const activeSheet: MasterSheet | undefined = msProject
    ? allSheets.find(ms => ms.project === msProject)
    : undefined;

  const msAnalytes = activeSheet?.analytes ?? [];
  const msPeriods  = activeSheet?.periods  ?? [];
  const msTps      = activeSheet ? (msAnalyte ? activeSheet.timepoints : []) : [];

  const filteredMsSamples = (activeSheet?.samples ?? []).filter(s =>
    (!msAnalyte || s.analyte === msAnalyte) &&
    (!msPeriod  || s.period  === msPeriod),
  );

  const displayPeriods = msPeriod
    ? [msPeriod]
    : (activeSheet?.periods ?? []);

  const matrixRows = displayPeriods.flatMap(period =>
    (activeSheet?.subjects ?? []).map(subject => {
      const label = formatSubjectLabel(subject, period);
      const cells = msTps.map(tp => ({
        tp,
        sample: filteredMsSamples.find(
          s => s.subject === subject && s.period === period && s.tp === tp,
        ) ?? null,
      }));
      return { label, subject, period, cells };
    }),
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleMsProjectChange(p: string) {
    setMsProject(p); setMsAnalyte(""); setMsPeriod("");
  }

  function handleCreateSubmit() {
    form.validateFields().then(values => {
      const { project, clinic, period, subjectCount, collectionDate } = values;
      const today = formatToday();
      const analytes = PROJECT_ANALYTES[project] ?? [];
      const timepoints = PROJECT_TIMEPOINTS[project] ?? [];
      const subjects = Array.from(
        { length: Math.max(1, Number(subjectCount) || 1) },
        (_, i) => String(i + 1).padStart(3, "0"),
      );
      const samples = analytes.flatMap((analyte, ai) =>
        makeSamples(project, analyte, subjects, [period], timepoints, `FRZ-0${(ai % 4) + 1}`, ai + 1, 1, []),
      );

      const newSheet: MasterSheet = {
        id: `MS-2026-${String(allSheets.length + 1).padStart(3, "0")}`,
        project, projectName: PROJECT_NAMES[project] ?? project, clinic,
        analytes, periods: [period], timepoints, subjects,
        status: "submitted",
        createdBy: "A. Liang", createdAt: collectionDate || today,
        submittedAt: today, submittedBy: "A. Liang",
        samples,
      };

      persistMastersheets([newSheet, ...allSheets]);
      message.success(`Mastersheet ${newSheet.id} created and submitted to QA for verification`);
      form.resetFields();
      setCreateOpen(false);
      setActiveTab("mastersheet");
      setMsProject(project); setMsAnalyte(""); setMsPeriod("");
    });
  }

  function handleQaSubmit() {
    if (!qaPass.trim()) { message.warning("Enter your password to confirm QA submission"); return; }
    if (!activeSheet) { setQaOpen(false); setQaPass(""); return; }
    const today = formatToday();
    persistMastersheets(allSheets.map(ms => ms.id === activeSheet.id
      ? { ...ms, status: "approved" as MasterSheetStatus, approvedBy: "J. Chen", approvedAt: today }
      : ms));
    message.success(`${activeSheet.id} approved and activated as the source of truth for sample retrieval`);
    setQaOpen(false); setQaPass("");
  }

  const LEGEND: Array<{ key: MasterSheetSampleStatus; label: string }> = [
    { key:"available", label:"Available"  },
    { key:"retrieved", label:"Retrieved"  },
    { key:"reserved",  label:"Reserved"   },
    { key:"excluded",  label:"Excluded"   },
    { key:"missing",   label:"Not Collected" },
  ];

  return (
    <AppLayout>
      <div className="page-container">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="section-title">Freezer Room</h1>
            <p className="section-subtitle">
              Subject sample inventory, mastersheet matrix, and retrieval management
            </p>
          </div>
          <div className="flex gap-2">
            <Button icon={<ScanLine size={14} />}
              style={{ borderColor:"var(--border)", color:"var(--text-secondary)" }}>
              Scan Receipt
            </Button>
            <Button type="primary" icon={<Plus size={14} />} onClick={() => setCreateOpen(true)}>
              New Mastersheet
            </Button>
          </div>
        </div>

        {/* ── Freezer status strip ─────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {FREEZERS.map(f => (
            <div key={f.id} className="rounded-xl p-4" style={{
              background:"white",
              border:`1px solid ${f.status === "Warning" ? "#e8c97c" : "var(--border)"}`,
            }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)" }}>{f.id}</span>
                {f.status === "Warning"
                  ? <AlertTriangle size={13} style={{ color:"var(--status-warn)" }} />
                  : <div className="w-2 h-2 rounded-full" style={{ background:"var(--status-pass)" }} />}
              </div>
              <div style={{ fontSize:11, color:"var(--text-secondary)", marginBottom:4 }}>{f.name}</div>
              <div style={{
                fontSize:18, fontWeight:700, fontFamily:"DM Serif Display, serif",
                color: f.status === "Warning" ? "var(--status-warn)" : "var(--status-info)",
              }}>{f.temp}</div>
              <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:4 }}>
                {f.used} / {f.capacity} positions used
              </div>
              <div className="utilisation-bar mt-2">
                <div className="utilisation-fill" style={{
                  width:`${Math.round((f.used / f.capacity) * 100)}%`,
                  background: f.status === "Warning" ? "var(--status-warn)" : "var(--status-pass)",
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Status summary ───────────────────────────────────────────────── */}
        <div className="flex gap-3 mb-5">
          {Object.entries(statusCounts).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 px-4 py-2.5 rounded-lg"
              style={{ background:"white", border:"1px solid var(--border)" }}>
              <span style={{ fontSize:18, fontWeight:700, fontFamily:"DM Serif Display, serif" }}>{v}</span>
              <StatusTag status={k} />
            </div>
          ))}
          {ftWarnings > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg ml-auto"
              style={{ background:"var(--status-warn-bg)", border:"1px solid #e8c97c" }}>
              <AlertTriangle size={13} style={{ color:"var(--status-warn)" }} />
              <span style={{ fontSize:12, color:"var(--status-warn)", fontWeight:600 }}>
                {ftWarnings} samples at F/T ≥ 2
              </span>
            </div>
          )}
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key:"inventory",   label:"Sample Inventory" },
            { key:"receipt",     label:"Pending Receipts" },
            {
              key: "mastersheet",
              label: (
                <span className="flex items-center gap-1.5">
                  <LayoutGrid size={12} /> Mastersheet
                </span>
              ),
            },
            { key:"retrieval",   label:"Retrieval Requests" },
          ]}
          style={{ marginBottom:16 }}
        />

        {/* ── Inventory Tab ─────────────────────────────────────────────────── */}
        {activeTab === "inventory" && (
          <>
            <div className="flex gap-3 mb-4">
              <Input
                prefix={<Search size={13} style={{ color:"var(--text-muted)" }} />}
                placeholder="Search by Sample ID, Subject, or Clinic ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width:340 }}
              />
              <Select placeholder="Analyte" style={{ width:120 }} allowClear onChange={setFilterAnalyte}>
                {allAnalytes.map(a => <Option key={a} value={a}>{a}</Option>)}
              </Select>
              <Select placeholder="Project" style={{ width:170 }} allowClear onChange={setFilterProject}>
                {allProjects.map(p => <Option key={p} value={p}>{p}</Option>)}
              </Select>
              <Select placeholder="Status" style={{ width:130 }} allowClear onChange={setFilterStatus}>
                {(["available","reserved","retrieved","excluded","missing"] as const).map(s => (
                  <Option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</Option>
                ))}
              </Select>
            </div>
            <div className="rounded-xl overflow-hidden"
              style={{ border:"1px solid var(--border)", background:"white" }}>
              <Table
                dataSource={inventoryFiltered}
                columns={sampleColumns}
                rowKey="id"
                size="small"
                pagination={{ pageSize:10, showSizeChanger:false,
                  showTotal:(t,r) => `${r[0]}–${r[1]} of ${t} samples` }}
                rowClassName={r => r.status === "excluded" || r.status === "missing" ? "opacity-60" : ""}
              />
            </div>
          </>
        )}

        {/* ── Mastersheet Tab ───────────────────────────────────────────────── */}
        {activeTab === "mastersheet" && (
          <>
            {/* Filters */}
            <div className="flex gap-3 mb-5 items-center">
              <Select
                style={{ width:280 }}
                placeholder="Select project…"
                value={msProject || undefined}
                onChange={handleMsProjectChange}
              >
                {allSheets.map(ms => (
                  <Option key={ms.project} value={ms.project}>
                    <span style={{ fontFamily:"monospace", fontWeight:700, color:"var(--accent)", fontSize:12 }}>
                      {ms.project}
                    </span>
                    <span style={{ color:"var(--text-muted)", fontSize:11, marginLeft:6 }}>
                      — {ms.projectName}
                    </span>
                  </Option>
                ))}
              </Select>

              {msProject && msAnalytes.length > 0 && (
                <Select
                  style={{ width:130 }}
                  placeholder="Analyte…"
                  value={msAnalyte || undefined}
                  onChange={setMsAnalyte}
                  allowClear
                >
                  {msAnalytes.map(a => <Option key={a} value={a}>{a}</Option>)}
                </Select>
              )}

              {msProject && msPeriods.length > 0 && (
                <Select
                  style={{ width:120 }}
                  placeholder="All periods"
                  value={msPeriod || undefined}
                  onChange={v => setMsPeriod(v ?? "")}
                  allowClear
                >
                  {msPeriods.map(p => <Option key={p} value={p}>{p}</Option>)}
                </Select>
              )}

              {activeSheet && activeSheet.status !== "approved" && (
                <Button
                  type="primary"
                  icon={<CheckCircle2 size={13} />}
                  style={{ marginLeft:"auto" }}
                  onClick={() => setQaOpen(true)}
                >
                  Verify &amp; Approve
                </Button>
              )}
            </div>

            {/* Sheet info banner */}
            {activeSheet && (
              <div className="flex items-center gap-4 mb-5 px-5 py-3 rounded-xl"
                style={{ background:"white", border:"1px solid var(--border)" }}>
                <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                  <div className="flex items-center gap-2">
                    <span style={{ fontFamily:"monospace", fontWeight:700, fontSize:14 }}>
                      {activeSheet.id}
                    </span>
                    <StatusTag status={activeSheet.status} />
                  </div>
                  <div style={{ fontSize:12, color:"var(--text-secondary)" }}>
                    {activeSheet.projectName}
                  </div>
                </div>
                <div style={{ display:"flex", gap:20, marginLeft:16 }}>
                  <div className="flex items-center gap-1.5">
                    <Building2 size={12} style={{ color:"var(--text-muted)" }} />
                    <span style={{ fontSize:11, color:"var(--text-secondary)" }}>
                      {activeSheet.clinic}
                    </span>
                  </div>
                  <div style={{ fontSize:11, color:"var(--text-muted)" }}>
                    Analytes: {activeSheet.analytes.join(" · ")}
                  </div>
                  <div style={{ fontSize:11, color:"var(--text-muted)" }}>
                    Periods: {activeSheet.periods.join(", ")}
                  </div>
                  <div style={{ fontSize:11, color:"var(--text-muted)" }}>
                    {activeSheet.subjects.length} subjects · {activeSheet.timepoints.length} time points
                  </div>
                </div>
                {activeSheet.approvedBy && (
                  <div style={{ marginLeft:"auto", textAlign:"right" }}>
                    <div style={{ fontSize:11, color:"var(--text-muted)" }}>
                      Approved by <strong>{activeSheet.approvedBy}</strong>
                    </div>
                    <div style={{ fontSize:10, color:"var(--text-muted)" }}>{activeSheet.approvedAt}</div>
                  </div>
                )}
              </div>
            )}

            {/* Status legend */}
            {activeSheet && (
              <div className="flex gap-4 mb-4 items-center flex-wrap">
                <span style={{ fontSize:11, fontWeight:600, color:"var(--text-muted)",
                  letterSpacing:"0.05em", textTransform:"uppercase" }}>
                  Legend
                </span>
                {LEGEND.map(({ key, label }) => {
                  const cfg = STATUS_CELL[key];
                  return (
                    <div key={key} className="flex items-center gap-1.5">
                      <div style={{
                        width:22, height:22,
                        background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:4,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:12, color:cfg.text, fontWeight:700,
                        textDecoration: key === "excluded" ? "line-through" : "none",
                      }}>
                        {cfg.symbol}
                      </div>
                      <span style={{ fontSize:11, color:"var(--text-secondary)" }}>{label}</span>
                    </div>
                  );
                })}
                <span style={{ marginLeft:"auto", fontSize:11, color:"var(--text-muted)" }}>
                  <strong>!</strong> superscript = F/T ≥ 2 cycles
                </span>
              </div>
            )}

            {/* Matrix */}
            {activeSheet && !msAnalyte && (
              <div style={{
                textAlign:"center", padding:"48px 0",
                color:"var(--text-muted)", fontSize:13,
              }}>
                <LayoutGrid size={36} style={{ marginBottom:10, opacity:0.18 }} />
                <div style={{ fontWeight:600, marginBottom:4 }}>Select an analyte to view the sample matrix</div>
                <div style={{ fontSize:12 }}>
                  Available analytes for this project: {msAnalytes.join(", ")}
                </div>
              </div>
            )}

            {activeSheet && msAnalyte && matrixRows.length > 0 && (
              <>
                <div style={{
                  overflowX:"auto", background:"white",
                  border:"1px solid var(--border)", borderRadius:12,
                }}>
                  <table style={{ borderCollapse:"collapse", fontSize:12, width:"100%" }}>
                    <thead>
                      <tr style={{ borderBottom:"2px solid var(--border)" }}>
                        {/* Sticky first column header */}
                        <th style={{
                          position:"sticky", left:0, zIndex:3, background:"white",
                          padding:"10px 20px", textAlign:"left",
                          borderRight:"2px solid var(--border)",
                          fontSize:10, fontWeight:700, color:"var(--text-muted)",
                          letterSpacing:"0.06em", whiteSpace:"nowrap",
                          minWidth:90,
                        }}>
                          SUBJ · PRD
                        </th>
                        {msTps.map(tp => (
                          <th key={tp} style={{
                            padding:"10px 6px", textAlign:"center",
                            fontWeight:600, fontSize:11, color:"var(--text-secondary)",
                            whiteSpace:"nowrap", minWidth:64,
                          }}>
                            {tp}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrixRows.map((row, ri) => {
                        const rowBg = ri % 2 === 0 ? "white" : "#FAFAFA";
                        return (
                          <tr key={row.label}
                            style={{ borderBottom:"1px solid var(--border)", background:rowBg }}>
                            <td style={{
                              position:"sticky", left:0, zIndex:1,
                              background:rowBg,
                              padding:"6px 20px",
                              borderRight:"2px solid var(--border)",
                              fontFamily:"monospace", fontWeight:700, fontSize:14,
                              color:"var(--text-primary)", whiteSpace:"nowrap",
                            }}>
                              {row.label}
                            </td>
                            {row.cells.map(cell => (
                              <td key={cell.tp} style={{ padding:"6px 6px", textAlign:"center" }}>
                                <CellChip sample={cell.sample} />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                    {/* Column totals footer */}
                    <tfoot>
                      <tr style={{ borderTop:"2px solid var(--border)", background:"var(--bg-card)" }}>
                        <td style={{
                          position:"sticky", left:0, zIndex:1,
                          background:"var(--bg-card)",
                          padding:"6px 20px",
                          borderRight:"2px solid var(--border)",
                          fontSize:10, fontWeight:700, color:"var(--text-muted)",
                          letterSpacing:"0.06em", textTransform:"uppercase",
                        }}>
                          Available
                        </td>
                        {msTps.map(tp => {
                          const avail = filteredMsSamples.filter(
                            s => s.tp === tp && s.status === "available",
                          ).length;
                          const total = filteredMsSamples.filter(s => s.tp === tp).length;
                          const color = avail === total
                            ? "#2E7D32"
                            : avail === 0 ? "#C62828" : "#E65100";
                          return (
                            <td key={tp} style={{ padding:"6px 6px", textAlign:"center" }}>
                              <span style={{ fontSize:11, fontWeight:600, color }}>
                                {avail}/{total}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Matrix summary below */}
                <div className="flex gap-4 mt-4 flex-wrap">
                  {(["available","retrieved","excluded","missing"] as MasterSheetSampleStatus[]).map(s => {
                    const cfg = STATUS_CELL[s];
                    const cnt = filteredMsSamples.filter(x => x.status === s).length;
                    return (
                      <div key={s} style={{
                        display:"flex", alignItems:"center", gap:8,
                        padding:"6px 14px", borderRadius:8,
                        background:cfg.bg, border:`1px solid ${cfg.border}`,
                      }}>
                        <span style={{
                          fontSize:18, fontWeight:700,
                          fontFamily:"DM Serif Display, serif",
                          color:cfg.text,
                        }}>{cnt}</span>
                        <span style={{ fontSize:12, color:cfg.text, fontWeight:500 }}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </span>
                      </div>
                    );
                  })}
                  <div style={{
                    marginLeft:"auto", display:"flex", alignItems:"center", gap:6,
                    fontSize:12, color:"var(--text-muted)",
                  }}>
                    {filteredMsSamples.length} total samples in view
                  </div>
                </div>
              </>
            )}

            {!msProject && (
              <div style={{
                textAlign:"center", padding:"72px 0",
                color:"var(--text-muted)",
              }}>
                <LayoutGrid size={44} style={{ marginBottom:14, opacity:0.15 }} />
                <div style={{ fontSize:16, fontWeight:600, marginBottom:6 }}>
                  Select a project to view its Mastersheet
                </div>
                <div style={{ fontSize:12, maxWidth:380, margin:"0 auto", lineHeight:1.6 }}>
                  The Mastersheet is the single source of truth for subject sample inventory —
                  showing availability, status, and location for every subject × time point × analyte
                  combination.
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Receipt Tab (placeholder) ─────────────────────────────────────── */}
        {activeTab === "receipt" && (
          <div style={{
            textAlign:"center", padding:"60px 0",
            color:"var(--text-muted)", fontSize:13,
          }}>
            <ScanLine size={36} style={{ marginBottom:12, opacity:0.18 }} />
            <div style={{ fontWeight:600, marginBottom:4 }}>Pending Receipts</div>
            <div style={{ fontSize:12 }}>No pending receipt records at this time.</div>
          </div>
        )}

        {/* ── Retrieval Tab (placeholder) ───────────────────────────────────── */}
        {activeTab === "retrieval" && (
          <div style={{
            textAlign:"center", padding:"60px 0",
            color:"var(--text-muted)", fontSize:13,
          }}>
            <LayoutGrid size={36} style={{ marginBottom:12, opacity:0.18 }} />
            <div style={{ fontWeight:600, marginBottom:4 }}>Retrieval Requests</div>
            <div style={{ fontSize:12 }}>
              Retrieval requests from the Distribution Sheet module will appear here.
            </div>
          </div>
        )}

      </div>

      {/* ── Create Mastersheet Modal ─────────────────────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background:"var(--accent-light)", color:"var(--accent)" }}>
              <LayoutGrid size={15} />
            </div>
            <span style={{ fontFamily:"DM Serif Display, serif", fontSize:19 }}>
              New Mastersheet
            </span>
          </div>
        }
        open={createOpen}
        onCancel={() => { setCreateOpen(false); form.resetFields(); }}
        width={560}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => { setCreateOpen(false); form.resetFields(); }}>Cancel</Button>
            <Button type="primary" icon={<CheckCircle2 size={13} />} onClick={handleCreateSubmit}>
              Create &amp; Submit to QA
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" style={{ padding:"12px 0" }}>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item
              label={<span style={{ fontSize:12, fontWeight:600 }}>Project</span>}
              name="project" rules={[{ required:true }]}
            >
              <Select placeholder="Select approved project…">
                <Option value="SID-2026-001">SID-2026-001 — Metformin BE Study</Option>
                <Option value="SID-2026-002">SID-2026-002 — Amlodipine BE Study</Option>
                <Option value="SID-2026-003">SID-2026-003 — Combo BE Study</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label={<span style={{ fontSize:12, fontWeight:600 }}>Clinic / Receiving Site</span>}
              name="clinic" rules={[{ required:true }]}
            >
              <Input placeholder="e.g. City Clinical Research Centre" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item
              label={<span style={{ fontSize:12, fontWeight:600 }}>Period</span>}
              name="period" rules={[{ required:true }]}
            >
              <Select placeholder="Period…">
                <Option value="P1">P1</Option>
                <Option value="P2">P2</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label={<span style={{ fontSize:12, fontWeight:600 }}>No. of Subjects</span>}
              name="subjectCount" rules={[{ required:true }]}
            >
              <Input type="number" min={1} placeholder="e.g. 24" />
            </Form.Item>
          </div>
          <Form.Item
            label={<span style={{ fontSize:12, fontWeight:600 }}>Sample Collection Date</span>}
            name="collectionDate"
          >
            <Input placeholder="e.g. 12 Jun 2026" />
          </Form.Item>
          <div style={{
            padding:"10px 14px", borderRadius:8,
            background:"var(--accent-light)", border:"1px solid var(--accent)",
            fontSize:11, color:"var(--accent)", lineHeight:1.6,
          }}>
            Time points and analytes will be auto-populated from the approved clinical project protocol.
            After submission, the QA team will verify sample counts before the mastersheet is activated.
          </div>
        </Form>
      </Modal>

      {/* ── QA Verify & Approve Modal ─────────────────────────────────────── */}
      <Modal
        title={
          <span style={{ fontFamily:"DM Serif Display, serif", fontSize:19 }}>
            Verify &amp; Approve Mastersheet
          </span>
        }
        open={qaOpen}
        onCancel={() => { setQaOpen(false); setQaPass(""); }}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => { setQaOpen(false); setQaPass(""); }}>Cancel</Button>
            <Button type="primary" onClick={handleQaSubmit}>Confirm Approval</Button>
          </div>
        }
      >
        <div style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:16 }}>
          I confirm that all samples have been received, verified, and correctly entered in the
          mastersheet. Approving will activate this record as the source of truth for sample
          retrieval in the Distribution Sheet module.
        </div>
        <div style={{ fontSize:12, fontWeight:600, marginBottom:6 }}>Your password (e-signature)</div>
        <Input.Password
          value={qaPass}
          onChange={e => setQaPass(e.target.value)}
          placeholder="Enter password to confirm"
        />
      </Modal>

    </AppLayout>
  );
}
