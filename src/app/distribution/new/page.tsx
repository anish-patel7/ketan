"use client";

import { Suspense, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Select, Table, Input, InputNumber, Checkbox, message } from "antd";
import {
  ArrowLeft, ArrowRight, Send, Download, CheckCircle2,
  ChevronRight, Snowflake, PackageSearch, FlaskConical,
} from "lucide-react";
import {
  PROJECTS_LIST, PROJECT_APS, MASTERSHEET, DEFAULT_OTHER_SAMPLES,
  type SampleRow, type MasterSample, type DSRecord, type OtherSamplesConfig,
  buildRunLayout, nextRunNo, nextDsId, loadDsRecords, addDsRecord,
} from "../data";
import { runCols } from "../runColumns";

const { Option } = Select;

const STEPS = [
  { n: 1, label: "Select Project & APS" },
  { n: 2, label: "Select Samples from Mastersheet" },
  { n: 3, label: "Review & Submit" },
];

const OTHER_SAMPLE_OPTIONS: { key: keyof OtherSamplesConfig; label: string }[] = [
  { key:"ses",    label:"SES" },
  { key:"sp",     label:"SP" },
  { key:"blkBlk", label:"BLK/BLK" },
  { key:"lloq",   label:"LLOQ" },
  { key:"uloq",   label:"ULOQ" },
];

function NewDistributionSheetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectFromQuery = searchParams.get("project") ?? "";
  const projectLocked = PROJECTS_LIST.some(p => p.id === projectFromQuery);

  const [step,           setStep]           = useState<1 | 2 | 3>(1);
  const [bProject,       setBProject]       = useState(projectLocked ? projectFromQuery : "");
  const [bAnalyte,       setBAnalyte]       = useState("");
  const [selectedIds,    setSelectedIds]    = useState<Set<string>>(new Set());
  const [sampleFilter,   setSampleFilter]   = useState("");
  const [builtRows,      setBuiltRows]      = useState<SampleRow[]>([]);
  const [submitPassword, setSubmitPassword] = useState("");
  const [qcSets,         setQcSets]         = useState(1);
  const [otherSamples,   setOtherSamples]   = useState<OtherSamplesConfig>({ ...DEFAULT_OTHER_SAMPLES });

  // ── Derived ──

  const bProject_obj = PROJECTS_LIST.find(p => p.id === bProject);
  const bApsData      = bProject && bAnalyte ? PROJECT_APS[bProject]?.[bAnalyte] : undefined;

  const runNo = useMemo(
    () => (bProject && bAnalyte ? nextRunNo(loadDsRecords(), bProject, bAnalyte) : 0),
    [bProject, bAnalyte]
  );

  const masterFiltered = useMemo(() => MASTERSHEET.filter(s =>
    s.project === bProject &&
    s.analyte === bAnalyte &&
    (!sampleFilter || s.subject.includes(sampleFilter) || s.tp.includes(sampleFilter))
  ), [bProject, bAnalyte, sampleFilter]);

  // ── Step 1 handlers ──

  function selectProject(v: string) {
    setBProject(v);
    setBAnalyte("");
    setSelectedIds(new Set());
    setBuiltRows([]);
  }

  function selectAnalyte(v: string) {
    setBAnalyte(v);
    setSelectedIds(new Set());
    setBuiltRows([]);
  }

  function goToStep2() {
    if (!bProject || !bAnalyte || !bApsData) return;
    setSelectedIds(new Set());
    setSampleFilter("");
    setStep(2);
  }

  // ── Step 2 handlers ──

  function goToStep3() {
    if (selectedIds.size === 0 || !bApsData) return;
    const chosen = masterFiltered.filter(s => selectedIds.has(s.id));
    setBuiltRows(buildRunLayout(bApsData, chosen, runNo, qcSets, otherSamples));
    setStep(3);
  }

  // ── Step 3 handlers ──

  function submitDS() {
    if (!bApsData || !bProject_obj) return;
    const chosen = masterFiltered.filter(s => selectedIds.has(s.id));
    const id = nextDsId(loadDsRecords(), bProject, bAnalyte, runNo);
    const newDs: DSRecord = {
      id,
      project: bProject,
      projectName: bProject_obj.name,
      analyte: bAnalyte,
      aps: bApsData.aps,
      runNo,
      ccLevels: bApsData.ccLevels,
      qcSamples: bApsData.qc.length,
      subjectSamples: chosen.length,
      totalPositions: builtRows.length,
      status: "pending",
      createdBy: "A. Liang",
      createdAt: new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }),
      rows: builtRows,
    };
    addDsRecord(newDs);
    message.success(`${id} submitted for Project Leader approval`);
    router.push("/distribution");
  }

  function startOver() {
    setStep(1);
    setBProject(projectLocked ? projectFromQuery : ""); setBAnalyte("");
    setSelectedIds(new Set()); setSampleFilter("");
    setBuiltRows([]); setSubmitPassword("");
    setQcSets(1); setOtherSamples({ ...DEFAULT_OTHER_SAMPLES });
  }

  // ── Mastersheet selection columns ──

  const masterCols = [
    {
      title:"", key:"check", width:36,
      render:(_:unknown, s:MasterSample) => (
        <Checkbox
          checked={selectedIds.has(s.id)}
          onChange={e => {
            const next = new Set(selectedIds);
            e.target.checked ? next.add(s.id) : next.delete(s.id);
            setSelectedIds(next);
          }}
        />
      ),
    },
    {
      title:"Sample ID", dataIndex:"id", key:"id",
      render:(v:string) => <span style={{ fontFamily:"monospace", fontSize:10, color:"var(--accent)" }}>{v}</span>,
    },
    { title:"Subject", dataIndex:"subject", key:"subject", render:(v:string) => <span style={{ fontFamily:"monospace", fontWeight:600 }}>{v}</span> },
    { title:"Period",  dataIndex:"period",  key:"period"  },
    { title:"Time Pt", dataIndex:"tp",      key:"tp",      render:(v:string) => <span style={{ fontFamily:"monospace" }}>{v}</span> },
    { title:"Freezer", dataIndex:"freezer", key:"freezer", render:(v:string) => <span style={{ fontSize:11, color:"var(--status-info)" }}>{v}</span> },
    { title:"Location", dataIndex:"location", key:"location", render:(v:string) => <span style={{ fontSize:11, fontFamily:"monospace" }}>{v}</span> },
    {
      title:"F/T", dataIndex:"ft", key:"ft",
      render:(v:number) => (
        <span style={{ fontSize:12, color: v >= 3 ? "var(--status-fail)" : v >= 2 ? "var(--status-warn)" : "var(--text-secondary)", fontWeight: v >= 2 ? 600 : 400 }}>
          {v}{v >= 3 ? " ⚠" : ""}
        </span>
      ),
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="page-container">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/distribution")}
            className="flex items-center gap-1 mb-3"
            style={{ fontSize:12, fontWeight:600, color:"var(--text-secondary)", background:"none", border:"none", cursor:"pointer", padding:0 }}
          >
            <ArrowLeft size={13} /> Back to Distribution Sheets
          </button>
          <h1 className="section-title">New Distribution Sheet</h1>
          <p className="section-subtitle">
            Select the project number first, then pull subject samples from the Freezer Room Mastersheet and build the analytical run layout.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: step >= s.n ? "var(--accent)" : "var(--border)",
                    color: step >= s.n ? "white" : "var(--text-muted)",
                    fontSize: 11, fontWeight: 700,
                  }}>
                  {step > s.n ? <CheckCircle2 size={12} /> : s.n}
                </div>
                <span style={{ fontSize: 12, fontWeight: step === s.n ? 600 : 400,
                  color: step >= s.n ? "var(--text-primary)" : "var(--text-muted)" }}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && <ChevronRight size={13} style={{ color: "var(--text-muted)" }} />}
            </div>
          ))}
          {step > 1 && (
            <button onClick={startOver} className="ml-auto"
              style={{ fontSize: 11, color: "var(--text-muted)", textDecoration: "underline" }}>
              Start over
            </button>
          )}
        </div>

        {/* ── STEP 1: Project & APS ── */}
        <div className="rounded-xl p-5 mb-5"
          style={{ background:"white", border:`1px solid ${step === 1 ? "var(--accent)" : "var(--border)"}` }}>
          <div className="block-label" style={{ marginBottom:14 }}>
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full mr-2 text-white"
              style={{ background:"var(--accent)", fontSize:10, fontWeight:700 }}>1</span>
            Select Project &amp; Analyte
          </div>

          <div className="grid grid-cols-2 gap-5 mb-5">
            <div>
              <div className="block-label mb-2">Project Number <span style={{ color:"var(--status-fail)" }}>*</span></div>
              <Select
                style={{ width:"100%" }}
                placeholder="Select project number…"
                value={bProject || undefined}
                onChange={selectProject}
                disabled={step > 1 || projectLocked}
                size="large"
              >
                {PROJECTS_LIST.map(p => (
                  <Option key={p.id} value={p.id}>
                    <span style={{ fontFamily:"monospace", fontWeight:600, color:"var(--accent)" }}>{p.id}</span>
                    <span style={{ color:"var(--text-muted)", marginLeft:8, fontSize:12 }}>— {p.name}</span>
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <div className="block-label mb-2">Analyte <span style={{ color:"var(--status-fail)" }}>*</span></div>
              <Select
                style={{ width:"100%" }}
                placeholder={bProject ? "Select analyte…" : "Select a project number first"}
                value={bAnalyte || undefined}
                onChange={selectAnalyte}
                disabled={!bProject || step > 1}
                size="large"
              >
                {(bProject_obj?.analytes ?? []).map(a => (
                  <Option key={a} value={a}>
                    <span style={{ fontFamily:"monospace", fontWeight:700 }}>{a}</span>
                  </Option>
                ))}
              </Select>
            </div>
          </div>

          {/* APS info panel */}
          {bApsData && (
            <div className="rounded-xl p-5 mb-5" style={{ background:"var(--accent-light)", border:"1px solid #c2d4b8" }}>
              <div className="block-label mb-3">APS Details — auto-populated</div>
              <div className="grid grid-cols-4 gap-4 mb-4">
                {[
                  { label:"APS No.",    value:bApsData.aps },
                  { label:"LLOQ",       value:`${bApsData.lloq} ng/mL` },
                  { label:"ULOQ",       value:`${bApsData.uloq} ng/mL` },
                  { label:"CC Levels",  value:String(bApsData.ccLevels) },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--accent)", marginBottom:3 }}>{f.label}</div>
                    <div style={{ fontFamily:"monospace", fontWeight:700, fontSize:13, color:"var(--text-primary)" }}>{f.value}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--accent)", marginBottom:6 }}>CC Concentrations (ng/mL)</div>
                  <div className="flex flex-wrap gap-1">
                    {bApsData.ccConcs.map((c,i) => (
                      <span key={i} style={{ fontFamily:"monospace", fontSize:11, fontWeight:600, background:"white", border:"1px solid var(--accent)", borderRadius:4, padding:"1px 6px", color:"var(--accent)" }}>{c}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--accent)", marginBottom:6 }}>QC Set</div>
                  <div className="flex flex-wrap gap-2">
                    {bApsData.qc.map(q => (
                      <span key={q.name} style={{ fontSize:11, background:"white", border:"1px solid var(--accent)", borderRadius:4, padding:"1px 8px", color:"var(--accent)" }}>
                        <strong>{q.name}</strong> {q.conc} ng/mL
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background:"white", border:"1px solid var(--accent)", width:"fit-content" }}>
                <FlaskConical size={12} style={{ color:"var(--accent)" }} />
                <span style={{ fontSize:12, color:"var(--accent)", fontWeight:600 }}>
                  Run #{runNo} — next available for {bProject} / {bAnalyte}
                </span>
              </div>
            </div>
          )}

          {/* Run Composition — QC sets + other samples */}
          {bApsData && step === 1 && (
            <div className="rounded-xl p-5 mb-5" style={{ background:"white", border:"1px solid var(--border)" }}>
              <div className="block-label mb-3">Run Composition</div>
              <div className="grid grid-cols-2 gap-5 mb-4">
                <div>
                  <div className="block-label mb-2">Number of QC Sets</div>
                  <InputNumber
                    min={1} max={5} value={qcSets}
                    onChange={v => setQcSets(v ?? 1)}
                    style={{ width:"100%" }} size="large"
                  />
                  <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:4 }}>
                    HQC, LLOQ QC, interspersed MQC and the closing LQC anchor are repeated for each QC set, with subject samples divided across sets.
                  </div>
                </div>
              </div>
              <div className="block-label mb-2">
                Other Samples
                <span style={{ fontSize:11, fontWeight:400, color:"var(--text-muted)", marginLeft:6 }}>
                  — appended to the end of the run layout
                </span>
              </div>
              <div className="flex flex-wrap gap-4">
                {OTHER_SAMPLE_OPTIONS.map(o => (
                  <Checkbox
                    key={o.key}
                    checked={otherSamples[o.key]}
                    onChange={e => setOtherSamples(prev => ({ ...prev, [o.key]: e.target.checked }))}
                  >
                    {o.label}
                  </Checkbox>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex justify-end">
              <Button type="primary" icon={<ArrowRight size={13} />}
                disabled={!bProject || !bAnalyte || !bApsData}
                onClick={goToStep2}>
                Select Samples from Mastersheet
              </Button>
            </div>
          )}
        </div>

        {/* ── STEP 2: Sample selection ── */}
        {step >= 2 && (
          <div className="rounded-xl p-5 mb-5"
            style={{ background:"white", border:`1px solid ${step === 2 ? "var(--accent)" : "var(--border)"}` }}>
            <div className="block-label" style={{ marginBottom:14 }}>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full mr-2 text-white"
                style={{ background:"var(--accent)", fontSize:10, fontWeight:700 }}>2</span>
              Select Samples from Mastersheet
            </div>

            {/* Mastersheet header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
                  <Snowflake size={13} style={{ color:"var(--status-info)" }} />
                  <span style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)" }}>Freezer Room Mastersheet</span>
                  <ChevronRight size={11} style={{ color:"var(--text-muted)" }} />
                  <span style={{ fontFamily:"monospace", fontSize:11, color:"var(--accent)" }}>{bProject}</span>
                  <span style={{ fontFamily:"monospace", fontSize:11, fontWeight:700, color:"var(--accent)" }}>/ {bAnalyte}</span>
                </div>
                <span style={{ fontSize:11, color:"var(--text-muted)" }}>
                  {masterFiltered.length} available · {selectedIds.size} selected
                </span>
              </div>
              {step === 2 && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Filter by subject / time point…"
                    value={sampleFilter}
                    onChange={e => setSampleFilter(e.target.value)}
                    style={{ width:240 }}
                    size="small"
                  />
                  <button
                    onClick={() => setSelectedIds(new Set(masterFiltered.map(s => s.id)))}
                    style={{ fontSize:11, fontWeight:600, color:"var(--accent)", background:"var(--accent-light)", border:"1px solid var(--accent)", borderRadius:6, padding:"3px 10px", cursor:"pointer" }}>
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    style={{ fontSize:11, fontWeight:600, color:"var(--status-fail)", background:"var(--status-fail-bg)", border:"1px solid var(--status-fail)", borderRadius:6, padding:"3px 10px", cursor:"pointer" }}>
                    Clear
                  </button>
                </div>
              )}
            </div>

            {masterFiltered.length === 0 ? (
              <div className="flex flex-col items-center py-10 rounded-xl"
                style={{ border:"1px dashed var(--border)", color:"var(--text-muted)" }}>
                <PackageSearch size={28} style={{ marginBottom:8 }} />
                <span style={{ fontSize:13 }}>No available samples in Mastersheet for {bProject} / {bAnalyte}</span>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden mb-4" style={{ border:"1px solid var(--border)", background:"white" }}>
                <Table
                  dataSource={masterFiltered}
                  columns={masterCols}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize:8, showSizeChanger:false }}
                  onRow={(r) => ({
                    onClick:() => {
                      if (step !== 2) return;
                      const next = new Set(selectedIds);
                      selectedIds.has(r.id) ? next.delete(r.id) : next.add(r.id);
                      setSelectedIds(next);
                    },
                    style:{ cursor: step === 2 ? "pointer" : "default", background: selectedIds.has(r.id) ? "var(--accent-light)" : "transparent" },
                  })}
                />
              </div>
            )}

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg mb-4"
                style={{ background:"var(--accent-light)", border:"1px solid var(--accent)" }}>
                <CheckCircle2 size={13} style={{ color:"var(--accent)" }} />
                <span style={{ fontSize:12, fontWeight:600, color:"var(--accent)" }}>
                  {selectedIds.size} subject sample{selectedIds.size !== 1 ? "s" : ""} selected for this run
                </span>
              </div>
            )}

            {step === 2 && (
              <div className="flex justify-between gap-2">
                <Button onClick={() => setStep(1)}>← Back</Button>
                <Button type="primary" icon={<ArrowRight size={13} />}
                  disabled={selectedIds.size === 0}
                  onClick={goToStep3}>
                  Build Run Layout
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Review + Submit ── */}
        {step === 3 && (
          <div className="rounded-xl p-5 mb-5" style={{ background:"white", border:"1px solid var(--accent)" }}>
            <div className="block-label" style={{ marginBottom:14 }}>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full mr-2 text-white"
                style={{ background:"var(--accent)", fontSize:10, fontWeight:700 }}>3</span>
              Review &amp; Submit
            </div>

            {/* APS info bar */}
            <div className="flex items-center gap-4 rounded-xl px-4 py-3 mb-5"
              style={{ background:"var(--accent-light)", border:"1px solid #c2d4b8" }}>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:"var(--accent)" }} />
              <span style={{ fontSize:12, color:"var(--accent)", fontWeight:500 }}>
                {bProject} · {bAnalyte} · Run #{runNo} · APS {bApsData?.aps} · CC {bApsData?.lloq}–{bApsData?.uloq} ng/mL · {bApsData?.ccLevels} levels
              </span>
              <span style={{ fontSize:11, color:"var(--accent)", opacity:0.7, marginLeft:"auto" }}>
                LLOQ: {bApsData?.lloq} · ULOQ: {bApsData?.uloq} ng/mL
              </span>
            </div>

            {/* Run summary chips */}
            <div className="flex gap-3 mb-4">
              {[
                { label:"CC Levels",       value:builtRows.filter(r=>r.type==="CC").length,           color:"#3A6B9B" },
                { label:"QC Samples",      value:builtRows.filter(r=>r.type==="QC").length,           color:"var(--accent)" },
                { label:"Subject Samples", value:builtRows.filter(r=>r.type==="Subject").length,      color:"var(--text-primary)" },
                { label:"Other Samples",   value:builtRows.filter(r=>["SES","SP","BLK/BLK","LLOQ","ULOQ"].includes(r.type)).length, color:"#6B4E8A" },
                { label:"Total Positions", value:builtRows.length,                                    color:"var(--text-secondary)" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2 rounded-lg px-4 py-2"
                  style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
                  <span style={{ fontSize:18, fontWeight:700, fontFamily:"DM Serif Display, serif", color:s.color }}>{s.value}</span>
                  <span style={{ fontSize:11, color:"var(--text-secondary)" }}>{s.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 rounded-lg px-4 py-2 ml-auto"
                style={{ background:"var(--status-pass-bg)", border:"1px solid #a0cbb0" }}>
                <span style={{ fontSize:11, color:"var(--status-pass)", fontWeight:600 }}>
                  ✓ FDA BMV: QC ≥ 5% of total — compliant
                </span>
              </div>
            </div>

            {/* Run layout table */}
            <div className="rounded-xl overflow-hidden mb-5" style={{ border:"1px solid var(--border)", background:"white" }}>
              <Table
                dataSource={builtRows}
                columns={runCols}
                rowKey="pos"
                size="small"
                pagination={false}
                scroll={{ y:360 }}
                onRow={(r) => ({
                  style:{ background: r.type === "Subject" ? "transparent" : r.type === "QC" ? "var(--accent-light)" : r.type === "CC" ? "#f0f5fb" : "transparent" }
                })}
              />
            </div>

            {/* E-signature */}
            <div className="rounded-xl p-4 mb-4" style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
              <div className="block-label mb-2">E-Signature (Analyst)</div>
              <Input.Password
                placeholder="Enter password to submit for Project Leader approval…"
                value={submitPassword}
                onChange={e => setSubmitPassword(e.target.value)}
                style={{ maxWidth:400 }}
              />
              <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:4 }}>
                Meaning: &ldquo;I confirm this Distribution Sheet is complete and ready for Project Leader review.&rdquo;
              </div>
            </div>

            <div className="flex justify-between gap-2">
              <Button onClick={() => setStep(2)}>← Back</Button>
              <div className="flex gap-2">
                <Button icon={<Download size={13} />}
                  style={{ color:"var(--text-secondary)" }}>
                  Export SS Loading Sheet
                </Button>
                <Button type="primary" icon={<Send size={13} />}
                  disabled={!submitPassword}
                  onClick={submitDS}>
                  Submit for Approval
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}

export default function NewDistributionSheetPage() {
  return (
    <Suspense fallback={null}>
      <NewDistributionSheetForm />
    </Suspense>
  );
}
