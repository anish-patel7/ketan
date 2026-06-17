"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import {
  Button, Select, Table, Input, InputNumber,
  Checkbox, Tabs, Tooltip, message, Segmented,
} from "antd";
import {
  ArrowLeft, FlaskConical, Lock, Unlock, FileDown,
  CheckCircle2, GripVertical, LayoutGrid, ExternalLink,
} from "lucide-react";
import {
  PROJECTS_LIST, PROJECT_APS,
  CC_SETS, QC_SAMPLES, OTHER_SAMPLE_ITEMS,
  buildDistributionSheet, nextRunNo, nextDsId, addDsRecord, loadDsRecords, ccSetKey,
  type DSRecord, type SampleRow, type SelectedQcMap,
  type QCSample, type OtherSampleItem,
} from "../data";
import {
  getMastersheetForProject, formatSubjectLabel,
  type MasterSheetSampleStatus,
} from "../../freezer/mastersheet";
import { TYPE_COLORS } from "../runColumns";

const { Option } = Select;

const OTHER_TYPES: Array<{ type: OtherSampleItem["type"]; label: string }> = [
  { type: "SES",          label: "SES"          },
  { type: "SP",           label: "SP"           },
  { type: "LLOQ",         label: "LLOQ"         },
  { type: "ULOQ",         label: "ULOQ"         },
  { type: "Pooled Plasma",label: "Pooled Plasma" },
  { type: "Matrix Lot",   label: "Matrix Lot"   },
];

