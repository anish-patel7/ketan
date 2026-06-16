"use client";

import { useState, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatusTag from "@/components/ui/StatusTag";
import {
  Button, Select, Table, Tag, Modal, Input, message,
  Drawer, InputNumber, Checkbox, Tooltip, Tabs,
} from "antd";
import {
  Plus, Download, Eye, CheckCircle2, AlertTriangle, Snowflake,
  PackageSearch, GripVertical, Lock, Unlock, FileDown, FlaskConical,
} from "lucide-react";
import {
  PROJECTS_LIST, MASTERSHEET, PROJECT_APS,
  CC_SETS, QC_SAMPLES, OTHER_SAMPLE_ITEMS,
  buildDistributionSheet, nextRunNo, nextDsId,
  type DSRecord, type SampleRow, type SelectedQcMap,
  type CCSet, type QCSample, type OtherSampleItem,
  loadDsRecords, persistDsRecords, addDsRecord,
} from "./data";
import { runCols, TYPE_COLORS } from "./runColumns";

const { Option } = Select;

const OTHER_TYPES: Array<{ type: OtherSampleItem["type"]; label: string }> = [
  { type:"SES",          label:"SES" },
  { type:"SP",           label:"SP" },
  { type:"BLK/BLK",     label:"BLK / BLK" },
  { type:"LLOQ",         label:"LLOQ" },
  { type:"ULOQ",         label:"ULOQ" },
  { type:"Pooled Plasma",label:"Pooled Plasma" },
  { type:"Matrix Lot",   label:"Matrix Lot" },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function DistributionPage() {
  const [records, setRecords] = useState<DSRecord[]>(() => loadDsRecords());

  const [selectedProject, setSelectedProject] = useState<string | undefined>();
  const [filterStatus,    setFilterStatus]    = useState<string | undefined>();

  // modals
  const [detailDs,    setDetailDs]    = useState<DSRecord | null>(null);
  const [retrievalDs, setRetrievalDs] = useState<DSRecord | null>(null);
  const [approveDs,   setApproveDs]   = useState<DSRecord | null>(null);
  const [approvePass, setApprovePass] = useState("");
  const [retUrgency,  setRetUrgency]  = useState("normal");
  const [retNotes,    setRetNotes]    = useState("");

  // ── Drawer state ──────────────────────────────────────────────────────────
  const [drawerOpen,       setDrawerOpen]       = useState(false);
  const [dProject,         setDProject]         = useState("");
  const [selectedCcSetId,  setSelectedCcSetId]  = useState("");
  const [selectedCcTubeIds,setSelectedCcTubeIds]= useState<Set<string>>(new Set());
  const [selHqc,           setSelHqc]           = useState<string[]>([]);
  const [selMqc,           setSelMqc]           = useState<string[]>([]);
  const [selLqc,           setSelLqc]           = useState<string[]>([]);
  const [selLloqQc,        setSelLloqQc]        = useState<string[]>([]);
  const [dQcSets,          setDQcSets]          = useState(1);
  const [selectedOtherIds, setSelectedOtherIds] = useState<string[]>([]);
  const [dRunName,         setDRunName]         = useState("");
  const [sheetRows,        setSheetRows]        = useState<SampleRow[]>([]);
  const [sheetBuilt,       setSheetBuilt]       = useState(false);
  const [sheetLocked,      setSheetLocked]      = useState(false);
  const [dragIdx,          setDragIdx]          = useState<number | null>(null);
  const [dragOverIdx,      setDragOverIdx]      = useState<number | null>(null);
  const [activeTab,        setActiveTab]        = useState("sheet");

  // ── Derived ───────────────────────────────────────────────────────────────

  const ledgerFiltered = records.filter(r =>
    r.project === selectedProject && (!filterStatus || r.status === filterStatus)
  );

  const projectRecords = records.filter(r => r.project === selectedProject);
  const counts = {
    total:     projectRecords.length,
    pending:   projectRecords.filter(r => r.status === "pending").length,
    approved:  projectRecords.filter(r => r.status === "approved").length,
    retrieved: projectRecords.filter(r => r.status === "retrieved").length,
  };

  const dCcSet   = CC_SETS.find(s => s.id === selectedCcSetId);
  const dAnalyte = dCcSet?.analyte ?? "";
  const dApsData = dProject && dAnalyte ? PROJECT_APS[dProject]?.[dAnalyte] : undefined;

  const ccSetsForProject = CC_SETS.filter(s => s.project === dProject);

  const qcCtx = QC_SAMPLES.filter(s => s.project === dProject && s.analyte === dAnalyte);
  const hqcOptions   = qcCtx.filter(q => q.qcType === "HQC");
  const mqcOptions   = qcCtx.filter(q => q.qcType === "MQC");
  const lqcOptions   = qcCtx.filter(q => q.qcType === "LQC");
  const lloqQcOptions= qcCtx.filter(q => q.qcType === "LLOQ QC");

  const otherCtx = OTHER_SAMPLE_ITEMS.filter(s => s.project === dProject && s.analyte === dAnalyte);
  const otherByType = OTHER_TYPES.reduce<Record<string, OtherSampleItem[]>>((acc, { type }) => {
    acc[type] = otherCtx.filter(o => o.type === type);
    return acc;
  }, {});

  const subjectCount  = sheetRows.filter(r => r.type === "Subject").length;
  const dilutedCount  = sheetRows.filter(r => r.type === "Subject" && r.dilution && r.dilution !== "1").length;

  // ── Drawer handlers ───────────────────────────────────────────────────────

  function openDrawer() {
    if (selectedProject) setDProject(selectedProject);
    setDrawerOpen(true);
  }

  function resetDrawer() {
    setDProject(selectedProject ?? "");
    setSelectedCcSetId(""); setSelectedCcTubeIds(new Set());
    setSelHqc([]); setSelMqc([]); setSelLqc([]); setSelLloqQc([]);
    setDQcSets(1); setSelectedOtherIds([]); setDRunName("");
    setSheetRows([]); setSheetBuilt(false); setSheetLocked(false);
    setDragIdx(null); setDragOverIdx(null); setActiveTab("sheet");
  }

  function handleCcSetSelect(id: string) {
    setSelectedCcSetId(id);
    setSheetRows([]); setSheetBuilt(false); setSheetLocked(false);
    const ccSet = CC_SETS.find(s => s.id === id);
    if (ccSet) {
      setSelectedCcTubeIds(new Set(ccSet.levels.map(l => l.tubeId)));
    }
    setSelHqc([]); setSelMqc([]); setSelLqc([]); setSelLloqQc([]);
    setSelectedOtherIds([]);
  }

  function toggleQcId(
    type: "hqc"|"mqc"|"lqc"|"lloqQc",
    id: string, checked: boolean,
  ) {
    const map = { hqc:[selHqc,setSelHqc], mqc:[selMqc,setSelMqc], lqc:[selLqc,setSelLqc], lloqQc:[selLloqQc,setSelLloqQc] } as const;
    const [cur, set] = map[type] as [string[], React.Dispatch<React.SetStateAction<string[]>>];
    set(checked ? [...cur, id] : cur.filter(x => x !== id));
  }

  function toggleOtherId(id: string, checked: boolean) {
    setSelectedOtherIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
  }

  function buildSheet() {
    if (!dCcSet || !dProject) return;
    const qcIds: SelectedQcMap = { hqc: selHqc, mqc: selMqc, lqc: selLqc, lloqQc: selLloqQc };
    const subjects = MASTERSHEET.filter(s => s.project === dProject && s.analyte === dAnalyte);
    const rows = buildDistributionSheet(
      dCcSet, selectedCcTubeIds, qcIds, subjects,
      selectedOtherIds, QC_SAMPLES, OTHER_SAMPLE_ITEMS, dQcSets,
    );
    setSheetRows(rows);
    setSheetBuilt(true);
    setSheetLocked(false);
    setActiveTab("sheet");
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
    if (!dCcSet) return;
    const proj = PROJECTS_LIST.find(p => p.id === dProject);
    if (!proj) return;
    const existing = loadDsRecords();
    const runNo = nextRunNo(existing, dProject, dAnalyte);
    const id    = nextDsId(existing, dProject, dAnalyte, runNo);
    const newDs: DSRecord = {
      id, project: dProject, projectName: proj.name,
      analyte: dAnalyte, aps: dCcSet.apsRef, runNo,
      ccLevels:       sheetRows.filter(r => r.type === "CC").length,
      qcSamples:      sheetRows.filter(r => r.type === "QC").length,
      subjectSamples: sheetRows.filter(r => r.type === "Subject").length,
      totalPositions: sheetRows.length,
      status: "pending", createdBy: "A. Liang",
      createdAt: new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }),
      runName: dRunName.trim(), locked: sheetLocked, rows: sheetRows,
    };
    addDsRecord(newDs);
    setRecords(loadDsRecords());
    message.success(`${id} — "${dRunName}" saved · submitted for Project Leader approval`);
    setDrawerOpen(false);
    resetDrawer();
  }

  function exportSheet() {
    const headers = ["Sr. No.","Sample ID","Sample Name","Subject","Period","Time Pt (h)","Dilution Factor","Type","Nominal Conc (ng/mL)"];
    const rows = sheetRows.map(r => [
      String(r.pos), r.id, r.name,
      r.subject ?? "", r.period ?? "", r.tp ?? "",
      r.type === "Subject" ? (r.dilution ?? "1") : "",
      r.type, r.conc ?? "",
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `${dRunName.trim() || "distribution-sheet"}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success("Exported — CC/QC concentrations and dilution factors");
  }

  // ── Drawer sheet columns ──────────────────────────────────────────────────

  const dragCol = {
    title: "", key: "drag", width: 28,
    render: () => <GripVertical size={13} style={{ color:"var(--text-muted)", cursor: sheetLocked ? "not-allowed" : "grab" }} />,
  };

  const srNoCol = {
    title: "Sr. No.", dataIndex: "pos", key: "pos", width: 52,
    render: (v: number) => <span style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"monospace" }}>{v}</span>,
  };

  const sampleIdCol = {
    title: "Sample ID", dataIndex: "id", key: "id",
    render: (v: string) => <span style={{ fontFamily:"monospace", fontSize:10, color:"var(--accent)" }}>{v}</span>,
  };

  const sampleNameCol = {
    title: "Sample Name", dataIndex: "name", key: "name",
    render: (v: string) => <span style={{ fontSize:11 }}>{v}</span>,
  };

  const subjPeriodCol = {
    title: "Subject / Period", key: "subj", width: 100,
    render: (_: unknown, r: SampleRow) => r.subject
      ? <span style={{ fontFamily:"monospace", fontSize:11, fontWeight:600 }}>{r.subject} / {r.period ?? "—"}</span>
      : <span style={{ color:"var(--text-muted)", fontSize:11 }}>—</span>,
  };

  const tpCol = {
    title: "Time Pt (h)", dataIndex: "tp", key: "tp", width: 76,
    render: (v: string) => v
      ? <span style={{ fontFamily:"monospace", fontSize:11 }}>{v}</span>
      : <span style={{ color:"var(--text-muted)", fontSize:11 }}>—</span>,
  };

  const dilutionCol = {
    title: (
      <Tooltip title="Editable for Subject samples. Default = 1 (undiluted). Type e.g. 2 or 10 for diluted samples.">
        <span style={{ cursor:"help", borderBottom:"1px dashed var(--border)" }}>Dilution Factor</span>
      </Tooltip>
    ),
    key: "dilution", width: 120,
    render: (_: unknown, r: SampleRow, idx: number) => {
      if (r.type !== "Subject")
        return <span style={{ color:"var(--text-muted)", fontSize:11 }}>—</span>;
      const isDiluted = r.dilution && r.dilution !== "1";
      return (
        <Input
          size="small"
          value={r.dilution ?? "1"}
          disabled={sheetLocked}
          onChange={e => updateDilution(idx, e.target.value)}
          style={{
            width: 90, fontSize: 11, textAlign: "center",
            borderColor:  isDiluted ? "#E65100" : undefined,
            background:   isDiluted ? "#FFF3E0" : undefined,
            fontWeight:   isDiluted ? 700 : 400,
          }}
        />
      );
    },
  };

  const typeCol = {
    title: "Type", dataIndex: "type", key: "type", width: 90,
    render: (v: string, r: SampleRow) => {
      const s = TYPE_COLORS[v] ?? { bg:"var(--bg-card)", color:"var(--text-secondary)" };
      return (
        <span style={{ background:s.bg, color:s.color, padding:"2px 6px", borderRadius:4, fontSize:10, fontWeight:600 }}>
          {v}{r.level ? ` ${r.level}` : ""}
        </span>
      );
    },
  };

  const concCol = {
    title: "Nominal Conc. (ng/mL)", dataIndex: "conc", key: "conc",
    render: (v: string | null) => v
      ? <span style={{ fontFamily:"monospace", fontSize:12, fontWeight:500 }}>{v}</span>
      : <span style={{ color:"var(--text-muted)", fontSize:11 }}>—</span>,
  };

  // Tab 1 (front / print view): no concentration column
  const sheetViewCols = [dragCol, srNoCol, sampleIdCol, sampleNameCol, subjPeriodCol, tpCol, dilutionCol];
  // Tab 2 (back / concentrations): no dilution input, shows conc
  const concViewCols  = [srNoCol, sampleIdCol, sampleNameCol, typeCol, concCol];

  // drag-drop row props
  function rowProps(r: SampleRow, idx?: number) {
    return {
      draggable: !sheetLocked,
      onDragStart: (e: React.DragEvent) => handleDragStart(e, idx!),
      onDragOver:  (e: React.DragEvent) => handleDragOver(e, idx!),
      onDragEnter: (e: React.DragEvent) => e.preventDefault(),
      onDrop:      (e: React.DragEvent) => handleDrop(e, idx!),
      onDragEnd:   () => { setDragIdx(null); setDragOverIdx(null); },
      style: {
        cursor:     sheetLocked ? "default" : "grab",
        opacity:    dragIdx === idx ? 0.3 : 1,
        borderTop:  dragOverIdx === idx && dragIdx !== idx ? "2px solid var(--accent)" : undefined,
        background: dragOverIdx === idx && dragIdx !== idx ? "var(--accent-light)"
          : r.type === "QC"  ? "var(--accent-light)"
          : r.type === "CC"  ? "#f0f5fb"
          : "transparent",
        transition: "opacity 0.1s",
      },
    };
  }

  // ── QC checkbox group helper ──────────────────────────────────────────────

  function QcGroup({ label, options, selected, type }: {
    label: string;
    options: QCSample[];
    selected: string[];
    type: "hqc"|"mqc"|"lqc"|"lloqQc";
  }) {
    if (options.length === 0) return null;
    return (
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.06em",
          textTransform:"uppercase", marginBottom:6 }}>{label}</div>
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {options.map(q => (
            <label key={q.id} style={{
              display:"flex", alignItems:"center", gap:8, padding:"5px 8px", borderRadius:6,
              cursor: q.status !== "available" ? "not-allowed" : "pointer",
              background: selected.includes(q.id) ? "var(--accent-light)" : q.status === "depleted" ? "#FAFAFA" : "white",
              border: `1px solid ${selected.includes(q.id) ? "var(--accent)" : "var(--border)"}`,
              opacity: q.status !== "available" ? 0.5 : 1,
              transition:"all 0.1s",
            }}>
              <Checkbox
                checked={selected.includes(q.id)}
                disabled={q.status !== "available"}
                onChange={e => toggleQcId(type, q.id, e.target.checked)}
              />
              <span style={{ fontFamily:"monospace", fontSize:11, fontWeight:700, color:"var(--accent)", minWidth:70 }}>{q.id}</span>
              <span style={{ fontSize:10, color:"var(--text-muted)" }}>
                {q.remaining > 0 ? `${q.remaining} left` : "depleted"}
              </span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  // ── Ledger actions ────────────────────────────────────────────────────────

  function confirmApprove() {
    if (!approveDs) return;
    const approvedAt = new Date().toLocaleDateString("en-GB",{ day:"2-digit", month:"short", year:"numeric" });
    setRecords(prev => {
      const next = prev.map(r =>
        r.id === approveDs.id ? { ...r, status:"approved" as const, approvedBy:"J. Chen", approvedAt } : r
      );
      persistDsRecords(next); return next;
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
      persistDsRecords(next); return next;
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
        ? <span style={{ fontSize:11 }}>{r.runName}</span>
        : <span style={{ fontSize:11, color:"var(--text-muted)" }}>—</span>,
    },
    {
      title:"Run", dataIndex:"runNo", key:"runNo",
      render:(v:number) => <span style={{ fontFamily:"monospace", fontWeight:700, fontSize:13 }}>#{v}</span>,
    },
    {
      title:"Composition", key:"comp",
      render:(_:unknown, r:DSRecord) => (
        <div className="flex gap-1 flex-wrap">
          {[
            { label:`CC×${r.ccLevels}`,        bg:"#E8F0FB",             color:"#3A6B9B" },
            { label:`QC×${r.qcSamples}`,       bg:"var(--accent-light)", color:"var(--accent)" },
            { label:`Subj×${r.subjectSamples}`,bg:"var(--bg-card)",      color:"var(--text-secondary)" },
          ].map(c => (
            <span key={c.label} style={{ fontSize:10, fontWeight:600, background:c.bg, color:c.color, padding:"1px 6px", borderRadius:4 }}>{c.label}</span>
          ))}
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
          ? <button onClick={() => { setApproveDs(r); setApprovePass(""); }}
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
          </div>
        : r.status === "approved"
          ? <Button size="small" icon={<Snowflake size={11} />}
              style={{ fontSize:11, color:"var(--status-info)", borderColor:"var(--status-info)" }}
              onClick={() => setRetrievalDs(r)}>
              Request
            </Button>
          : <span style={{ fontSize:11, color:"var(--text-muted)" }}>—</span>,
    },
    {
      title:"", key:"actions",
      render:(_:unknown, r:DSRecord) => (
        <Button size="small" icon={<Eye size={11} />} style={{ fontSize:11 }} onClick={() => setDetailDs(r)}>View</Button>
      ),
    },
  ];

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
            Project-linked run preparation · CC set &amp; QC ID selection · approval workflow · retrieval request
          </p>
        </div>

        {/* Project selector */}
        <div className="rounded-xl p-5 mb-6" style={{ background:"white", border:"1px solid var(--border)" }}>
          <div className="block-label mb-2">Project Number <span style={{ color:"var(--status-fail)" }}>*</span></div>
          <Select
            style={{ width:360 }} size="large"
            placeholder="Select a project number to view its Distribution Sheets…"
            value={selectedProject} allowClear
            onChange={v => { setSelectedProject(v); setFilterStatus(undefined); }}
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
            {/* Summary + New button */}
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
                New Sample Distribution Preparation
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-4">
              <Select placeholder="Status" style={{ width:160 }} allowClear value={filterStatus} onChange={setFilterStatus}>
                {["draft","pending","approved","retrieved","rejected"].map(s => <Option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</Option>)}
              </Select>
            </div>

            {/* Ledger */}
            <div className="rounded-xl overflow-hidden" style={{ border:"1px solid var(--border)", background:"white" }}>
              <Table
                dataSource={ledgerFiltered} columns={ledgerCols} rowKey="id"
                size="small" pagination={{ pageSize:10, showSizeChanger:false }}
                rowClassName={r => r.status === "rejected" ? "opacity-50" : ""}
              />
            </div>
          </>
        )}


        {/* ══════════════════════════════════════════════════════
            NEW SAMPLE DISTRIBUTION PREPARATION — DRAWER
        ══════════════════════════════════════════════════════ */}
        <Drawer
          title={
            <div>
              <div style={{ fontFamily:"DM Serif Display, serif", fontSize:18 }}>New Sample Distribution Preparation</div>
              <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2, fontFamily:"inherit", fontWeight:400 }}>
                Select CC Set → choose QC IDs → other samples → build → add dilution factors → lock &amp; save
              </div>
            </div>
          }
          open={drawerOpen}
          onClose={() => { setDrawerOpen(false); resetDrawer(); }}
          width={1160}
          styles={{
            body: { padding:0, display:"flex", overflow:"hidden", height:"100%" },
            header: { borderBottom:"1px solid var(--border)", background:"var(--bg-card)", padding:"16px 20px" },
          }}
        >

          {/* ── LEFT: Selection Panel ── */}
          <div style={{
            width:340, flexShrink:0, overflowY:"auto",
            padding:"20px 16px", borderRight:"1px solid var(--border)",
            background:"var(--bg-card)", display:"flex", flexDirection:"column", gap:20,
          }}>

            {/* 1. Project */}
            <div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:8 }}>
                1 · Project
              </div>
              <Select style={{ width:"100%" }} placeholder="Select project…"
                value={dProject || undefined}
                onChange={v => {
                  setDProject(v);
                  setSelectedCcSetId(""); setSelectedCcTubeIds(new Set());
                  setSelHqc([]); setSelMqc([]); setSelLqc([]); setSelLloqQc([]);
                  setSelectedOtherIds([]);
                  setSheetRows([]); setSheetBuilt(false);
                }}>
                {PROJECTS_LIST.map(p => (
                  <Option key={p.id} value={p.id}>
                    <span style={{ fontFamily:"monospace", fontWeight:600, color:"var(--accent)", fontSize:12 }}>{p.id}</span>
                    <span style={{ color:"var(--text-muted)", marginLeft:6, fontSize:11 }}>— {p.name}</span>
                  </Option>
                ))}
              </Select>
            </div>

            {/* 2. CC Set Number */}
            <div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:8 }}>
                2 · CC Set Number
              </div>
              <Select style={{ width:"100%" }} placeholder={dProject ? "Select CC set…" : "Select project first"}
                value={selectedCcSetId || undefined}
                onChange={handleCcSetSelect}
                disabled={!dProject}
              >
                {ccSetsForProject.map(s => (
                  <Option key={s.id} value={s.id} disabled={s.status !== "active"}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontFamily:"monospace", fontWeight:700, fontSize:12, color: s.status === "active" ? "var(--accent)" : "var(--text-muted)" }}>
                        {s.id}
                      </span>
                      <span style={{ fontSize:10, color:"var(--text-muted)" }}>
                        {s.analyte} · {s.apsRef} · {s.prepDate}
                      </span>
                      {s.status !== "active" && (
                        <span style={{ fontSize:9, fontWeight:700, background:"var(--status-fail-bg)", color:"var(--status-fail)", padding:"1px 5px", borderRadius:4, marginLeft:"auto" }}>
                          {s.status}
                        </span>
                      )}
                    </div>
                  </Option>
                ))}
              </Select>

              {/* CC levels within selected set */}
              {dCcSet && (
                <div style={{ marginTop:10 }}>
                  <div style={{ fontSize:10, color:"var(--text-muted)", marginBottom:6 }}>
                    Levels in {dCcSet.id} — all auto-selected, uncheck to exclude
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    {dCcSet.levels.map(lvl => (
                      <label key={lvl.tubeId} style={{
                        display:"flex", alignItems:"center", gap:8, padding:"4px 8px", borderRadius:6,
                        background: selectedCcTubeIds.has(lvl.tubeId) ? "white" : "transparent",
                        border:`1px solid ${selectedCcTubeIds.has(lvl.tubeId) ? "var(--accent)" : "var(--border)"}`,
                        cursor:"pointer", transition:"all 0.1s",
                      }}>
                        <Checkbox
                          checked={selectedCcTubeIds.has(lvl.tubeId)}
                          onChange={e => {
                            const next = new Set(selectedCcTubeIds);
                            e.target.checked ? next.add(lvl.tubeId) : next.delete(lvl.tubeId);
                            setSelectedCcTubeIds(next);
                          }}
                        />
                        <span style={{ fontFamily:"monospace", fontSize:10, fontWeight:700, color:"var(--accent)", minWidth:24 }}>{lvl.level}</span>
                        <span style={{ fontFamily:"monospace", fontSize:10, color:"var(--text-muted)" }}>{lvl.tubeId}</span>
                        <span style={{ fontSize:10, color:"var(--text-secondary)", marginLeft:"auto" }}>{lvl.conc} {lvl.unit}</span>
                      </label>
                    ))}
                  </div>
                  <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:4 }}>
                    {selectedCcTubeIds.size} of {dCcSet.levels.length} levels selected
                  </div>

                  {/* APS info */}
                  {dApsData && (
                    <div className="mt-2 rounded-lg px-3 py-2" style={{ background:"var(--accent-light)", border:"1px solid #c2d4b8" }}>
                      <div style={{ fontSize:10, color:"var(--accent)", fontWeight:600 }}>
                        APS {dApsData.aps} · LLOQ {dApsData.lloq} – ULOQ {dApsData.uloq} ng/mL
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. QC Sample IDs */}
            {dCcSet && (
              <div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:8 }}>
                  3 · QC Sample IDs
                </div>
                <div style={{ fontSize:10, color:"var(--text-muted)", marginBottom:10 }}>
                  Select specific QC batch IDs. For fast / fasted studies, select the appropriate IDs for each condition. Depleted IDs are greyed out.
                </div>

                <QcGroup label="HQC"     options={hqcOptions}    selected={selHqc}    type="hqc" />
                <QcGroup label="MQC"     options={mqcOptions}    selected={selMqc}    type="mqc" />
                <QcGroup label="LQC"     options={lqcOptions}    selected={selLqc}    type="lqc" />
                <QcGroup label="LLOQ QC" options={lloqQcOptions} selected={selLloqQc} type="lloqQc" />

                <div className="flex items-center gap-2 mt-3">
                  <div className="block-label" style={{ whiteSpace:"nowrap", fontSize:11 }}>QC Sets</div>
                  <InputNumber min={1} max={5} value={dQcSets} onChange={v => setDQcSets(v ?? 1)} style={{ width:64 }} size="small" />
                  <span style={{ fontSize:10, color:"var(--text-muted)" }}>
                    blocks (each uses HQC/LLOQ QC bracket + LQC anchor)
                  </span>
                </div>
              </div>
            )}

            {/* 4. Other Samples */}
            {dCcSet && (
              <div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:8 }}>
                  4 · Other Samples
                </div>
                {OTHER_TYPES.map(({ type, label }) => {
                  const items = otherByType[type] ?? [];
                  if (items.length === 0) return null;
                  return (
                    <div key={type} style={{ marginBottom:10 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"var(--text-secondary)", marginBottom:4 }}>{label}</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                        {items.map(item => (
                          <label key={item.id} style={{
                            display:"flex", alignItems:"center", gap:8, padding:"4px 8px", borderRadius:6, cursor:"pointer",
                            background: selectedOtherIds.includes(item.id) ? "#F0EBF5" : "white",
                            border:`1px solid ${selectedOtherIds.includes(item.id) ? "#9B72C4" : "var(--border)"}`,
                            transition:"all 0.1s",
                          }}>
                            <Checkbox
                              checked={selectedOtherIds.includes(item.id)}
                              onChange={e => toggleOtherId(item.id, e.target.checked)}
                            />
                            <span style={{ fontFamily:"monospace", fontSize:10, fontWeight:600, color:"#6B4E8A" }}>{item.id}</span>
                            <span style={{ fontSize:10, color:"var(--text-muted)", marginLeft:2 }}>{item.label.includes("(") ? item.label.split("(")[1].replace(")","") : ""}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 5. Run / Experiment Name */}
            <div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:8 }}>
                5 · Run / Experiment Name
              </div>
              <Input
                placeholder="e.g. Run-12 MET Fasted P1…"
                value={dRunName}
                onChange={e => setDRunName(e.target.value)}
                style={{ borderColor: dRunName ? "var(--accent)" : undefined }}
              />
            </div>

            {/* Build Sheet button */}
            <Button
              type="primary" block size="large"
              icon={<FlaskConical size={14} />}
              disabled={!dCcSet || selectedCcTubeIds.size === 0}
              onClick={buildSheet}
            >
              {sheetBuilt ? "Rebuild Sheet" : "Build Sheet"}
            </Button>
            {sheetBuilt && (
              <div style={{ fontSize:11, color:"var(--text-muted)", textAlign:"center", marginTop:-12 }}>
                Subject samples auto-populated from Mastersheet · Drag rows to reorder
              </div>
            )}
          </div>

          {/* ── RIGHT: Distribution Sheet ── */}
          <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>

            {!sheetBuilt ? (
              <div className="flex flex-col items-center justify-center" style={{ flex:1, color:"var(--text-muted)" }}>
                <FlaskConical size={36} style={{ marginBottom:12, opacity:0.3 }} />
                <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>No sheet built yet</div>
                <div style={{ fontSize:12 }}>
                  Select a CC set &amp; QC IDs on the left, then click "Build Sheet".
                </div>
              </div>
            ) : (
              <>
                {/* Info bar */}
                <div style={{ padding:"10px 20px", borderBottom:"1px solid var(--border)", background:"var(--accent-light)" }}>
                  <div className="flex items-center justify-between">
                    <div style={{ fontSize:12, color:"var(--accent)", fontWeight:500 }}>
                      {dProject} · {dAnalyte} · {dCcSet?.id} · APS {dApsData?.aps} · {sheetRows.length} positions
                      {dRunName && <strong style={{ marginLeft:12 }}>— "{dRunName}"</strong>}
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
                <div className="flex gap-2 px-5 py-3 flex-wrap" style={{ borderBottom:"1px solid var(--border)", background:"white" }}>
                  {[
                    { label:"CC",       value:sheetRows.filter(r=>r.type==="CC").length,      color:"#3A6B9B",             bg:"#E8F0FB" },
                    { label:"QC",       value:sheetRows.filter(r=>r.type==="QC").length,      color:"var(--accent)",       bg:"var(--accent-light)" },
                    { label:"Subjects", value:subjectCount,                                    color:"var(--text-primary)", bg:"var(--bg-card)" },
                    { label:"Other",    value:sheetRows.filter(r=>!["CC","QC","Subject"].includes(r.type)).length, color:"#6B4E8A", bg:"#F0EBF5" },
                    { label:"Total",    value:sheetRows.length,                                color:"var(--text-secondary)", bg:"var(--bg-card)" },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
                      style={{ background:s.bg, border:`1px solid ${s.color}22` }}>
                      <span style={{ fontSize:16, fontWeight:700, fontFamily:"DM Serif Display, serif", color:s.color }}>{s.value}</span>
                      <span style={{ fontSize:11, color:"var(--text-secondary)" }}>{s.label}</span>
                    </div>
                  ))}
                  {subjectCount > 0 && (
                    <div className="flex items-center gap-2 ml-auto rounded-lg px-3 py-1.5"
                      style={{ background:"white", border:"1px solid var(--border)" }}>
                      <span style={{ fontSize:11, color:"#E65100", fontWeight:600 }}>{dilutedCount} diluted</span>
                      <span style={{ fontSize:11, color:"var(--text-muted)" }}>·</span>
                      <span style={{ fontSize:11, color:"var(--text-secondary)" }}>{subjectCount - dilutedCount} DF=1</span>
                    </div>
                  )}
                </div>

                {/* Tabs: Sheet view | Concentrations */}
                <div style={{ flex:1, overflowY:"auto" }}>
                  <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    style={{ padding:"0 20px" }}
                    items={[
                      {
                        key:"sheet",
                        label:"Distribution Sheet",
                        children: (
                          <>
                            {!sheetLocked && (
                              <div className="flex items-center gap-2 mb-2 px-1 py-1.5 rounded-lg"
                                style={{ background:"#FFFDF0", border:"1px solid #f5e98c" }}>
                                <GripVertical size={12} style={{ color:"var(--text-muted)" }} />
                                <span style={{ fontSize:11, color:"#7A6A00" }}>
                                  Drag rows to reorder · Dilution Factor defaults to <strong>1</strong> — change for diluted samples
                                </span>
                              </div>
                            )}
                            <Table
                              dataSource={sheetRows}
                              columns={sheetViewCols}
                              rowKey="pos"
                              size="small"
                              pagination={false}
                              scroll={{ y:"calc(100vh - 420px)" }}
                              onRow={(r, idx) => rowProps(r, idx)}
                            />
                          </>
                        ),
                      },
                      {
                        key:"conc",
                        label:"Concentrations (Back-end)",
                        children: (
                          <Table
                            dataSource={sheetRows}
                            columns={concViewCols}
                            rowKey="pos"
                            size="small"
                            pagination={false}
                            scroll={{ y:"calc(100vh - 400px)" }}
                            onRow={(r) => ({
                              style:{
                                background: r.type === "QC" ? "var(--accent-light)" : r.type === "CC" ? "#f0f5fb" : "transparent",
                              },
                            })}
                          />
                        ),
                      },
                    ]}
                  />
                </div>

                {/* Footer */}
                <div style={{
                  padding:"12px 20px", borderTop:"1px solid var(--border)", background:"white",
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
                        Sheet locked — order and dilution factors are frozen.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button icon={<FileDown size={13} />} onClick={exportSheet} disabled={sheetRows.length === 0}
                      style={{ color:"var(--text-secondary)" }}>
                      Export CSV
                    </Button>
                    <Tooltip title={!dRunName.trim() ? "Enter a run/experiment name first" : ""}>
                      <Button
                        type="primary" icon={<CheckCircle2 size={13} />}
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
              <span style={{ fontFamily:"DM Serif Display, serif", fontSize:18 }}>{detailDs?.id}</span>
              <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2, fontFamily:"inherit" }}>
                {detailDs?.projectName} · {detailDs?.analyte} · Run #{detailDs?.runNo} · APS {detailDs?.aps}
                {detailDs?.runName && <> · <strong>"{detailDs.runName}"</strong></>}
              </div>
            </div>
          }
          open={!!detailDs} onCancel={() => setDetailDs(null)}
          footer={
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <StatusTag status={detailDs?.status ?? "draft"} />
                {detailDs?.approvedBy && <span style={{ fontSize:11, color:"var(--status-pass)", fontWeight:600 }}>✓ {detailDs.approvedBy} · {detailDs.approvedAt}</span>}
                {detailDs?.retrievalReqId && <span style={{ fontSize:11, color:"var(--status-info)", fontWeight:600 }}>↑ {detailDs.retrievalReqId}</span>}
              </div>
              <div className="flex gap-2">
                <Button icon={<Download size={13} />} style={{ color:"var(--text-secondary)" }}>Export</Button>
                {detailDs?.status === "approved" && !detailDs?.retrievalReqId && (
                  <Button type="primary" icon={<Snowflake size={13} />}
                    onClick={() => { setDetailDs(null); setRetrievalDs(detailDs); }}>Request Retrieval</Button>
                )}
                <Button onClick={() => setDetailDs(null)}>Close</Button>
              </div>
            </div>
          }
          width={880}
        >
          {detailDs && (
            <div style={{ marginTop:12 }}>
              <div className="flex items-center gap-4 rounded-xl px-4 py-3 mb-4"
                style={{ background:"var(--accent-light)", border:"1px solid #c2d4b8" }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background:"var(--accent)" }} />
                <span style={{ fontSize:12, color:"var(--accent)", fontWeight:500 }}>
                  {detailDs.project} · {detailDs.analyte} · Run #{detailDs.runNo} · {detailDs.ccLevels} CC · {detailDs.qcSamples} QC · {detailDs.subjectSamples} subjects
                </span>
                <span style={{ fontSize:11, color:"var(--accent)", opacity:0.7, marginLeft:"auto" }}>
                  {detailDs.totalPositions} total positions
                </span>
              </div>
              {detailDs.rows ? (
                <div className="rounded-xl overflow-hidden" style={{ border:"1px solid var(--border)", background:"white" }}>
                  <Table dataSource={detailDs.rows} columns={runCols} rowKey="pos" size="small"
                    pagination={false} scroll={{ y:400 }}
                    onRow={r => ({ style:{ background: r.type==="QC" ? "var(--accent-light)" : r.type==="CC" ? "#f0f5fb" : "transparent" } })}
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
          open={!!approveDs} onCancel={() => { setApproveDs(null); setApprovePass(""); }}
          footer={null} width={440}
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
                    <span style={{ fontSize:11, color:"var(--text-muted)" }}>{f.label}</span>
                    <span style={{ fontSize:12, fontWeight:700, fontFamily:"monospace" }}>{f.value}</span>
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <div className="block-label mb-2">Project Leader E-Signature</div>
                <Input.Password placeholder="Enter password to approve…" value={approvePass} onChange={e => setApprovePass(e.target.value)} />
                <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:4 }}>
                  Meaning: &ldquo;I approve this Distribution Sheet for analytical run and Freezer Room retrieval.&rdquo;
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button onClick={() => { setApproveDs(null); setApprovePass(""); }}>Cancel</Button>
                <Button type="primary" icon={<CheckCircle2 size={13} />} disabled={!approvePass} onClick={confirmApprove}>Approve</Button>
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
              <span style={{ fontFamily:"DM Serif Display, serif", fontSize:18 }}>Retrieval Request — {retrievalDs?.id}</span>
            </div>
          }
          open={!!retrievalDs}
          onCancel={() => { setRetrievalDs(null); setRetUrgency("normal"); setRetNotes(""); }}
          footer={null} width={600}
        >
          {retrievalDs && (
            <div style={{ marginTop:16 }}>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[{ label:"Project", value:retrievalDs.project },{ label:"Analyte", value:retrievalDs.analyte },{ label:"Run No.", value:`#${retrievalDs.runNo}` }].map(f => (
                  <div key={f.label} className="rounded-lg p-3" style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
                    <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", color:"var(--text-muted)", marginBottom:4 }}>{f.label}</div>
                    <div style={{ fontFamily:"monospace", fontWeight:700, fontSize:13, color:"var(--accent)" }}>{f.value}</div>
                  </div>
                ))}
              </div>

              <div className="block-label mb-2">
                Subject Samples to Retrieve
                <span style={{ fontSize:11, fontWeight:400, color:"var(--text-muted)", marginLeft:6 }}>{retrievalDs.subjectSamples} samples</span>
              </div>
              <div className="rounded-xl overflow-hidden mb-4" style={{ border:"1px solid var(--border)" }}>
                <div className="grid px-3 py-2"
                  style={{ gridTemplateColumns:"1fr 60px 60px 90px 80px", gap:8, background:"var(--bg-card)", borderBottom:"1px solid var(--border)" }}>
                  {["Sample ID","Subj","T.Pt","Freezer","Location"].map(h => (
                    <span key={h} style={{ fontSize:9, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", color:"var(--text-muted)" }}>{h}</span>
                  ))}
                </div>
                {retrievalSamples.map((r, i) => {
                  const ms = MASTERSHEET.find(m => m.id === r.id);
                  return (
                    <div key={r.id} className="grid items-center px-3 py-2"
                      style={{ gridTemplateColumns:"1fr 60px 60px 90px 80px", gap:8,
                        borderBottom: i < retrievalSamples.length-1 ? "1px solid var(--border)" : "none", background:"white" }}>
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
                  <Input.TextArea rows={2} placeholder="Handling instructions…" value={retNotes} onChange={e => setRetNotes(e.target.value)} style={{ resize:"none" }} />
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg px-4 py-3 mb-4"
                style={{ background:"var(--status-info-bg)", border:"1px solid #9bc0e0" }}>
                <AlertTriangle size={13} style={{ color:"var(--status-info)", flexShrink:0, marginTop:1 }} />
                <span style={{ fontSize:12, color:"var(--status-info)", lineHeight:1.5 }}>
                  Once submitted, the retrieval request will appear in the Freezer Room Retrieval queue.
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
