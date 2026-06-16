"use client";

import { useState, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatusTag from "@/components/ui/StatusTag";
import {
  Button, Select, Table, Tag, Modal, Input, message,
  Drawer, InputNumber, Checkbox, Tooltip,
} from "antd";
import {
  Plus, Download, Eye, CheckCircle2, AlertTriangle, Snowflake,
  PackageSearch, GripVertical, Lock, Unlock, FileDown, FlaskConical,
  Thermometer,
} from "lucide-react";
import {
  PROJECTS_LIST, MASTERSHEET, PROJECT_APS, CC_FREEZER_STOCK,
  DEFAULT_OTHER_SAMPLES, buildRunLayout, nextRunNo, nextDsId,
  type DSRecord, type SampleRow, type OtherSamplesConfig, type ApsEntry,
  loadDsRecords, persistDsRecords, addDsRecord,
} from "./data";
import { runCols, TYPE_COLORS } from "./runColumns";

const { Option } = Select;

const OTHER_SAMPLE_OPTIONS: { key: keyof OtherSamplesConfig; label: string }[] = [
  { key:"ses",    label:"SES" },
  { key:"sp",     label:"SP" },
  { key:"blkBlk", label:"BLK/BLK" },
  { key:"lloq",   label:"LLOQ" },
  { key:"uloq",   label:"ULOQ" },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function DistributionPage() {
  const [records, setRecords] = useState<DSRecord[]>(() => loadDsRecords());

  // project gate
  const [selectedProject, setSelectedProject] = useState<string | undefined>();

  // filters
  const [filterStatus,  setFilterStatus]  = useState<string | undefined>();
  const [filterAnalyte, setFilterAnalyte] = useState<string | undefined>();

  // modals
  const [detailDs,    setDetailDs]    = useState<DSRecord | null>(null);
  const [retrievalDs, setRetrievalDs] = useState<DSRecord | null>(null);
  const [approveDs,   setApproveDs]   = useState<DSRecord | null>(null);
  const [approvePass, setApprovePass] = useState("");

  // retrieval form
  const [retUrgency, setRetUrgency] = useState("normal");
  const [retNotes,   setRetNotes]   = useState("");

  // ── Drawer state ──────────────────────────────────────────────────────────
  const [drawerOpen,       setDrawerOpen]       = useState(false);
  const [dProject,         setDProject]         = useState("");
  const [dAnalyte,         setDAnalyte]         = useState("");
  const [selectedCcLevels, setSelectedCcLevels] = useState<Set<number>>(new Set());
  const [selectedQcTypes,  setSelectedQcTypes]  = useState<Set<string>>(new Set());
  const [dQcSets,          setDQcSets]          = useState(1);
  const [dOtherSamples,    setDOtherSamples]    = useState<OtherSamplesConfig>({ ...DEFAULT_OTHER_SAMPLES });
  const [dRunName,         setDRunName]         = useState("");
  const [sheetRows,        setSheetRows]        = useState<SampleRow[]>([]);
  const [sheetBuilt,       setSheetBuilt]       = useState(false);
  const [sheetLocked,      setSheetLocked]      = useState(false);
  const [dragIdx,          setDragIdx]          = useState<number | null>(null);
  const [dragOverIdx,      setDragOverIdx]      = useState<number | null>(null);

  // ── Derived ───────────────────────────────────────────────────────────────

  const ledgerFiltered = records.filter(r => {
    const mP = r.project === selectedProject;
    const mS = !filterStatus  || r.status  === filterStatus;
    const mA = !filterAnalyte || r.analyte === filterAnalyte;
    return mP && mS && mA;
  });

  const projectRecords = records.filter(r => r.project === selectedProject);
  const counts = {
    total:     projectRecords.length,
    pending:   projectRecords.filter(r => r.status === "pending").length,
    approved:  projectRecords.filter(r => r.status === "approved").length,
    retrieved: projectRecords.filter(r => r.status === "retrieved").length,
  };

  const analyteOptions = PROJECTS_LIST.find(p => p.id === selectedProject)?.analytes ?? [];

  const dApsData     = dProject && dAnalyte ? PROJECT_APS[dProject]?.[dAnalyte] : undefined;
  const ccTubesStock = dProject && dAnalyte ? (CC_FREEZER_STOCK[dProject]?.[dAnalyte] ?? 0) : 0;
  const ccAvailSets  = dApsData ? Math.floor(ccTubesStock / dApsData.ccLevels) : 0;

  const sheetCcCount      = sheetRows.filter(r => r.type === "Subject").length;
  const dilutedCount      = sheetRows.filter(r => r.type === "Subject" && r.dilution?.trim()).length;
  const undilutedCount    = sheetCcCount - dilutedCount;

  // ── Drawer handlers ───────────────────────────────────────────────────────

  function openDrawer() {
    if (selectedProject) setDProject(selectedProject);
    setDrawerOpen(true);
  }

  function resetDrawer() {
    setDProject(selectedProject ?? ""); setDAnalyte("");
    setSelectedCcLevels(new Set()); setSelectedQcTypes(new Set());
    setDQcSets(1); setDOtherSamples({ ...DEFAULT_OTHER_SAMPLES }); setDRunName("");
    setSheetRows([]); setSheetBuilt(false); setSheetLocked(false);
    setDragIdx(null); setDragOverIdx(null);
  }

  function handleDrawerProject(v: string) {
    setDProject(v); setDAnalyte("");
    setSelectedCcLevels(new Set()); setSelectedQcTypes(new Set());
    setSheetRows([]); setSheetBuilt(false); setSheetLocked(false);
  }

  function handleDrawerAnalyte(v: string) {
    setDAnalyte(v);
    setSheetRows([]); setSheetBuilt(false); setSheetLocked(false);
    const aps = PROJECT_APS[dProject]?.[v];
    if (aps) {
      setSelectedCcLevels(new Set(Array.from({ length: aps.ccLevels }, (_, i) => i)));
      setSelectedQcTypes(new Set(aps.qc.map(q => q.name)));
    }
  }

  function buildSheet() {
    if (!dApsData || !dProject || !dAnalyte) return;
    const filteredAps: ApsEntry = {
      ...dApsData,
      ccLevels: selectedCcLevels.size,
      ccConcs:  dApsData.ccConcs.filter((_, i) => selectedCcLevels.has(i)),
      qc:       dApsData.qc.filter(q => selectedQcTypes.has(q.name)),
    };
    const masterSamples = MASTERSHEET.filter(s => s.project === dProject && s.analyte === dAnalyte);
    const runNo = nextRunNo(loadDsRecords(), dProject, dAnalyte);
    const rows  = buildRunLayout(filteredAps, masterSamples, runNo, dQcSets, dOtherSamples);
    setSheetRows(rows);
    setSheetBuilt(true);
    setSheetLocked(false);
  }

  function updateDilution(idx: number, value: string) {
    if (sheetLocked) return;
    setSheetRows(prev => prev.map((r, i) => i === idx ? { ...r, dilution: value } : r));
  }

  function handleDragStart(e: React.DragEvent, idx: number) {
    if (sheetLocked) { e.preventDefault(); return; }
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(idx);
  }

  function handleDrop(e: React.DragEvent, dropIdx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === dropIdx) { setDragIdx(null); setDragOverIdx(null); return; }
    const next = [...sheetRows];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(dropIdx, 0, moved);
    setSheetRows(next.map((r, i) => ({ ...r, pos: i + 1 })));
    setDragIdx(null); setDragOverIdx(null);
  }

  function saveSheet() {
    if (!dRunName.trim()) { message.warning("Enter a run / experiment name to save"); return; }
    if (!dApsData) return;
    const proj = PROJECTS_LIST.find(p => p.id === dProject);
    if (!proj) return;
    const existing = loadDsRecords();
    const runNo = nextRunNo(existing, dProject, dAnalyte);
    const id    = nextDsId(existing, dProject, dAnalyte, runNo);
    const newDs: DSRecord = {
      id,
      project:         dProject,
      projectName:     proj.name,
      analyte:         dAnalyte,
      aps:             dApsData.aps,
      runNo,
      ccLevels:        sheetRows.filter(r => r.type === "CC").length,
      qcSamples:       sheetRows.filter(r => r.type === "QC").length,
      subjectSamples:  sheetRows.filter(r => r.type === "Subject").length,
      totalPositions:  sheetRows.length,
      status:          "pending",
      createdBy:       "A. Liang",
      createdAt:       new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }),
      runName:         dRunName.trim(),
      locked:          sheetLocked,
      rows:            sheetRows,
    };
    addDsRecord(newDs);
    setRecords(loadDsRecords());
    message.success(`${id} — "${dRunName}" saved · submitted for Project Leader approval`);
    setDrawerOpen(false);
    resetDrawer();
  }

  function exportSheet() {
    const headers = [
      "Pos","Type","Level","Sample Name","Subject","Period",
      "Time Pt (h)","Nominal Conc (ng/mL)","Dilution Factor",
    ];
    const rows = sheetRows.map(r => [
      String(r.pos), r.type, r.level ?? "", r.name,
      r.subject ?? "", r.period ?? "", r.tp ?? "", r.conc ?? "",
      r.type === "Subject"
        ? (r.dilution?.trim() ? r.dilution : "Undiluted")
        : (r.conc ?? ""),
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `${dRunName.trim() || "distribution-sheet"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success("Exported — CC/QC concentrations + dilution factors");
  }

  // ── Drawer sheet columns ──────────────────────────────────────────────────

  const drawerSheetCols = [
    {
      title: "", key: "drag", width: 28,
      render: () => (
        <GripVertical size={13} style={{ color:"var(--text-muted)", cursor: sheetLocked ? "not-allowed" : "grab" }} />
      ),
    },
    {
      title: "Pos", dataIndex: "pos", key: "pos", width: 40,
      render: (v: number) => <span style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"monospace" }}>{v}</span>,
    },
    {
      title: "Type", dataIndex: "type", key: "type", width: 90,
      render: (v: string, r: SampleRow) => {
        const s = TYPE_COLORS[v] ?? { bg:"var(--bg-card)", color:"var(--text-secondary)" };
        return (
          <span style={{ background:s.bg, color:s.color, padding:"2px 6px", borderRadius:4, fontSize:10, fontWeight:600 }}>
            {v}{r.level ? ` ${r.level}` : ""}
          </span>
        );
      },
    },
    {
      title: "Sample Name", dataIndex: "name", key: "name",
      render: (v: string) => <span style={{ fontSize:11 }}>{v}</span>,
    },
    {
      title: "Subj / Period", key: "subj", width: 95,
      render: (_: unknown, r: SampleRow) => r.subject
        ? <span style={{ fontFamily:"monospace", fontSize:11, fontWeight:600 }}>{r.subject} / {r.period ?? "—"}</span>
        : <span style={{ color:"var(--text-muted)", fontSize:11 }}>—</span>,
    },
    {
      title: "TP (h)", dataIndex: "tp", key: "tp", width: 62,
      render: (v: string) => v
        ? <span style={{ fontFamily:"monospace", fontSize:11 }}>{v}</span>
        : <span style={{ color:"var(--text-muted)", fontSize:11 }}>—</span>,
    },
    {
      title: (
        <Tooltip title="For Subject samples: type the dilution factor (e.g. 2×, 10×) or leave blank for undiluted. CC/QC concentrations are auto-populated from APS.">
          <span style={{ cursor:"help", borderBottom:"1px dashed var(--border)" }}>Dilution / Conc</span>
        </Tooltip>
      ),
      key: "dilution", width: 130,
      render: (_: unknown, r: SampleRow, idx: number) => {
        if (r.type === "Subject") {
          return (
            <Input
              size="small"
              placeholder="e.g. 2× or 10×"
              value={r.dilution ?? ""}
              disabled={sheetLocked}
              onChange={e => updateDilution(idx, e.target.value)}
              style={{
                width: 110, fontSize: 11,
                borderColor: r.dilution?.trim() ? "#E65100" : undefined,
                background:  r.dilution?.trim() ? "#FFF3E0" : undefined,
              }}
            />
          );
        }
        return (
          <span style={{ fontFamily:"monospace", fontSize:11, fontWeight:500, color:"var(--text-secondary)" }}>
            {r.conc ?? "—"}
          </span>
        );
      },
    },
  ];

  // ── Ledger actions ────────────────────────────────────────────────────────

  function confirmApprove() {
    if (!approveDs) return;
    const approvedAt = new Date().toLocaleDateString("en-GB",{ day:"2-digit", month:"short", year:"numeric" });
    setRecords(prev => {
      const next = prev.map(r =>
        r.id === approveDs.id ? { ...r, status:"approved" as const, approvedBy:"J. Chen", approvedAt } : r
      );
      persistDsRecords(next);
      return next;
    });
    message.success(`${approveDs.id} approved`);
    setApproveDs(null); setApprovePass("");
  }

  function sendRetrieval() {
    if (!retrievalDs) return;
    const reqId = `RET-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
    setRecords(prev => {
      const next = prev.map(r =>
        r.id === retrievalDs.id ? { ...r, status:"retrieved" as const, retrievalReqId: reqId } : r
      );
      persistDsRecords(next);
      return next;
    });
    message.success(`Retrieval request ${reqId} sent to Freezer Room`);
    setRetrievalDs(null); setRetUrgency("normal"); setRetNotes("");
  }

  // ── Ledger table columns ──────────────────────────────────────────────────

  const ledgerCols = [
    {
      title:"DS ID", dataIndex:"id", key:"id",
      render:(v:string) => <span style={{ fontFamily:"monospace", fontSize:12, fontWeight:700, color:"var(--accent)" }}>{v}</span>,
    },
    {
      title:"Project", key:"proj",
      render:(_:unknown, r:DSRecord) => (
        <div>
          <div style={{ fontFamily:"monospace", fontSize:11, fontWeight:600 }}>{r.project}</div>
          <div style={{ fontSize:10, color:"var(--text-muted)" }}>{r.projectName}</div>
        </div>
      ),
    },
    {
      title:"Analyte", dataIndex:"analyte", key:"analyte",
      render:(v:string) => <Tag style={{ fontSize:11, fontFamily:"monospace", fontWeight:600 }}>{v}</Tag>,
    },
    {
      title:"Run Name", key:"runName",
      render:(_:unknown, r:DSRecord) => r.runName
        ? <span style={{ fontSize:11, color:"var(--text-secondary)" }}>{r.runName}</span>
        : <span style={{ fontSize:11, color:"var(--text-muted)" }}>—</span>,
    },
    {
      title:"APS", dataIndex:"aps", key:"aps",
      render:(v:string) => <span style={{ fontFamily:"monospace", fontSize:11, color:"var(--text-secondary)" }}>{v}</span>,
    },
    {
      title:"Run", dataIndex:"runNo", key:"runNo",
      render:(v:number) => <span style={{ fontFamily:"monospace", fontWeight:700, fontSize:13 }}>#{v}</span>,
    },
    {
      title:"Composition", key:"comp",
      render:(_:unknown, r:DSRecord) => (
        <div className="flex gap-1">
          {[
            { label:`CC×${r.ccLevels}`,       bg:"#E8F0FB",           color:"#3A6B9B" },
            { label:`QC×${r.qcSamples}`,      bg:"var(--accent-light)", color:"var(--accent)" },
            { label:`Subj×${r.subjectSamples}`,bg:"var(--bg-card)",   color:"var(--text-secondary)" },
          ].map(c => (
            <span key={c.label} style={{ fontSize:10, fontWeight:600, background:c.bg, color:c.color, padding:"1px 6px", borderRadius:4 }}>{c.label}</span>
          ))}
          <span style={{ fontSize:10, color:"var(--text-muted)", marginLeft:2 }}>{r.totalPositions} pos.</span>
        </div>
      ),
    },
    {
      title:"Status", dataIndex:"status", key:"status",
      render:(v:string) => <StatusTag status={v} />,
    },
    {
      title:"Created", key:"created",
      render:(_:unknown, r:DSRecord) => (
        <div>
          <div style={{ fontSize:12 }}>{r.createdAt}</div>
          <div style={{ fontSize:10, color:"var(--text-muted)" }}>{r.createdBy}</div>
        </div>
      ),
    },
    {
      title:"Approval", key:"approval",
      render:(_:unknown, r:DSRecord) => r.approvedBy
        ? <div>
            <div style={{ fontSize:11, color:"var(--status-pass)", fontWeight:600 }}>✓ {r.approvedBy}</div>
            <div style={{ fontSize:10, color:"var(--text-muted)" }}>{r.approvedAt}</div>
          </div>
        : r.status === "pending"
          ? <button
              onClick={() => { setApproveDs(r); setApprovePass(""); }}
              style={{ fontSize:11, fontWeight:600, color:"#1565c0", background:"#e3f2fd", border:"1px solid #90caf9", borderRadius:5, padding:"2px 8px", cursor:"pointer" }}>
              Approve
            </button>
          : <span style={{ fontSize:11, color:"var(--text-muted)" }}>—</span>,
    },
    {
      title:"Retrieval", key:"retrieval",
      render:(_:unknown, r:DSRecord) => r.retrievalReqId
        ? <div>
            <div style={{ fontSize:11, fontWeight:600, color:"var(--status-info)" }}>↑ {r.retrievalReqId}</div>
            <div style={{ fontSize:10, color:"var(--text-muted)" }}>Sent</div>
          </div>
        : r.status === "approved"
          ? <Button size="small" icon={<Snowflake size={11} />}
              style={{ fontSize:11, fontWeight:600, color:"var(--status-info)", borderColor:"var(--status-info)" }}
              onClick={() => setRetrievalDs(r)}>
              Request
            </Button>
          : <span style={{ fontSize:11, color:"var(--text-muted)" }}>—</span>,
    },
    {
      title:"", key:"actions",
      render:(_:unknown, r:DSRecord) => (
        <Button size="small" icon={<Eye size={11} />}
          style={{ fontSize:11 }}
          onClick={() => setDetailDs(r)}>
          View
        </Button>
      ),
    },
  ];

  // ── Retrieval samples ─────────────────────────────────────────────────────

  const retrievalSamples = useMemo(() => {
    if (!retrievalDs) return [];
    if (retrievalDs.rows) return retrievalDs.rows.filter(r => r.type === "Subject");
    return MASTERSHEET.filter(s => s.project === retrievalDs.project && s.analyte === retrievalDs.analyte).slice(0, retrievalDs.subjectSamples);
  }, [retrievalDs]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="page-container">

        {/* Header */}
        <div className="mb-6">
          <h1 className="section-title">Distribution Sheet</h1>
          <p className="section-subtitle">
            Project-linked run preparation from Mastersheet · approval workflow · retrieval request to Freezer Room
          </p>
        </div>

        {/* Project selector */}
        <div className="rounded-xl p-5 mb-6" style={{ background:"white", border:"1px solid var(--border)" }}>
          <div className="block-label mb-2">Project Number <span style={{ color:"var(--status-fail)" }}>*</span></div>
          <Select
            style={{ width:360 }} size="large"
            placeholder="Select a project number to view its Distribution Sheets…"
            value={selectedProject} allowClear
            onChange={(v) => { setSelectedProject(v); setFilterAnalyte(undefined); setFilterStatus(undefined); }}
          >
            {PROJECTS_LIST.map(p => (
              <Option key={p.id} value={p.id}>
                <span style={{ fontFamily:"monospace", fontWeight:600, color:"var(--accent)" }}>{p.id}</span>
                <span style={{ color:"var(--text-muted)", marginLeft:8, fontSize:12 }}>— {p.name}</span>
              </Option>
            ))}
          </Select>
        </div>

        {!selectedProject ? (
          <div className="flex flex-col items-center py-16 rounded-xl"
            style={{ border:"1px dashed var(--border)", color:"var(--text-muted)" }}>
            <PackageSearch size={28} style={{ marginBottom:8 }} />
            <span style={{ fontSize:13 }}>Select a project number above to view its Distribution Sheets</span>
          </div>
        ) : (
          <>
            {/* Summary chips + New DS */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-3">
                {[
                  { label:"Total DS",        value:counts.total,     color:"var(--text-secondary)" },
                  { label:"Pending Approval", value:counts.pending,  color:"var(--status-warn)" },
                  { label:"Approved",         value:counts.approved, color:"var(--status-pass)" },
                  { label:"Retrieved",        value:counts.retrieved,color:"var(--status-info)" },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2 px-4 py-2.5 rounded-lg"
                    style={{ background:"white", border:"1px solid var(--border)" }}>
                    <span style={{ fontSize:20, fontWeight:700, fontFamily:"DM Serif Display, serif", color:s.color }}>{s.value}</span>
                    <span style={{ fontSize:12, color:"var(--text-secondary)" }}>{s.label}</span>
                  </div>
                ))}
              </div>
              <Button type="primary" icon={<Plus size={14} />} onClick={openDrawer}>
                New Distribution / Sample Distribution Preparation
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-4">
              <Select placeholder="Analyte" style={{ width:130 }} allowClear value={filterAnalyte} onChange={setFilterAnalyte}>
                {analyteOptions.map(a => <Option key={a} value={a}>{a}</Option>)}
              </Select>
              <Select placeholder="Status" style={{ width:160 }} allowClear value={filterStatus} onChange={setFilterStatus}>
                <Option value="draft">Draft</Option>
                <Option value="pending">Pending</Option>
                <Option value="approved">Approved</Option>
                <Option value="retrieved">Retrieved</Option>
                <Option value="rejected">Rejected</Option>
              </Select>
            </div>

            {/* Ledger */}
            <div className="rounded-xl overflow-hidden" style={{ border:"1px solid var(--border)", background:"white" }}>
              <Table
                dataSource={ledgerFiltered}
                columns={ledgerCols}
                rowKey="id"
                size="small"
                pagination={{ pageSize:10, showSizeChanger:false }}
                rowClassName={(r) => r.status === "rejected" ? "opacity-50" : ""}
              />
            </div>
          </>
        )}


        {/* ══════════════════════════════════════════════════════
            NEW DISTRIBUTION SHEET — DRAWER
        ══════════════════════════════════════════════════════ */}
        <Drawer
          title={
            <div>
              <div style={{ fontFamily:"DM Serif Display, serif", fontSize:18 }}>
                New Distribution / Sample Distribution Preparation
              </div>
              <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2, fontFamily:"inherit", fontWeight:400 }}>
                Select project &amp; CCQC → review calibration sets in freezer → build sheet → add dilution factors → lock &amp; save
              </div>
            </div>
          }
          open={drawerOpen}
          onClose={() => { setDrawerOpen(false); resetDrawer(); }}
          width={1140}
          styles={{
            body: { padding:0, display:"flex", overflow:"hidden", height:"100%" },
            header: { borderBottom:"1px solid var(--border)", background:"var(--bg-card)", padding:"16px 20px" },
          }}
        >
          {/* ── LEFT: Selection Panel ── */}
          <div style={{
            width: 340, flexShrink:0,
            overflowY:"auto", padding:"20px 16px",
            borderRight:"1px solid var(--border)",
            background:"var(--bg-card)",
            display:"flex", flexDirection:"column", gap:18,
          }}>

            {/* 1. Project & CCQC */}
            <div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase",
                color:"var(--text-muted)", marginBottom:10 }}>
                1 · Project &amp; CCQC
              </div>

              <div style={{ marginBottom:10 }}>
                <div className="block-label mb-1.5">Project Number <span style={{ color:"var(--status-fail)" }}>*</span></div>
                <Select
                  style={{ width:"100%" }} size="middle"
                  placeholder="Select project…"
                  value={dProject || undefined}
                  onChange={handleDrawerProject}
                >
                  {PROJECTS_LIST.map(p => (
                    <Option key={p.id} value={p.id}>
                      <span style={{ fontFamily:"monospace", fontWeight:600, color:"var(--accent)", fontSize:12 }}>{p.id}</span>
                      <span style={{ color:"var(--text-muted)", marginLeft:6, fontSize:11 }}>— {p.name}</span>
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <div className="block-label mb-1.5">
                  CCQC (Calibration Curve &amp; QC) <span style={{ color:"var(--status-fail)" }}>*</span>
                </div>
                <Select
                  style={{ width:"100%" }} size="middle"
                  placeholder={dProject ? "Select CCQC / Analyte…" : "Select project first"}
                  value={dAnalyte || undefined}
                  onChange={handleDrawerAnalyte}
                  disabled={!dProject}
                >
                  {(PROJECTS_LIST.find(p => p.id === dProject)?.analytes ?? []).map(a => (
                    <Option key={a} value={a}>
                      <span style={{ fontFamily:"monospace", fontWeight:700, fontSize:13 }}>{a}</span>
                    </Option>
                  ))}
                </Select>
              </div>

              {dApsData && (
                <div className="mt-3 rounded-lg px-3 py-2" style={{ background:"var(--accent-light)", border:"1px solid #c2d4b8" }}>
                  <div style={{ fontSize:10, color:"var(--accent)", fontWeight:600, marginBottom:4 }}>
                    APS {dApsData.aps} · LLOQ {dApsData.lloq} – ULOQ {dApsData.uloq} ng/mL
                  </div>
                  <div style={{ fontSize:10, color:"var(--accent)" }}>
                    {dApsData.ccLevels} CC levels · {dApsData.qc.length} QC types
                  </div>
                </div>
              )}
            </div>

            {/* 2. Calibration Curve Levels */}
            {dApsData && (
              <div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase",
                  color:"var(--text-muted)", marginBottom:10 }}>
                  2 · Calibration Curve Levels
                </div>

                {/* Freezer availability */}
                <div className="rounded-lg px-3 py-2.5 mb-3 flex items-center gap-3"
                  style={{
                    background: ccAvailSets === 0 ? "var(--status-fail-bg)" : ccAvailSets === 1 ? "var(--status-warn-bg)" : "var(--status-pass-bg)",
                    border: `1px solid ${ccAvailSets === 0 ? "#e8c4c4" : ccAvailSets === 1 ? "#f0d58c" : "#a0cbb0"}`,
                  }}>
                  <Thermometer size={14} style={{ color: ccAvailSets === 0 ? "var(--status-fail)" : ccAvailSets === 1 ? "var(--status-warn)" : "var(--status-pass)", flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:11, fontWeight:700,
                      color: ccAvailSets === 0 ? "var(--status-fail)" : ccAvailSets === 1 ? "var(--status-warn)" : "var(--status-pass)" }}>
                      {ccAvailSets === 0 ? "No sets available" : `${ccAvailSets} calibration set${ccAvailSets !== 1 ? "s" : ""} available`}
                    </div>
                    <div style={{ fontSize:10, color:"var(--text-muted)" }}>
                      {ccTubesStock} tubes ÷ {dApsData.ccLevels} levels in Freezer Room
                    </div>
                  </div>
                </div>

                {/* CC level checkboxes — auto-selected */}
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {dApsData.ccConcs.map((conc, i) => (
                    <label key={i} style={{
                      display:"flex", alignItems:"center", gap:8,
                      padding:"5px 8px", borderRadius:6, cursor:"pointer",
                      background: selectedCcLevels.has(i) ? "white" : "transparent",
                      border: `1px solid ${selectedCcLevels.has(i) ? "var(--accent)" : "var(--border)"}`,
                      transition:"all 0.1s",
                    }}>
                      <Checkbox
                        checked={selectedCcLevels.has(i)}
                        onChange={e => {
                          const next = new Set(selectedCcLevels);
                          e.target.checked ? next.add(i) : next.delete(i);
                          setSelectedCcLevels(next);
                        }}
                      />
                      <span style={{ fontSize:10, fontWeight:700, color:"var(--accent)", fontFamily:"monospace", minWidth:28 }}>
                        CC{i + 1}
                      </span>
                      <span style={{ fontSize:11, fontFamily:"monospace", color:"var(--text-secondary)" }}>
                        {conc} ng/mL
                      </span>
                    </label>
                  ))}
                </div>
                <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:6 }}>
                  {selectedCcLevels.size} of {dApsData.ccLevels} CC levels selected
                </div>
              </div>
            )}

            {/* 3. Quality Control */}
            {dApsData && (
              <div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase",
                  color:"var(--text-muted)", marginBottom:10 }}>
                  3 · Quality Control
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:12 }}>
                  {dApsData.qc.map(q => (
                    <label key={q.name} style={{
                      display:"flex", alignItems:"center", gap:8,
                      padding:"5px 8px", borderRadius:6, cursor:"pointer",
                      background: selectedQcTypes.has(q.name) ? "var(--accent-light)" : "transparent",
                      border: `1px solid ${selectedQcTypes.has(q.name) ? "var(--accent)" : "var(--border)"}`,
                      transition:"all 0.1s",
                    }}>
                      <Checkbox
                        checked={selectedQcTypes.has(q.name)}
                        onChange={e => {
                          const next = new Set(selectedQcTypes);
                          e.target.checked ? next.add(q.name) : next.delete(q.name);
                          setSelectedQcTypes(next);
                        }}
                      />
                      <span style={{ fontSize:11, fontWeight:700, color:"var(--accent)", minWidth:58 }}>{q.name}</span>
                      <span style={{ fontSize:11, fontFamily:"monospace", color:"var(--text-secondary)" }}>{q.conc} ng/mL</span>
                    </label>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="block-label" style={{ whiteSpace:"nowrap" }}>QC Sets</div>
                  <InputNumber
                    min={1} max={5} value={dQcSets}
                    onChange={v => setDQcSets(v ?? 1)}
                    style={{ width:70 }} size="small"
                  />
                  <span style={{ fontSize:11, color:"var(--text-muted)" }}>
                    (HQC/LQC bracketing, MQC interspersed every 6 samples)
                  </span>
                </div>
              </div>
            )}

            {/* 4. Other Samples */}
            {dApsData && (
              <div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase",
                  color:"var(--text-muted)", marginBottom:10 }}>
                  4 · Other Samples
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {OTHER_SAMPLE_OPTIONS.map(o => (
                    <label key={o.key} style={{
                      display:"flex", alignItems:"center", gap:6,
                      padding:"4px 10px", borderRadius:6, cursor:"pointer",
                      background: dOtherSamples[o.key] ? "#F0EBF5" : "white",
                      border:`1px solid ${dOtherSamples[o.key] ? "#9B72C4" : "var(--border)"}`,
                      fontSize:12, fontWeight:600,
                      color: dOtherSamples[o.key] ? "#6B4E8A" : "var(--text-secondary)",
                      transition:"all 0.1s",
                    }}>
                      <Checkbox
                        checked={dOtherSamples[o.key]}
                        onChange={e => setDOtherSamples(prev => ({ ...prev, [o.key]: e.target.checked }))}
                      />
                      {o.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Run / Experiment Name */}
            <div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase",
                color:"var(--text-muted)", marginBottom:8 }}>
                5 · Run / Experiment Name
              </div>
              <Input
                placeholder="e.g. Run 12 MET BE Study P1…"
                value={dRunName}
                onChange={e => setDRunName(e.target.value)}
                style={{ borderColor: dRunName ? "var(--accent)" : undefined }}
              />
              <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:4 }}>
                Used as the filename when exporting and for identifying this run in the ledger.
              </div>
            </div>

            {/* Build Sheet button */}
            <Button
              type="primary" block size="large"
              icon={<FlaskConical size={14} />}
              disabled={!dProject || !dAnalyte || !dApsData || selectedCcLevels.size === 0}
              onClick={buildSheet}
              style={{ marginTop:"auto" }}
            >
              {sheetBuilt ? "Rebuild Sheet" : "Build Sheet"}
            </Button>

            {sheetBuilt && (
              <div style={{ fontSize:11, color:"var(--text-muted)", textAlign:"center", marginTop:-10 }}>
                Subject samples are auto-populated from the Mastersheet.
                Drag rows to reorder.
              </div>
            )}
          </div>

          {/* ── RIGHT: Distribution Sheet ── */}
          <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>

            {!sheetBuilt ? (
              <div className="flex flex-col items-center justify-center" style={{ flex:1, color:"var(--text-muted)" }}>
                <FlaskConical size={36} style={{ marginBottom:12, opacity:0.3 }} />
                <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>No sheet built yet</div>
                <div style={{ fontSize:12 }}>Select a Project + CCQC and click "Build Sheet" to populate the distribution sheet.</div>
              </div>
            ) : (
              <>
                {/* Info bar */}
                <div style={{ padding:"12px 20px", borderBottom:"1px solid var(--border)", background:"var(--accent-light)" }}>
                  <div className="flex items-center justify-between">
                    <div style={{ fontSize:12, color:"var(--accent)", fontWeight:500 }}>
                      {dProject} · {dAnalyte} · APS {dApsData?.aps} · {sheetRows.length} total positions
                      {dRunName && <span style={{ marginLeft:12, fontWeight:700 }}>— "{dRunName}"</span>}
                    </div>
                    {sheetLocked && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                        style={{ background:"var(--status-warn-bg)", border:"1px solid #f0d58c" }}>
                        <Lock size={11} style={{ color:"var(--status-warn)" }} />
                        <span style={{ fontSize:11, fontWeight:700, color:"var(--status-warn)" }}>LOCKED</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary chips */}
                <div className="flex gap-2 px-5 py-3" style={{ borderBottom:"1px solid var(--border)", background:"white", flexWrap:"wrap" }}>
                  {[
                    { label:"CC",       value:sheetRows.filter(r=>r.type==="CC").length,      color:"#3A6B9B",              bg:"#E8F0FB" },
                    { label:"QC",       value:sheetRows.filter(r=>r.type==="QC").length,      color:"var(--accent)",        bg:"var(--accent-light)" },
                    { label:"Subjects", value:sheetRows.filter(r=>r.type==="Subject").length, color:"var(--text-primary)",  bg:"var(--bg-card)" },
                    { label:"Other",    value:sheetRows.filter(r=>["SES","SP","BLK/BLK","LLOQ","ULOQ"].includes(r.type)).length, color:"#6B4E8A", bg:"#F0EBF5" },
                    { label:"Total",    value:sheetRows.length,                               color:"var(--text-secondary)",bg:"var(--bg-card)" },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
                      style={{ background:s.bg, border:`1px solid ${s.color}22` }}>
                      <span style={{ fontSize:16, fontWeight:700, fontFamily:"DM Serif Display, serif", color:s.color }}>{s.value}</span>
                      <span style={{ fontSize:11, color:"var(--text-secondary)" }}>{s.label}</span>
                    </div>
                  ))}
                  {/* Dilution summary */}
                  {sheetCcCount > 0 && (
                    <div className="flex items-center gap-2 ml-auto rounded-lg px-3 py-1.5"
                      style={{ background:"white", border:"1px solid var(--border)" }}>
                      <span style={{ fontSize:11, color:"#E65100", fontWeight:600 }}>{dilutedCount} diluted</span>
                      <span style={{ fontSize:11, color:"var(--text-muted)" }}>·</span>
                      <span style={{ fontSize:11, color:"var(--text-secondary)" }}>{undilutedCount} undiluted</span>
                    </div>
                  )}
                </div>

                {/* Instruction strip */}
                {!sheetLocked && (
                  <div className="flex items-center gap-2 px-5 py-2" style={{ background:"#FFFDF0", borderBottom:"1px solid #f5e98c" }}>
                    <GripVertical size={12} style={{ color:"var(--text-muted)" }} />
                    <span style={{ fontSize:11, color:"#7A6A00" }}>
                      Drag rows to reorder · Type dilution factors (e.g. <strong>2×</strong> or <strong>10×</strong>) for subject samples · Leave blank = undiluted
                    </span>
                  </div>
                )}

                {/* Draggable table */}
                <div style={{ flex:1, padding:"0 20px 20px", overflowY:"auto" }}>
                  <div style={{ marginTop:12 }}>
                    <Table
                      dataSource={sheetRows}
                      columns={drawerSheetCols}
                      rowKey="pos"
                      size="small"
                      pagination={false}
                      scroll={{ y: "calc(100vh - 380px)" }}
                      onRow={(r, idx) => ({
                        draggable: !sheetLocked,
                        onDragStart: (e: React.DragEvent) => handleDragStart(e, idx!),
                        onDragOver:  (e: React.DragEvent) => handleDragOver(e, idx!),
                        onDragEnter: (e: React.DragEvent) => e.preventDefault(),
                        onDrop:      (e: React.DragEvent) => handleDrop(e, idx!),
                        onDragEnd:   () => { setDragIdx(null); setDragOverIdx(null); },
                        style:{
                          cursor:     sheetLocked ? "default" : "grab",
                          opacity:    dragIdx === idx ? 0.35 : 1,
                          borderTop:  dragOverIdx === idx && dragIdx !== idx ? "2px solid var(--accent)" : undefined,
                          background: dragOverIdx === idx && dragIdx !== idx
                            ? "var(--accent-light)"
                            : r.type === "QC"     ? "var(--accent-light)"
                            : r.type === "CC"     ? "#f0f5fb"
                            : "transparent",
                          transition: "opacity 0.1s",
                        },
                      })}
                    />
                  </div>
                </div>

                {/* Footer: Lock / Save / Export */}
                <div style={{
                  padding:"14px 20px",
                  borderTop:"1px solid var(--border)",
                  background:"white",
                  display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
                }}>
                  <div className="flex items-center gap-2">
                    <Button
                      icon={sheetLocked ? <Unlock size={13} /> : <Lock size={13} />}
                      onClick={() => setSheetLocked(prev => !prev)}
                      style={{
                        borderColor: sheetLocked ? "var(--status-warn)" : "var(--border)",
                        color:       sheetLocked ? "var(--status-warn)" : "var(--text-secondary)",
                        fontWeight:  sheetLocked ? 700 : 400,
                      }}
                    >
                      {sheetLocked ? "Unlock Sheet" : "Lock Sheet"}
                    </Button>
                    {sheetLocked && (
                      <span style={{ fontSize:11, color:"var(--status-warn)" }}>
                        Sheet is locked — dilution factors and order are frozen.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Tooltip title={!dRunName.trim() ? "Enter a run/experiment name to save" : ""}>
                      <Button
                        icon={<FileDown size={13} />}
                        onClick={exportSheet}
                        disabled={sheetRows.length === 0}
                        style={{ color:"var(--text-secondary)" }}
                      >
                        Export CSV
                      </Button>
                    </Tooltip>
                    <Tooltip title={!dRunName.trim() ? "Enter a run/experiment name first" : ""}>
                      <Button
                        type="primary"
                        icon={<CheckCircle2 size={13} />}
                        disabled={!dRunName.trim() || sheetRows.length === 0}
                        onClick={saveSheet}
                      >
                        Save &amp; Submit for Approval
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </>
            )}
          </div>
        </Drawer>


        {/* ══════════════════════════════════════════════════════
            DS DETAIL MODAL
        ══════════════════════════════════════════════════════ */}
        <Modal
          title={
            <div>
              <span style={{ fontFamily:"DM Serif Display, serif", fontSize:18 }}>
                {detailDs?.id}
              </span>
              <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2, fontFamily:"inherit" }}>
                {detailDs?.projectName} · {detailDs?.analyte} · Run #{detailDs?.runNo} · APS {detailDs?.aps}
                {detailDs?.runName && <> · <strong>"{detailDs.runName}"</strong></>}
              </div>
            </div>
          }
          open={!!detailDs}
          onCancel={() => setDetailDs(null)}
          footer={
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <StatusTag status={detailDs?.status ?? "draft"} />
                {detailDs?.approvedBy && (
                  <span style={{ fontSize:11, color:"var(--status-pass)", fontWeight:600 }}>
                    ✓ Approved by {detailDs.approvedBy} · {detailDs.approvedAt}
                  </span>
                )}
                {detailDs?.retrievalReqId && (
                  <span style={{ fontSize:11, color:"var(--status-info)", fontWeight:600 }}>
                    ↑ Retrieval {detailDs.retrievalReqId}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button icon={<Download size={13} />} style={{ color:"var(--text-secondary)" }}>Export</Button>
                {detailDs?.status === "approved" && !detailDs?.retrievalReqId && (
                  <Button type="primary" icon={<Snowflake size={13} />}
                    onClick={() => { setDetailDs(null); setRetrievalDs(detailDs); }}>
                    Request Retrieval
                  </Button>
                )}
                <Button onClick={() => setDetailDs(null)}>Close</Button>
              </div>
            </div>
          }
          width={860}
        >
          {detailDs && (
            <div style={{ marginTop:12 }}>
              <div className="flex items-center gap-4 rounded-xl px-4 py-3 mb-4"
                style={{ background:"var(--accent-light)", border:"1px solid #c2d4b8" }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background:"var(--accent)" }} />
                <span style={{ fontSize:12, color:"var(--accent)", fontWeight:500 }}>
                  {detailDs.project} · {detailDs.analyte} · Run #{detailDs.runNo} · {detailDs.ccLevels} CC levels · {detailDs.qcSamples} QC · {detailDs.subjectSamples} subjects
                </span>
                <span style={{ fontSize:11, color:"var(--accent)", opacity:0.7, marginLeft:"auto" }}>
                  APS {detailDs.aps} · {detailDs.totalPositions} total positions
                </span>
              </div>

              {detailDs.rows ? (
                <div className="rounded-xl overflow-hidden" style={{ border:"1px solid var(--border)", background:"white" }}>
                  <Table
                    dataSource={detailDs.rows}
                    columns={runCols}
                    rowKey="pos"
                    size="small"
                    pagination={false}
                    scroll={{ y:400 }}
                    onRow={(r) => ({
                      style:{ background: r.type === "QC" ? "var(--accent-light)" : r.type === "CC" ? "#f0f5fb" : "transparent" }
                    })}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center py-8" style={{ color:"var(--text-muted)" }}>
                  <PackageSearch size={24} style={{ marginBottom:8 }} />
                  <span style={{ fontSize:13 }}>Run layout not stored — re-prepare to view detail</span>
                </div>
              )}
            </div>
          )}
        </Modal>


        {/* ══════════════════════════════════════════════════════
            APPROVE MODAL
        ══════════════════════════════════════════════════════ */}
        <Modal
          title={<span style={{ fontFamily:"DM Serif Display, serif", fontSize:18 }}>Approve Distribution Sheet</span>}
          open={!!approveDs}
          onCancel={() => { setApproveDs(null); setApprovePass(""); }}
          footer={null}
          width={440}
        >
          {approveDs && (
            <div style={{ padding:"12px 0" }}>
              <div className="rounded-xl p-4 mb-4" style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
                {[
                  { label:"DS ID",     value:approveDs.id },
                  { label:"Project",   value:`${approveDs.project} — ${approveDs.projectName}` },
                  { label:"Analyte",   value:approveDs.analyte },
                  { label:"Run",       value:`#${approveDs.runNo}${approveDs.runName ? ` — "${approveDs.runName}"` : ""}` },
                  { label:"Total Pos", value:String(approveDs.totalPositions) },
                ].map((f,i,arr) => (
                  <div key={f.label} className="flex items-center justify-between py-1.5"
                    style={{ borderBottom: i < arr.length-1 ? "1px solid var(--border)" : "none" }}>
                    <span style={{ fontSize:11, color:"var(--text-muted)", letterSpacing:"0.06em" }}>{f.label}</span>
                    <span style={{ fontSize:12, fontWeight:700, fontFamily:"monospace" }}>{f.value}</span>
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <div className="block-label mb-2">Project Leader E-Signature</div>
                <Input.Password
                  placeholder="Enter password to approve…"
                  value={approvePass}
                  onChange={e => setApprovePass(e.target.value)}
                />
                <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:4 }}>
                  Meaning: &ldquo;I approve this Distribution Sheet for analytical run and Freezer Room retrieval.&rdquo;
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button onClick={() => { setApproveDs(null); setApprovePass(""); }}>Cancel</Button>
                <Button type="primary" icon={<CheckCircle2 size={13} />}
                  disabled={!approvePass}
                  onClick={confirmApprove}>
                  Approve
                </Button>
              </div>
            </div>
          )}
        </Modal>


        {/* ══════════════════════════════════════════════════════
            RETRIEVAL REQUEST MODAL
        ══════════════════════════════════════════════════════ */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <Snowflake size={18} style={{ color:"var(--status-info)" }} />
              <span style={{ fontFamily:"DM Serif Display, serif", fontSize:18 }}>
                Retrieval Request — {retrievalDs?.id}
              </span>
            </div>
          }
          open={!!retrievalDs}
          onCancel={() => { setRetrievalDs(null); setRetUrgency("normal"); setRetNotes(""); }}
          footer={null}
          width={600}
        >
          {retrievalDs && (
            <div style={{ marginTop:16 }}>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label:"Project", value:retrievalDs.project },
                  { label:"Analyte", value:retrievalDs.analyte },
                  { label:"Run No.", value:`#${retrievalDs.runNo}` },
                ].map(f => (
                  <div key={f.label} className="rounded-lg p-3"
                    style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
                    <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:4 }}>{f.label}</div>
                    <div style={{ fontFamily:"monospace", fontWeight:700, fontSize:13, color:"var(--accent)" }}>{f.value}</div>
                  </div>
                ))}
              </div>

              <div className="block-label mb-2">
                Subject Samples to Retrieve from Freezer Room
                <span style={{ fontSize:11, fontWeight:400, color:"var(--text-muted)", marginLeft:6 }}>
                  {retrievalDs.subjectSamples} sample{retrievalDs.subjectSamples !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="rounded-xl overflow-hidden mb-4" style={{ border:"1px solid var(--border)" }}>
                <div className="grid px-3 py-2"
                  style={{ gridTemplateColumns:"1fr 60px 60px 90px 80px", gap:8,
                    background:"var(--bg-card)", borderBottom:"1px solid var(--border)" }}>
                  {["Sample ID","Subj","T.Pt","Freezer","Location"].map(h => (
                    <span key={h} style={{ fontSize:9, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", color:"var(--text-muted)" }}>{h}</span>
                  ))}
                </div>
                {retrievalSamples.map((r, i) => {
                  const ms = MASTERSHEET.find(m => m.id === r.id);
                  return (
                    <div key={r.id} className="grid items-center px-3 py-2"
                      style={{ gridTemplateColumns:"1fr 60px 60px 90px 80px", gap:8,
                        borderBottom: i < retrievalSamples.length-1 ? "1px solid var(--border)" : "none",
                        background:"white" }}>
                      <span style={{ fontSize:10, fontFamily:"monospace", color:"var(--accent)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.id}</span>
                      <span style={{ fontSize:11, fontWeight:600 }}>{r.subject ?? ms?.subject ?? "—"}</span>
                      <span style={{ fontSize:11, fontFamily:"monospace" }}>{r.tp ?? ms?.tp ?? "—"}</span>
                      <span style={{ fontSize:11, color:"var(--status-info)", fontFamily:"monospace" }}>{ms?.freezer ?? "—"}</span>
                      <span style={{ fontSize:10, fontFamily:"monospace" }}>{ms?.location ?? "—"}</span>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="block-label mb-2">Urgency</div>
                  <Select value={retUrgency} onChange={setRetUrgency} style={{ width:"100%" }}>
                    <Option value="normal">Normal — within 4 hours</Option>
                    <Option value="urgent">Urgent — within 1 hour</Option>
                    <Option value="immediate">Immediate — ASAP</Option>
                  </Select>
                </div>
                <div>
                  <div className="block-label mb-2">Notes for Freezer Room</div>
                  <Input.TextArea
                    rows={2}
                    placeholder="Any handling instructions or special notes…"
                    value={retNotes}
                    onChange={e => setRetNotes(e.target.value)}
                    style={{ resize:"none" }}
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg px-4 py-3 mb-4"
                style={{ background:"var(--status-info-bg)", border:"1px solid #9bc0e0" }}>
                <AlertTriangle size={13} style={{ color:"var(--status-info)", flexShrink:0, marginTop:1 }} />
                <span style={{ fontSize:12, color:"var(--status-info)", lineHeight:1.5 }}>
                  Once submitted, the retrieval request will appear in the Freezer Room Retrieval queue. Samples will be physically pulled and transferred to the Bioanalytical lab.
                </span>
              </div>

              <div className="flex justify-end gap-2">
                <Button onClick={() => { setRetrievalDs(null); setRetUrgency("normal"); setRetNotes(""); }}>Cancel</Button>
                <Button type="primary" icon={<Snowflake size={13} />} onClick={sendRetrieval}
                  style={{ background:"var(--status-info)", borderColor:"var(--status-info)" }}>
                  Send Retrieval Request to Freezer Room
                </Button>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </AppLayout>
  );
}