export default function NewDistributionPage() {
  const router = useRouter();

  // ── Selection state ───────────────────────────────────────────────────────
  const [dProject,          setDProject]          = useState("");
  const [selectedCcSetId,   setSelectedCcSetId]   = useState("");
  const [selectedCcTubeIds, setSelectedCcTubeIds] = useState<Set<string>>(new Set());
  const [selectedBlankIds,  setSelectedBlankIds]  = useState<Set<string>>(new Set());
  const [selHqc,            setSelHqc]            = useState<string[]>([]);
  const [selMqc,            setSelMqc]            = useState<string[]>([]);
  const [selLqc,            setSelLqc]            = useState<string[]>([]);
  const [selLloqQc,         setSelLloqQc]         = useState<string[]>([]);
  const [dQcSets,           setDQcSets]           = useState(1);
  const [selectedOtherIds,  setSelectedOtherIds]  = useState<string[]>([]);
  const [dRunName,          setDRunName]           = useState("");
  const [dPeriod,           setDPeriod]            = useState("");
  const [subjectMode,       setSubjectMode]        = useState<"auto" | "manual">("auto");
  const [manualSubjectIds,  setManualSubjectIds]   = useState<Set<string>>(new Set());

  // ── Sheet state ───────────────────────────────────────────────────────────
  const [sheetRows,  setSheetRows]  = useState<SampleRow[]>([]);
  const [sheetBuilt, setSheetBuilt] = useState(false);
  const [sheetLocked,setSheetLocked]= useState(false);
  const [activeTab,  setActiveTab]  = useState("sheet");
  const [dragIdx,    setDragIdx]    = useState<number | null>(null);
  const [dragOverIdx,setDragOverIdx]= useState<number | null>(null);

  // ── Derived ───────────────────────────────────────────────────────────────
  const dCcSet   = CC_SETS.find(s => ccSetKey(s) === selectedCcSetId);
  const dAnalyte = dCcSet?.analyte ?? "";
  const dApsData = dProject && dAnalyte ? PROJECT_APS[dProject]?.[dAnalyte] : undefined;

  // Mastersheet-derived subject info
  const activeMastersheet = dProject ? getMastersheetForProject(dProject) : undefined;
  const availPeriods       = activeMastersheet?.periods ?? [];
  const allMsSamples       = dProject && dAnalyte
    ? (activeMastersheet?.samples ?? []).filter(s => s.analyte === dAnalyte)
    : [];
  const periodMsSamples    = dPeriod
    ? allMsSamples.filter(s => s.period === dPeriod)
    : allMsSamples;
  const availSubjectSamples = periodMsSamples.filter(s => s.status === "available");
  const msExcludedCount     = periodMsSamples.filter(s => s.status === "excluded").length;
  const msMissingCount      = periodMsSamples.filter(s => s.status === "missing").length;
  const uniqueSubjects      = [...new Set(availSubjectSamples.map(s => s.subject))];
  const subjectSummary      = uniqueSubjects.map(subject => {
    const avail = availSubjectSamples.filter(s => s.subject === subject).length;
    const total = periodMsSamples.filter(s => s.subject === subject).length;
    const period = dPeriod || (activeMastersheet?.periods[0] ?? "P1");
    return { subject, avail, total, label: formatSubjectLabel(subject, period) };
  });

  const ccSetsForProject = CC_SETS.filter(s => s.project === dProject);

  const qcCtx        = QC_SAMPLES.filter(s => s.project === dProject && s.analyte === dAnalyte);
  const hqcOptions   = qcCtx.filter(q => q.qcType === "HQC");
  const mqcOptions   = qcCtx.filter(q => q.qcType === "MQC");
  const lqcOptions   = qcCtx.filter(q => q.qcType === "LQC");
  const lloqQcOptions= qcCtx.filter(q => q.qcType === "LLOQ QC");

  const otherCtx     = OTHER_SAMPLE_ITEMS.filter(s => s.project === dProject && s.analyte === dAnalyte);
  const otherByType  = OTHER_TYPES.reduce<Record<string, OtherSampleItem[]>>((acc, { type }) => {
    acc[type] = otherCtx.filter(o => o.type === type);
    return acc;
  }, {});

  const subjectCount = sheetRows.filter(r => r.type === "Subject").length;
  const dilutedCount = sheetRows.filter(r => r.type === "Subject" && r.dilution && r.dilution !== "1").length;

  // ── Handlers ──────────────────────────────────────────────────────────────
  function resetProject(projectId: string) {
    setDProject(projectId);
    setSelectedCcSetId(""); setSelectedCcTubeIds(new Set()); setSelectedBlankIds(new Set());
    setSelHqc([]); setSelMqc([]); setSelLqc([]); setSelLloqQc([]);
    setSelectedOtherIds([]);
    setDPeriod("");
    setSubjectMode("auto"); setManualSubjectIds(new Set());
    setSheetRows([]); setSheetBuilt(false); setSheetLocked(false);
  }

  function handleCcSetSelect(key: string) {
    setSelectedCcSetId(key);
    setSheetRows([]); setSheetBuilt(false); setSheetLocked(false);
    const ccSet = CC_SETS.find(s => ccSetKey(s) === key);
    if (ccSet) {
      setSelectedCcTubeIds(new Set(ccSet.levels.map(l => l.tubeId)));
      setSelectedBlankIds(new Set(ccSet.blanks.map(b => b.tubeId)));
    }
    setSelHqc([]); setSelMqc([]); setSelLqc([]); setSelLloqQc([]);
    setSelectedOtherIds([]);
    setManualSubjectIds(new Set());
  }

  function handlePeriodChange(period: string) {
    setDPeriod(period);
    setManualSubjectIds(new Set());
  }

  function toggleManualSubject(id: string, checked: boolean) {
    setManualSubjectIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  }

  function toggleQcId(type: "hqc"|"mqc"|"lqc"|"lloqQc", id: string, checked: boolean) {
    const map = {
      hqc:    [selHqc,    setSelHqc]    as [string[], React.Dispatch<React.SetStateAction<string[]>>],
      mqc:    [selMqc,    setSelMqc]    as [string[], React.Dispatch<React.SetStateAction<string[]>>],
      lqc:    [selLqc,    setSelLqc]    as [string[], React.Dispatch<React.SetStateAction<string[]>>],
      lloqQc: [selLloqQc, setSelLloqQc] as [string[], React.Dispatch<React.SetStateAction<string[]>>],
    };
    const [cur, set] = map[type];
    set(checked ? [...cur, id] : cur.filter(x => x !== id));
  }

  function toggleOtherId(id: string, checked: boolean) {
    setSelectedOtherIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
  }

  function buildSheet() {
    if (!dCcSet || !dProject) return;
    const qcIds: SelectedQcMap = { hqc: selHqc, mqc: selMqc, lqc: selLqc, lloqQc: selLloqQc };
    const subjects = subjectMode === "manual"
      ? availSubjectSamples.filter(s => manualSubjectIds.has(s.id))
      : availSubjectSamples;
    const rows = buildDistributionSheet(
      dCcSet, selectedCcTubeIds, qcIds, subjects,
      selectedOtherIds, QC_SAMPLES, OTHER_SAMPLE_ITEMS, dQcSets,
      selectedBlankIds,
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
    if (!dRunName.trim()) { message.warning("Enter a run / experiment name first"); return; }
    if (!dCcSet) return;
    const proj = PROJECTS_LIST.find(p => p.id === dProject);
    if (!proj) return;
    const existing = loadDsRecords();
    const runNo    = nextRunNo(existing, dProject, dAnalyte);
    const id       = nextDsId(existing, dProject, dAnalyte, runNo);
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
    message.success(`${id} — "${dRunName}" saved and submitted for approval`);
    router.push("/distribution");
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
      .map(row => row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `${dRunName.trim() || "distribution-sheet"}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success("Exported");
  }

  // ── QC group component ────────────────────────────────────────────────────
  function QcGroup({ label, options, selected, type }: {
    label: string; options: QCSample[]; selected: string[]; type: "hqc"|"mqc"|"lqc"|"lloqQc";
  }) {
    if (options.length === 0) return null;
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
          color: "var(--text-muted)", marginBottom: 6 }}>{label}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {options.map(q => (
            <label key={q.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "6px 10px",
              borderRadius: 7, cursor: "pointer",
              background: selected.includes(q.id) ? "var(--accent-light)" : "white",
              border: `1px solid ${selected.includes(q.id) ? "var(--accent)" : "var(--border)"}`,
              transition: "all 0.12s",
            }}>
              <Checkbox checked={selected.includes(q.id)}
                onChange={e => toggleQcId(type, q.id, e.target.checked)} />
              <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{q.id}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>{q.prepDate}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  // ── Table column definitions ──────────────────────────────────────────────
  const dragCol = {
    title: "", key: "drag", width: 32,
    render: () => (
      <GripVertical size={14} style={{ color: "var(--text-muted)", cursor: sheetLocked ? "not-allowed" : "grab" }} />
    ),
  };

  const srNoCol = {
    title: "Sr. No.", dataIndex: "pos", key: "pos", width: 60,
    render: (v: number) => <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)" }}>{v}</span>,
  };

  const sampleIdCol = {
    title: "Sample ID", dataIndex: "id", key: "id",
    render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>{v}</span>,
  };

  const nameCol = {
    title: "Sample Name", dataIndex: "name", key: "name",
    render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span>,
  };

  const subjPeriodCol = {
    title: "Subject / Period", key: "subj", width: 120,
    render: (_: unknown, r: SampleRow) => r.subject
      ? <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>{r.subject} / {r.period ?? "—"}</span>
      : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>,
  };

  const tpCol = {
    title: "Time Pt (h)", dataIndex: "tp", key: "tp", width: 90,
    render: (v: string) => v
      ? <span style={{ fontFamily: "monospace", fontSize: 12 }}>{v}</span>
      : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>,
  };

  const dilutionCol = {
    title: (
      <Tooltip title="Default = 1 (undiluted). Type a number for diluted samples (e.g. 2, 10). Only applies to Subject samples.">
        <span style={{ cursor: "help", borderBottom: "1px dashed var(--border)" }}>Dilution Factor</span>
      </Tooltip>
    ),
    key: "dilution", width: 130,
    render: (_: unknown, r: SampleRow, idx: number) => {
      if (r.type !== "Subject") return <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>;
      const isDiluted = r.dilution && r.dilution !== "1";
      return (
        <Input size="small" value={r.dilution ?? "1"} disabled={sheetLocked}
          onChange={e => updateDilution(idx, e.target.value)}
          style={{
            width: 100, fontSize: 12, textAlign: "center",
            borderColor:  isDiluted ? "#E65100" : undefined,
            background:   isDiluted ? "#FFF3E0" : undefined,
            fontWeight:   isDiluted ? 700 : 400,
          }} />
      );
    },
  };

  const typeCol = {
    title: "Type", dataIndex: "type", key: "type", width: 100,
    render: (v: string, r: SampleRow) => {
      const s = TYPE_COLORS[v] ?? { bg: "var(--bg-card)", color: "var(--text-secondary)" };
      return (
        <span style={{ background: s.bg, color: s.color, padding: "2px 8px",
          borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
          {v}{r.level ? ` ${r.level}` : ""}
        </span>
      );
    },
  };

  const concCol = {
    title: "Nominal Conc. (ng/mL)", dataIndex: "conc", key: "conc",
    render: (v: string | null) => v
      ? <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600 }}>{v}</span>
      : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>,
  };

  const sheetViewCols = [dragCol, srNoCol, sampleIdCol, nameCol, subjPeriodCol, tpCol, dilutionCol];
  const concViewCols  = [srNoCol, sampleIdCol, nameCol, typeCol, concCol];

  function rowProps(r: SampleRow, idx?: number) {
    return {
      draggable: !sheetLocked,
      onDragStart: (e: React.DragEvent) => handleDragStart(e, idx!),
      onDragOver:  (e: React.DragEvent) => handleDragOver(e, idx!),
      onDragEnter: (e: React.DragEvent) => e.preventDefault(),
      onDrop:      (e: React.DragEvent) => handleDrop(e, idx!),
      onDragEnd:   () => { setDragIdx(null); setDragOverIdx(null); },
      style: {
        cursor:    sheetLocked ? "default" : "grab",
        opacity:   dragIdx === idx ? 0.3 : 1,
        borderTop: dragOverIdx === idx && dragIdx !== idx ? "2px solid var(--accent)" : undefined,
        background:
          dragOverIdx === idx && dragIdx !== idx ? "var(--accent-light)"
          : r.type === "QC"  ? "var(--accent-light)"
          : r.type === "CC"  ? "#f0f5fb"
          : "transparent",
        transition: "opacity 0.1s",
      },
    };
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <div style={{
          padding: "14px 28px", borderBottom: "1px solid var(--border)",
          background: "white", display: "flex", alignItems: "center", gap: 16, flexShrink: 0,
        }}>
          <Button icon={<ArrowLeft size={14} />} onClick={() => router.push("/distribution")}
            style={{ color: "var(--text-secondary)" }}>
            Back to Ledger
          </Button>
          <div style={{ width: 1, height: 20, background: "var(--border)" }} />
          <div>
            <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 20, lineHeight: 1.2 }}>
              New Sample Distribution Preparation
            </div>
            {dProject && dCcSet && (
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                {dProject} · {dAnalyte} · {dCcSet.id} · APS {dApsData?.aps}
                {dRunName && <strong style={{ color: "var(--text-primary)", marginLeft: 8 }}>— "{dRunName}"</strong>}
              </div>
            )}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
            {sheetBuilt && (
              <>
                <Button icon={<FileDown size={13} />} onClick={exportSheet}
                  style={{ color: "var(--text-secondary)" }}>
                  Export CSV
                </Button>
                <Button
                  icon={sheetLocked ? <Unlock size={13} /> : <Lock size={13} />}
                  onClick={() => setSheetLocked(p => !p)}
                  style={{
                    borderColor: sheetLocked ? "var(--status-warn)" : "var(--border)",
                    color:       sheetLocked ? "var(--status-warn)" : "var(--text-secondary)",
                    fontWeight:  sheetLocked ? 700 : 400,
                  }}>
                  {sheetLocked ? "Unlock Sheet" : "Lock Sheet"}
                </Button>
                <Tooltip title={!dRunName.trim() ? "Enter a run name first" : ""}>
                  <Button type="primary" icon={<CheckCircle2 size={13} />}
                    disabled={!dRunName.trim() || sheetRows.length === 0}
                    onClick={saveSheet}>
                    Save &amp; Submit for Approval
                  </Button>
                </Tooltip>
              </>
            )}
          </div>
        </div>

        {/* ── Body: left panel + right sheet ──────────────────────────────── */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>

          {/* ── LEFT: Selection panel ──────────────────────────────────────── */}
          <div style={{
            width: 320, flexShrink: 0, overflowY: "auto",
            padding: "20px 18px", borderRight: "1px solid var(--border)",
            background: "var(--bg-card)", display: "flex", flexDirection: "column", gap: 22,
          }}>

            {/* Step 1 — Project */}
            <section>
              <div className="step-label">1 · Project</div>
              <Select style={{ width: "100%" }} placeholder="Select project…"
                value={dProject || undefined} onChange={resetProject}>
                {PROJECTS_LIST.map(p => (
                  <Option key={p.id} value={p.id}>
                    <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--accent)", fontSize: 12 }}>{p.id}</span>
                    <span style={{ color: "var(--text-muted)", marginLeft: 6, fontSize: 11 }}>— {p.name}</span>
                  </Option>
                ))}
              </Select>
            </section>

            {/* Step 2 — CC Set */}
            <section>
              <div className="step-label">2 · CC Set Number</div>
              <Select style={{ width: "100%" }} placeholder={dProject ? "Select CC set…" : "Select project first"}
                value={selectedCcSetId || undefined} onChange={handleCcSetSelect} disabled={!dProject}>
                {ccSetsForProject.map(s => (
                  <Option key={ccSetKey(s)} value={ccSetKey(s)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12, color: "var(--accent)" }}>
                        {s.id}
                      </span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                        {s.analyte} · {s.prepDate}
                      </span>
                    </div>
                  </Option>
                ))}
              </Select>

              {dCcSet && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>
                    Levels in {dCcSet.id} — uncheck to exclude
                  </div>
                  {dCcSet.levels.map(lvl => (
                    <label key={lvl.tubeId} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "5px 8px",
                      borderRadius: 6, cursor: "pointer",
                      background: selectedCcTubeIds.has(lvl.tubeId) ? "white" : "transparent",
                      border: `1px solid ${selectedCcTubeIds.has(lvl.tubeId) ? "var(--accent)" : "var(--border)"}`,
                      transition: "all 0.1s",
                    }}>
                      <Checkbox checked={selectedCcTubeIds.has(lvl.tubeId)}
                        onChange={e => {
                          const next = new Set(selectedCcTubeIds);
                          e.target.checked ? next.add(lvl.tubeId) : next.delete(lvl.tubeId);
                          setSelectedCcTubeIds(next);
                        }} />
                      <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: "var(--accent)", minWidth: 28 }}>{lvl.level}</span>
                      <span style={{ fontFamily: "monospace", fontSize: 10, color: "var(--text-muted)" }}>{lvl.tubeId}</span>
                      <span style={{ fontSize: 10, color: "var(--text-secondary)", marginLeft: "auto" }}>{lvl.conc} {lvl.unit}</span>
                    </label>
                  ))}
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                    {selectedCcTubeIds.size} / {dCcSet.levels.length} levels selected
                  </div>

                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8, marginBottom: 2 }}>
                    Blanks in {dCcSet.id} — uncheck to exclude
                  </div>
                  {dCcSet.blanks.map(blk => (
                    <label key={blk.tubeId} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "5px 8px",
                      borderRadius: 6, cursor: "pointer",
                      background: selectedBlankIds.has(blk.tubeId) ? "white" : "transparent",
                      border: `1px solid ${selectedBlankIds.has(blk.tubeId) ? "var(--accent)" : "var(--border)"}`,
                      transition: "all 0.1s",
                    }}>
                      <Checkbox checked={selectedBlankIds.has(blk.tubeId)}
                        onChange={e => {
                          const next = new Set(selectedBlankIds);
                          if (e.target.checked) next.add(blk.tubeId); else next.delete(blk.tubeId);
                          setSelectedBlankIds(next);
                        }} />
                      <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", minWidth: 56 }}>{blk.label}</span>
                      <span style={{ fontFamily: "monospace", fontSize: 10, color: "var(--text-muted)" }}>{blk.tubeId}</span>
                    </label>
                  ))}
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                    {selectedBlankIds.size} / {dCcSet.blanks.length} blanks selected
                  </div>
                  {dApsData && (
                    <div style={{ marginTop: 4, padding: "6px 10px", borderRadius: 6,
                      background: "var(--accent-light)", border: "1px solid #c2d4b8", fontSize: 11, color: "var(--accent)" }}>
                      APS {dApsData.aps} · LLOQ {dApsData.lloq} – ULOQ {dApsData.uloq} ng/mL
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Subject Samples from Mastersheet */}
            {dCcSet && activeMastersheet && (
              <section style={{
                padding:"12px 14px", borderRadius:10,
                background:"var(--bg-card)", border:"1px solid var(--border)",
              }}>
                <div style={{
                  display:"flex", alignItems:"center", gap:6,
                  fontSize:10, fontWeight:700, letterSpacing:"0.07em",
                  textTransform:"uppercase", color:"var(--accent)", marginBottom:10,
                }}>
                  <LayoutGrid size={11} />
                  Subject Samples · Mastersheet
                </div>

                {/* Auto / Manual mode */}
                <Segmented
                  block size="small"
                  value={subjectMode}
                  onChange={v => setSubjectMode(v as "auto" | "manual")}
                  options={[
                    { label: "Auto (all available)", value: "auto" },
                    { label: "Manual (pick samples)", value: "manual" },
                  ]}
                  style={{ marginBottom: 10 }}
                />

                {/* Period selector */}
                {availPeriods.length > 1 && (
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                    <span style={{ fontSize:11, color:"var(--text-secondary)", whiteSpace:"nowrap" }}>
                      Period
                    </span>
                    <Select
                      size="small" style={{ flex:1 }}
                      value={dPeriod || undefined}
                      placeholder="All periods"
                      allowClear
                      onChange={v => handlePeriodChange(v ?? "")}
                    >
                      {availPeriods.map(p => <Option key={p} value={p}>{p}</Option>)}
                    </Select>
                  </div>
                )}

                {/* Stats row */}
                <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
                  {[
                    { label:"Available", v:availSubjectSamples.length, bg:"#E8F5E9", color:"#2E7D32" },
                    { label:"Excluded",  v:msExcludedCount,            bg:"#FFEBEE", color:"#C62828" },
                    { label:"Missing",   v:msMissingCount,             bg:"#F5F5F5", color:"#9E9E9E" },
                  ].map(s => s.v > 0 ? (
                    <div key={s.label} style={{
                      padding:"2px 8px", borderRadius:5,
                      background:s.bg, fontSize:11,
                    }}>
                      <span style={{ fontWeight:700, color:s.color }}>{s.v}</span>
                      <span style={{ color:s.color, marginLeft:3 }}>{s.label}</span>
                    </div>
                  ) : null)}
                </div>

                {subjectMode === "auto" ? (
                  /* Subject grid — read-only availability summary */
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:8 }}>
                    {subjectSummary.map(({ subject, avail, total, label }) => {
                      const allOk = avail === total;
                      const none  = avail === 0;
                      return (
                        <Tooltip key={subject}
                          title={`Subject ${subject}: ${avail}/${total} available`}>
                          <div style={{
                            width:40, height:40, borderRadius:8, fontSize:10,
                            display:"flex", flexDirection:"column",
                            alignItems:"center", justifyContent:"center",
                            background: allOk ? "#E8F5E9" : none ? "#FFEBEE" : "#FFF8E1",
                            border:`1px solid ${allOk ? "#81C784" : none ? "#EF9A9A" : "#FFB74D"}`,
                            color: allOk ? "#2E7D32" : none ? "#C62828" : "#E65100",
                            cursor:"default",
                          }}>
                            <span style={{
                              fontWeight:700, fontSize:11, fontFamily:"monospace",
                              lineHeight:1.2,
                            }}>
                              {label}
                            </span>
                            <span style={{ fontSize:9, lineHeight:1.2 }}>{avail}</span>
                          </div>
                        </Tooltip>
                      );
                    })}
                    {subjectSummary.length === 0 && (
                      <span style={{ fontSize:11, color:"var(--text-muted)", fontStyle:"italic" }}>
                        No available samples in mastersheet
                      </span>
                    )}
                  </div>
                ) : (
                  /* Manual checklist — pick exact sample numbers */
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <span style={{ fontSize:10, color:"var(--text-muted)" }}>
                        {manualSubjectIds.size} / {availSubjectSamples.length} selected
                      </span>
                      <div style={{ display:"flex", gap:8 }}>
                        <a style={{ fontSize:10, color:"var(--accent)", cursor:"pointer" }}
                          onClick={() => setManualSubjectIds(new Set(availSubjectSamples.map(s => s.id)))}>
                          Select all
                        </a>
                        <a style={{ fontSize:10, color:"var(--text-muted)", cursor:"pointer" }}
                          onClick={() => setManualSubjectIds(new Set())}>
                          Clear
                        </a>
                      </div>
                    </div>
                    <div style={{
                      maxHeight: 220, overflowY: "auto", display:"flex",
                      flexDirection:"column", gap:3, padding:2,
                      border:"1px solid var(--border)", borderRadius:7, background:"white",
                    }}>
                      {availSubjectSamples.map(s => {
                        const checked = manualSubjectIds.has(s.id);
                        return (
                          <label key={s.id} style={{
                            display:"flex", alignItems:"center", gap:8,
                            padding:"4px 8px", borderRadius:6, cursor:"pointer",
                            background: checked ? "var(--accent-light)" : "transparent",
                          }}>
                            <Checkbox checked={checked}
                              onChange={e => toggleManualSubject(s.id, e.target.checked)} />
                            <span style={{ fontFamily:"monospace", fontSize:11, fontWeight:700 }}>
                              {formatSubjectLabel(s.subject, s.period)}
                            </span>
                            <span style={{ fontSize:10, color:"var(--text-muted)" }}>{s.tp}</span>
                          </label>
                        );
                      })}
                      {availSubjectSamples.length === 0 && (
                        <span style={{ fontSize:11, color:"var(--text-muted)", fontStyle:"italic", padding:"4px 8px" }}>
                          No available samples in mastersheet
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ fontSize:10, color:"var(--text-muted)", lineHeight:1.5 }}>
                  Clinic: {activeMastersheet.clinic}
                </div>
                <a
                  href="/freezer"
                  target="_blank"
                  style={{
                    display:"inline-flex", alignItems:"center", gap:4,
                    fontSize:11, color:"var(--accent)", marginTop:6, textDecoration:"none",
                  }}
                >
                  <ExternalLink size={10} /> View full matrix in Freezer Room
                </a>
              </section>
            )}

            {/* Step 3 — QC Sample IDs */}
            {dCcSet && (
              <section>
                <div className="step-label">3 · QC Sample IDs</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10, lineHeight: 1.5 }}>
                  Select the specific QC batch IDs for this run. For fast/fasted studies, pick separate IDs per condition.
                </div>
                <QcGroup label="HQC"     options={hqcOptions}    selected={selHqc}    type="hqc"    />
                <QcGroup label="MQC"     options={mqcOptions}    selected={selMqc}    type="mqc"    />
                <QcGroup label="LQC"     options={lqcOptions}    selected={selLqc}    type="lqc"    />
                <QcGroup label="LLOQ QC" options={lloqQcOptions} selected={selLloqQc} type="lloqQc" />

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>QC Sets</span>
                  <InputNumber min={1} max={5} value={dQcSets} onChange={v => setDQcSets(v ?? 1)}
                    style={{ width: 64 }} size="small" />
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>blocks per run</span>
                </div>
              </section>
            )}

            {/* Step 4 — Other Samples */}
            {dCcSet && (
              <section>
                <div className="step-label">4 · Other Samples</div>
                {OTHER_TYPES.map(({ type, label }) => {
                  const items = otherByType[type] ?? [];
                  if (items.length === 0) return null;
                  return (
                    <div key={type} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>{label}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {items.map(item => (
                          <label key={item.id} style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "5px 8px", borderRadius: 6, cursor: "pointer",
                            background: selectedOtherIds.includes(item.id) ? "#F0EBF5" : "white",
                            border: `1px solid ${selectedOtherIds.includes(item.id) ? "#9B72C4" : "var(--border)"}`,
                            transition: "all 0.1s",
                          }}>
                            <Checkbox checked={selectedOtherIds.includes(item.id)}
                              onChange={e => toggleOtherId(item.id, e.target.checked)} />
                            <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: "#6B4E8A" }}>{item.id}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </section>
            )}

            {/* Step 5 — Run name */}
            <section>
              <div className="step-label">5 · Run / Experiment Name</div>
              <Input placeholder="e.g. Run-12 MET Fasted P1…"
                value={dRunName} onChange={e => setDRunName(e.target.value)}
                style={{ borderColor: dRunName ? "var(--accent)" : undefined }} />
            </section>

            {/* Build button */}
            <Button type="primary" size="large" block
              icon={<FlaskConical size={15} />}
              disabled={!dCcSet || selectedCcTubeIds.size === 0}
              onClick={buildSheet}>
              {sheetBuilt ? "Rebuild Sheet" : "Build Sheet"}
            </Button>
          </div>

          {/* ── RIGHT: Sheet area ──────────────────────────────────────────── */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", background: "white" }}>

            {!sheetBuilt ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", color: "var(--text-muted)" }}>
                <FlaskConical size={48} style={{ marginBottom: 16, opacity: 0.2 }} />
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No sheet built yet</div>
                <div style={{ fontSize: 13, maxWidth: 340, textAlign: "center", lineHeight: 1.6 }}>
                  Select a project and CC Set on the left, choose QC IDs and other samples,
                  then click <strong>Build Sheet</strong>.
                </div>
              </div>
            ) : (
              <>
                {/* Summary strip */}
                <div style={{
                  padding: "10px 24px", borderBottom: "1px solid var(--border)",
                  background: "var(--bg-card)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
                }}>
                  {[
                    { label:"CC",       v:sheetRows.filter(r=>r.type==="CC").length,      color:"#3A6B9B",              bg:"#E8F0FB"            },
                    { label:"QC",       v:sheetRows.filter(r=>r.type==="QC").length,      color:"var(--accent)",        bg:"var(--accent-light)"},
                    { label:"Subjects", v:subjectCount,                                    color:"var(--text-primary)",  bg:"var(--bg-card)"     },
                    { label:"Other",    v:sheetRows.filter(r=>!["CC","QC","Subject"].includes(r.type)).length, color:"#6B4E8A", bg:"#F0EBF5" },
                    { label:"Total",    v:sheetRows.length,                                color:"var(--text-secondary)",bg:"var(--bg-card)"     },
                  ].map(s => (
                    <div key={s.label} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "5px 12px", borderRadius: 8, background: s.bg,
                    }}>
                      <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "DM Serif Display, serif", color: s.color }}>{s.v}</span>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{s.label}</span>
                    </div>
                  ))}
                  {subjectCount > 0 && (
                    <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-secondary)" }}>
                      <span style={{ color: "#E65100", fontWeight: 600 }}>{dilutedCount} diluted</span>
                      {" · "}
                      <span>{subjectCount - dilutedCount} undiluted (DF=1)</span>
                    </div>
                  )}
                  {sheetLocked && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px",
                      borderRadius: 20, background: "#FFF8E1", border: "1px solid #FFD54F" }}>
                      <Lock size={12} style={{ color: "#F57F17" }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#F57F17" }}>SHEET LOCKED</span>
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div style={{ flex: 1, overflowY: "auto", padding: "0 24px" }}>
                  <Tabs activeKey={activeTab} onChange={setActiveTab}
                    items={[
                      {
                        key: "sheet",
                        label: "Distribution Sheet (Print View)",
                        children: (
                          <div>
                            {!sheetLocked && (
                              <div style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "8px 12px", borderRadius: 8, marginBottom: 12,
                                background: "#FFFDE7", border: "1px solid #FFF176", fontSize: 12, color: "#7A6A00",
                              }}>
                                <GripVertical size={13} />
                                Drag rows to reorder · Dilution Factor defaults to <strong style={{ margin: "0 2px" }}>1</strong> — change for diluted samples
                              </div>
                            )}
                            <Table
                              dataSource={sheetRows} columns={sheetViewCols}
                              rowKey="pos" size="middle" pagination={false}
                              scroll={{ y: "calc(100vh - 360px)" }}
                              onRow={(r, idx) => rowProps(r, idx)}
                            />
                          </div>
                        ),
                      },
                      {
                        key: "conc",
                        label: "Concentrations (Back-end View)",
                        children: (
                          <Table
                            dataSource={sheetRows} columns={concViewCols}
                            rowKey="pos" size="middle" pagination={false}
                            scroll={{ y: "calc(100vh - 340px)" }}
                            onRow={(r) => ({
                              style: {
                                background: r.type === "QC" ? "var(--accent-light)"
                                  : r.type === "CC" ? "#f0f5fb" : "transparent",
                              },
                            })}
                          />
                        ),
                      },
                    ]}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .step-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 8px;
        }
      `}</style>
    </AppLayout>
  );
}
