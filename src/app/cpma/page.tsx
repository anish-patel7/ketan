"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatusTag from "@/components/ui/StatusTag";
import { Button, Input, Select, Table, Modal, Form, Tag, InputNumber, Divider } from "antd";
import {
  Search, ScanLine, FlaskConical, CheckCircle2, AlertTriangle,
  ArrowRight, Beaker, Layers, ThumbsUp, SkipForward, Trash2, Plus,
  Archive, MapPin,
} from "lucide-react";

const { Option } = Select;

const BLOOD_MATRIX  = "WHOLE BLOOD";
const MATRICES      = ["PLASMA", "SERUM", "WHOLE BLOOD", "URINE", "DRIED BLOOD SPOT"];
const MAX_BATCH     = 12;

const PROJECTS = [
  { id: "SID-2026-001", name: "Metformin BE",    drugs: ["MET", "MET-D6"],  subjects: ["SUB-001","SUB-002","SUB-003","SUB-004","SUB-005"] },
  { id: "SID-2026-002", name: "Atorvastatin PK", drugs: ["ATV", "ATV-OH"], subjects: ["SUB-001","SUB-002","SUB-003"] },
  { id: "SID-2025-018", name: "Amlodipine BE",   drugs: ["AML"],            subjects: ["SUB-001","SUB-002"] },
];

const FREEZERS = [
  "FRZ-01 (−80°C)",
  "FRZ-02 (−80°C)",
  "FRZ-03 (−20°C)",
  "FRZ-04 (−20°C)",
];

type ScannedTube = {
  id:        string;
  barcode:   string;
  subject:   string;
  timePoint: string;
  matrix:    string;
  drug:      string;
};

type StorageEntry = {
  key:           string;
  tubeBarcode:   string;
  subject:       string;
  timePoint:     string;
  aliquotIdx:    number;
  volumeMl:      number | null;
  isApprox:      boolean;
  aliquotBarcode: string;
  freezer:       string;
  rack:          string;
  box:           string;
  position:      string;
};

const CENTRIFUGES = [
  { id: "CENT-01", name: "CENT-01 — Eppendorf 5810R" },
  { id: "CENT-02", name: "CENT-02 — Hettich ROTANTA" },
  { id: "CENT-03", name: "CENT-03 — Beckman Allegra X-15R" },
];

const CLINICAL_STAFF = [
  "Dr. S. Nair", "Dr. R. Das", "Dr. V. Kumar", "Ms. A. Sharma", "Mr. P. Singh",
];

const TUBES = [
  { tubeId: "SID001-SUB001-0h-MET-T1",   subject: "SUB-001", timePoint: "0h",   matrix: "PLASMA",      analyte: "MET", received: "07:15", centrifuged: "07:35", aliquots: 4, status: "aliquoted",    quality: "Normal",            location: "CPMA-FRZ-01/B3/P2" },
  { tubeId: "SID001-SUB001-0h-MET-T2",   subject: "SUB-001", timePoint: "0h",   matrix: "PLASMA",      analyte: "MET", received: "07:15", centrifuged: "07:35", aliquots: 4, status: "aliquoted",    quality: "Normal",            location: "CPMA-FRZ-01/B3/P3" },
  { tubeId: "SID001-SUB002-0h-MET-T1",   subject: "SUB-002", timePoint: "0h",   matrix: "PLASMA",      analyte: "MET", received: "07:18", centrifuged: "07:38", aliquots: 4, status: "aliquoted",    quality: "Normal",            location: "CPMA-FRZ-01/B4/P1" },
  { tubeId: "SID001-SUB003-0.5h-MET-T1", subject: "SUB-003", timePoint: "0.5h", matrix: "PLASMA",      analyte: "MET", received: "07:42", centrifuged: null,    aliquots: 0, status: "centrifuging", quality: "Haemolysed (Mild)", location: "—" },
  { tubeId: "SID001-SUB004-0.5h-MET-T1", subject: "SUB-004", timePoint: "0.5h", matrix: "WHOLE BLOOD", analyte: "MET", received: "07:45", centrifuged: null,    aliquots: 0, status: "received",     quality: "—",                 location: "—" },
  { tubeId: "SID001-SUB005-1h-MET-T1",   subject: "SUB-005", timePoint: "1h",   matrix: "PLASMA",      analyte: "MET", received: null,    centrifuged: null,    aliquots: 0, status: "pending",      quality: "—",                 location: "—" },
];

const STAT_CARDS = [
  { label: "Received",     value: "5", color: "var(--status-info)" },
  { label: "Centrifuging", value: "1", color: "var(--status-warn)" },
  { label: "Aliquoted",    value: "3", color: "var(--status-pass)" },
  { label: "Stored",       value: "3", color: "var(--status-pass)" },
  { label: "Pending",      value: "1", color: "var(--text-muted)" },
];

type WfStep = "intake" | "centrifuge" | "post" | "storage";

const STEP_LABEL: Record<WfStep, string> = {
  intake:     "1. Sample Intake",
  centrifuge: "2. Centrifugation",
  post:       "3. Post-Processing",
  storage:    "4. Storage",
};

const cols = [
  { title: "Tube ID",    dataIndex: "tubeId",    key: "tubeId",    render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--accent)" }}>{v}</span> },
  { title: "Subject",    dataIndex: "subject",   key: "subject",   render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
  { title: "Time Point", dataIndex: "timePoint", key: "timePoint" },
  { title: "Matrix",     dataIndex: "matrix",    key: "matrix",    render: (v: string) => <Tag style={{ fontSize: 10 }}>{v}</Tag> },
  { title: "Analyte",    dataIndex: "analyte",   key: "analyte",   render: (v: string) => <Tag style={{ fontSize: 11 }}>{v}</Tag> },
  {
    title: "Received", dataIndex: "received", key: "received",
    render: (v: string | null) => v ? <span style={{ fontSize: 12 }}>{v}</span> : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
  },
  {
    title: "Centrifuged", dataIndex: "centrifuged", key: "centrifuged",
    render: (v: string | null) => v ? <span style={{ fontSize: 12 }}>{v}</span> : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
  },
  {
    title: "Aliquots", dataIndex: "aliquots", key: "aliquots",
    render: (v: number) => v > 0 ? <span style={{ fontSize: 12, fontWeight: 600 }}>{v}</span> : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
  },
  {
    title: "Quality", dataIndex: "quality", key: "quality",
    render: (v: string) => {
      const flag = v.toLowerCase().includes("haemolys") || v.toLowerCase().includes("lipaem");
      return (
        <span style={{ fontSize: 12, color: flag ? "var(--status-warn)" : "var(--text-secondary)", fontWeight: flag ? 600 : 400 }}>
          {flag && <AlertTriangle size={11} style={{ display: "inline", marginRight: 4 }} />}{v}
        </span>
      );
    }
  },
  { title: "Status", dataIndex: "status", key: "status", render: (v: string) => <StatusTag status={v} /> },
  {
    title: "Location", dataIndex: "location", key: "location",
    render: (v: string) => <span style={{ fontSize: 11, fontFamily: "monospace", color: v === "—" ? "var(--text-muted)" : "var(--text-secondary)" }}>{v}</span>
  },
  {
    title: "", key: "actions",
    render: (_: unknown, r: typeof TUBES[0]) => (
      <div className="flex gap-1">
        {r.status === "received" && (
          <button className="text-xs px-2 py-1 rounded flex items-center gap-1"
            style={{ background: "var(--accent-light)", color: "var(--accent)", fontWeight: 600 }}>
            <ArrowRight size={11} /> Process
          </button>
        )}
        {r.status === "centrifuging" && (
          <button className="text-xs px-2 py-1 rounded flex items-center gap-1"
            style={{ background: "var(--status-info-bg)", color: "var(--status-info)", fontWeight: 600 }}>
            <FlaskConical size={11} /> Aliquot
          </button>
        )}
      </div>
    )
  },
];

export default function CPMAPage() {
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [search,      setSearch]      = useState("");

  /* workflow state */
  const [wfStep,         setWfStep]         = useState<WfStep>("intake");
  const [scannedTubes,   setScannedTubes]   = useState<ScannedTube[]>([]);
  const [scanInput,      setScanInput]      = useState("");
  const [scanMatrix,     setScanMatrix]     = useState("");
  const [scanSubject,    setScanSubject]    = useState("");
  const [scanTimePoint,  setScanTimePoint]  = useState("");
  const [scanDrug,       setScanDrug]       = useState("");
  const [matrixError,    setMatrixError]    = useState("");
  const [duplicateError, setDuplicateError] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [centEquip,      setCentEquip]      = useState<string>("");
  const [centRunning,    setCentRunning]    = useState(false);
  const [centDone,       setCentDone]       = useState(false);
  const [centTemp,       setCentTemp]       = useState<number | null>(null);
  const [centDuration,   setCentDuration]   = useState<number | null>(null);
  const [centStartTime,  setCentStartTime]  = useState<string | null>(null);
  const [centEndTime,    setCentEndTime]    = useState<string | null>(null);
  const [receivedFrom,   setReceivedFrom]   = useState<string>("");
  const [aliquotCount,   setAliquotCount]   = useState<number | null>(null);
  const [aliquotVolumes, setAliquotVolumes] = useState<(number | null)[]>([]);

  /* storage state */
  const [storageEntries, setStorageEntries] = useState<StorageEntry[]>([]);
  const [defaultFreezer, setDefaultFreezer] = useState("");
  const [defaultRack,    setDefaultRack]    = useState("");
  const [defaultBox,     setDefaultBox]     = useState("");

  const batchMatrix = scannedTubes[0]?.matrix ?? "";
  const isBlood     = batchMatrix === BLOOD_MATRIX;

  function openModal() {
    setWfStep("intake");
    setScannedTubes([]);
    setScanInput("");
    setScanMatrix("");
    setScanSubject("");
    setScanTimePoint("");
    setMatrixError("");
    setCentEquip("");
    setCentRunning(false);
    setCentDone(false);
    setCentTemp(null);
    setCentDuration(null);
    setCentStartTime(null);
    setCentEndTime(null);
    setReceivedFrom("");
    setAliquotCount(null);
    setAliquotVolumes([]);
    setStorageEntries([]);
    setDefaultFreezer("");
    setDefaultRack("");
    setDefaultBox("");
    setScanDrug("");
    setDuplicateError("");
    setSelectedProject("");
    setReceiveOpen(true);
  }

  /* Parse barcode like SID001-SUB001-0h-MET-T1 → auto-fill fields */
  function parseTubeBarcode(barcode: string) {
    const parts = barcode.trim().split("-");
    if (parts.length < 4) return;
    const rawSubj = parts[1] ?? "";
    const subject = rawSubj.match(/^([A-Za-z]+)(\d+)$/)
      ? rawSubj.replace(/^([A-Za-z]+)(\d+)$/, "$1-$2").toUpperCase()
      : rawSubj.toUpperCase();
    const timePoint = parts[2] ?? "";
    const drug      = (parts[3] ?? "").toUpperCase();
    if (subject)   setScanSubject(subject);
    if (timePoint) setScanTimePoint(timePoint);
    if (drug)      setScanDrug(drug);
  }

  function handleBarcodeInput(value: string) {
    setScanInput(value);
    setDuplicateError("");
    if (value.includes("-") && value.length >= 10) parseTubeBarcode(value);
  }

  function addTube() {
    const barcode = scanInput.trim();
    if (!barcode || !scanMatrix || !scanSubject || !scanTimePoint) return;
    if (scannedTubes.length >= MAX_BATCH) return;

    /* Duplicate check — current batch */
    if (scannedTubes.some(t => t.barcode === barcode)) {
      setDuplicateError("Duplicate — this barcode is already in the current batch.");
      return;
    }
    /* Duplicate check — already processed */
    if (TUBES.some(t => t.tubeId === barcode)) {
      setDuplicateError("Duplicate — this tube has already been processed in a previous run.");
      return;
    }

    /* Matrix lock */
    if (scannedTubes.length > 0 && scannedTubes[0].matrix !== scanMatrix) {
      setMatrixError(`Matrix mismatch — batch is ${scannedTubes[0].matrix}. Remove existing tubes or start a new batch.`);
      return;
    }

    setMatrixError("");
    setDuplicateError("");
    setScannedTubes(prev => [...prev, {
      id:        String(Date.now()),
      barcode,
      subject:   scanSubject,
      timePoint: scanTimePoint,
      matrix:    scanMatrix,
      drug:      scanDrug,
    }]);
    setScanInput(""); setScanSubject(""); setScanTimePoint(""); setScanDrug("");
    setScanMatrix(scannedTubes.length === 0 ? scanMatrix : scannedTubes[0].matrix);
  }

  function removeTube(id: string) {
    setScannedTubes(prev => {
      const next = prev.filter(t => t.id !== id);
      if (next.length === 0) { setScanMatrix(""); setMatrixError(""); }
      return next;
    });
  }

  function handleAliquotCountChange(n: number | null) {
    if (!n) { setAliquotCount(null); setAliquotVolumes([]); return; }
    setAliquotCount(n);
    setAliquotVolumes(Array(n).fill(null));
  }

  function updateAliquotVolume(idx: number, val: number | null) {
    setAliquotVolumes(prev => prev.map((v, i) => i === idx ? val : v));
  }

  function closeModal() {
    setReceiveOpen(false);
  }

  function proceedFromIntake() {
    if (scannedTubes.length === 0) return;
    if (!isBlood && !centEquip) return;
    setWfStep(isBlood ? "post" : "centrifuge");
  }

  function formatTime(date: Date): string {
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  function startCentrifuge() {
    if (!centDuration) return;
    const now = new Date();
    setCentStartTime(formatTime(now));
    const end = new Date(now.getTime() + centDuration * 60 * 1000);
    setCentEndTime(formatTime(end));
    setCentRunning(true);
    setTimeout(() => {
      setCentRunning(false);
      setCentDone(true);
    }, centDuration * 60 * 1000);
  }

  function proceedFromCentrifuge() {
    if (!centDone) return;
    setWfStep("post");
  }

  function proceedFromPost() {
    if (!aliquotCount || aliquotCount < 1) return;
    const entries: StorageEntry[] = [];
    scannedTubes.forEach(tube => {
      for (let i = 0; i < aliquotCount; i++) {
        entries.push({
          key:            `${tube.id}-${i}`,
          tubeBarcode:    tube.barcode,
          subject:        tube.subject,
          timePoint:      tube.timePoint,
          aliquotIdx:     i,
          volumeMl:       aliquotVolumes[i] ?? null,
          isApprox:       i === aliquotCount - 1,
          aliquotBarcode: "",
          freezer:        "",
          rack:           "",
          box:            "",
          position:       "",
        });
      }
    });
    setStorageEntries(entries);
    setWfStep("storage");
  }

  function updateStorage(key: string, field: keyof StorageEntry, value: string) {
    setStorageEntries(prev => prev.map(e => e.key === key ? { ...e, [field]: value } : e));
  }

  function applyDefaults() {
    setStorageEntries(prev => prev.map(e => ({
      ...e,
      freezer: defaultFreezer || e.freezer,
      rack:    defaultRack    || e.rack,
      box:     defaultBox     || e.box,
    })));
  }

  const filtered = TUBES.filter(t =>
    t.tubeId.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.status.toLowerCase().includes(search.toLowerCase())
  );

  const steps: WfStep[] = isBlood
    ? ["intake", "post", "storage"]
    : ["intake", "centrifuge", "post", "storage"];

  return (
    <AppLayout>
      <div className="page-container">

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="section-title">Sample Separation</h1>
            <p className="section-subtitle">
              SID-2026-001 — Metformin BE · Batch scanning, centrifugation &amp; plasma separation
            </p>
          </div>
          <Button type="primary" icon={<ScanLine size={14} />} onClick={openModal}>
            Receive Tube
          </Button>
        </div>

        {/* Stat chips */}
        <div className="flex gap-3 mb-6">
          {STAT_CARDS.map(s => (
            <div key={s.label} className="flex items-center gap-2 rounded-lg px-4 py-2.5"
              style={{ background: "white", border: "1px solid var(--border)" }}>
              <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "DM Serif Display, serif", color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filters + Table */}
        <div className="flex gap-3 mb-4">
          <Input
            prefix={<Search size={13} style={{ color: "var(--text-muted)" }} />}
            placeholder="Search by tube ID, subject or status…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 340 }}
          />
          <Select placeholder="Status" style={{ width: 160 }} allowClear>
            <Option value="pending">Pending</Option>
            <Option value="received">Received</Option>
            <Option value="centrifuging">Centrifuging</Option>
            <Option value="aliquoted">Aliquoted</Option>
          </Select>
          <Select placeholder="Matrix" style={{ width: 160 }} allowClear>
            {MATRICES.map(m => <Option key={m} value={m}>{m}</Option>)}
          </Select>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "white" }}>
          <Table dataSource={filtered} columns={cols} rowKey="tubeId" size="small" pagination={{ pageSize: 12, showSizeChanger: false }} />
        </div>

        {/* ════════════════════════════════════════════
            SAMPLE PROCESSING MODAL
        ════════════════════════════════════════════ */}
        <Modal
          title={
            <div>
              <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 18, marginBottom: 12 }}>
                Sample Separation
              </div>
              {/* Step indicator */}
              <div className="flex items-center gap-2 flex-wrap">
                {steps.map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: wfStep === s ? "var(--accent)" : steps.indexOf(wfStep) > i ? "var(--status-pass)" : "var(--border)",
                          color: "white", fontSize: 10, fontWeight: 700,
                        }}>
                        {steps.indexOf(wfStep) > i ? <CheckCircle2 size={11} /> : i + 1}
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: wfStep === s ? 700 : 400,
                        color: wfStep === s ? "var(--accent)" : steps.indexOf(wfStep) > i ? "var(--status-pass)" : "var(--text-muted)",
                      }}>
                        {STEP_LABEL[s]}
                      </span>
                    </div>
                    {i < steps.length - 1 && <ArrowRight size={11} style={{ color: "var(--border-strong)" }} />}
                  </div>
                ))}
                {isBlood && batchMatrix && (
                  <span className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full"
                    style={{ background: "var(--status-info-bg)", color: "var(--status-info)", fontSize: 10, fontWeight: 600 }}>
                    <SkipForward size={10} /> Centrifuge skipped — Whole Blood
                  </span>
                )}
              </div>
            </div>
          }
          open={receiveOpen}
          onCancel={closeModal}
          footer={null}
          width={680}
        >

          {/* ── STEP 1: Sample Intake ── */}
          {wfStep === "intake" && (
            <div style={{ marginTop: 16 }}>

              {/* Project selector */}
              <div className="rounded-lg px-4 py-3 mb-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div className="block-label mb-2">Project</div>
                <Select
                  placeholder="Select project to link this batch…"
                  style={{ width: "100%" }}
                  value={selectedProject || undefined}
                  onChange={v => { setSelectedProject(v); setScanSubject(""); setScanDrug(""); }}
                  allowClear
                >
                  {PROJECTS.map(p => (
                    <Option key={p.id} value={p.id}>
                      <span style={{ fontWeight: 600 }}>{p.id}</span>
                      <span style={{ color: "var(--text-muted)", marginLeft: 8, fontSize: 12 }}>— {p.name}</span>
                    </Option>
                  ))}
                </Select>
                {selectedProject && (() => {
                  const proj = PROJECTS.find(p => p.id === selectedProject)!;
                  return (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {proj.drugs.map(d => (
                        <span key={d} style={{ fontSize: 10, fontWeight: 700, fontFamily: "monospace",
                          background: "var(--accent-light)", color: "var(--accent)",
                          border: "1px solid var(--accent)", borderRadius: 4, padding: "1px 6px" }}>{d}</span>
                      ))}
                      <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 4, alignSelf: "center" }}>
                        {proj.subjects.length} subjects
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className="flex items-center justify-between mb-3">
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                  Batch — scan up to {MAX_BATCH} tubes for simultaneous centrifugation
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 700, fontFamily: "monospace",
                  color: scannedTubes.length >= MAX_BATCH ? "var(--status-fail)" : "var(--accent)",
                }}>
                  {scannedTubes.length} / {MAX_BATCH}
                </span>
              </div>

              <div className="rounded-lg p-4 mb-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div className="block-label mb-3">Scan Vacutainer Barcode</div>
                <div className="flex gap-2 mb-3">
                  <Input
                    prefix={<ScanLine size={14} style={{ color: "var(--accent)" }} />}
                    placeholder="Scan barcode — subject, time point & drug auto-filled…"
                    size="large"
                    value={scanInput}
                    onChange={e => handleBarcodeInput(e.target.value)}
                    onPressEnter={addTube}
                    style={{ fontFamily: "monospace", flex: 1 }}
                    autoFocus
                    disabled={scannedTubes.length >= MAX_BATCH}
                  />
                  <Button size="large" icon={<Plus size={14} />} onClick={addTube}
                    disabled={!scanInput.trim() || !scanMatrix || !scanSubject || !scanTimePoint || scannedTubes.length >= MAX_BATCH}>
                    Add
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <Select size="small" placeholder="Subject ID" value={scanSubject || undefined}
                    onChange={setScanSubject} disabled={scannedTubes.length >= MAX_BATCH}>
                    {(selectedProject
                      ? PROJECTS.find(p => p.id === selectedProject)?.subjects ?? []
                      : [...new Set(TUBES.map(t => t.subject))]
                    ).map(s => <Option key={s} value={s}>{s}</Option>)}
                  </Select>
                  <Select size="small" placeholder="Time Point" value={scanTimePoint || undefined}
                    onChange={setScanTimePoint} disabled={scannedTubes.length >= MAX_BATCH}>
                    {["0h","0.5h","1h","2h","4h","8h","12h","24h"].map(tp => <Option key={tp} value={tp}>{tp}</Option>)}
                  </Select>
                  <Select size="small" placeholder="Drug" value={scanDrug || undefined}
                    onChange={setScanDrug} disabled={scannedTubes.length >= MAX_BATCH}>
                    {(selectedProject
                      ? PROJECTS.find(p => p.id === selectedProject)?.drugs ?? []
                      : [...new Set(TUBES.map(t => t.analyte))]
                    ).map(d => <Option key={d} value={d}>{d}</Option>)}
                  </Select>
                  <Select size="small" placeholder="Matrix" value={scanMatrix || undefined}
                    onChange={v => { setScanMatrix(v); setMatrixError(""); }}
                    disabled={scannedTubes.length >= MAX_BATCH || (scannedTubes.length > 0)}>
                    {MATRICES.map(m => <Option key={m} value={m}>{m}</Option>)}
                  </Select>
                </div>
                {duplicateError && (
                  <div className="flex items-center gap-1.5 mt-2" style={{ color: "var(--status-fail)", fontSize: 11 }}>
                    <AlertTriangle size={11} /> {duplicateError}
                  </div>
                )}
                {matrixError && (
                  <div className="flex items-center gap-1.5 mt-2" style={{ color: "var(--status-fail)", fontSize: 11 }}>
                    <AlertTriangle size={11} /> {matrixError}
                  </div>
                )}
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>
                  Barcode auto-fills subject, time point &amp; drug · All tubes must share the same matrix
                </div>
              </div>

              {scannedTubes.length > 0 && (
                <div className="rounded-lg overflow-hidden mb-4" style={{ border: "1px solid var(--border)" }}>
                  <div className="grid px-3 py-2" style={{ gridTemplateColumns: "20px 1fr 72px 60px 56px 84px 24px", gap: 8, background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                    {["#","Barcode","Subject","T.Pt","Drug","Matrix",""].map(h => (
                      <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>{h}</span>
                    ))}
                  </div>
                  {scannedTubes.map((t, i) => (
                    <div key={t.id} className="grid items-center px-3 py-2"
                      style={{ gridTemplateColumns: "20px 1fr 72px 60px 56px 84px 24px", gap: 8,
                        borderBottom: i < scannedTubes.length - 1 ? "1px solid var(--border)" : "none",
                        background: "white" }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{i + 1}</span>
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--accent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.barcode}</span>
                      <span style={{ fontSize: 11, fontWeight: 600 }}>{t.subject}</span>
                      <span style={{ fontSize: 11, fontFamily: "monospace" }}>{t.timePoint}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "monospace",
                        background: "var(--accent-light)", color: "var(--accent)",
                        borderRadius: 4, padding: "1px 5px", whiteSpace: "nowrap" }}>{t.drug || "—"}</span>
                      <Tag style={{ fontSize: 10, margin: 0 }}>{t.matrix}</Tag>
                      <button onClick={() => removeTube(t.id)} style={{ color: "var(--status-fail)" }} className="opacity-40 hover:opacity-80">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {scannedTubes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 rounded-lg mb-4"
                  style={{ border: "1px dashed var(--border)", color: "var(--text-muted)" }}>
                  <ScanLine size={22} style={{ marginBottom: 8 }} />
                  <span style={{ fontSize: 12 }}>No tubes scanned yet — scan at least 1 to proceed</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-x-4">
                <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600 }}>Received From <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></span>}>
                  <Select placeholder="Select clinical staff" allowClear value={receivedFrom || undefined} onChange={setReceivedFrom}>
                    {CLINICAL_STAFF.map(s => <Option key={s} value={s}>{s}</Option>)}
                  </Select>
                </Form.Item>
                {scannedTubes.length > 0 && !isBlood && (
                  <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600 }}>Centrifuge Equipment ID <span style={{ color: "var(--status-fail)" }}>*</span></span>}>
                    <Select placeholder="Select centrifuge" value={centEquip || undefined} onChange={setCentEquip}>
                      {CENTRIFUGES.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                    </Select>
                  </Form.Item>
                )}
              </div>

              {isBlood && (
                <div className="flex items-start gap-3 rounded-lg p-3 mb-4"
                  style={{ background: "var(--status-info-bg)", border: "1px solid var(--status-info)" }}>
                  <SkipForward size={14} style={{ color: "var(--status-info)", flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--status-info)" }}>Whole Blood — Centrifugation skipped</div>
                    <div style={{ fontSize: 11, color: "var(--status-info)", marginTop: 2 }}>
                      No centrifugation required. Proceed directly to aliquoting.
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-2">
                <Button onClick={closeModal}>Cancel</Button>
                <Button type="primary" icon={<ArrowRight size={13} />}
                  disabled={scannedTubes.length === 0 || (!isBlood && !centEquip)}
                  onClick={proceedFromIntake}>
                  {isBlood ? `Proceed to Aliquoting (${scannedTubes.length} tube${scannedTubes.length > 1 ? "s" : ""})` : `Proceed to Centrifugation (${scannedTubes.length} tube${scannedTubes.length > 1 ? "s" : ""})`}
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Centrifugation ── */}
          {wfStep === "centrifuge" && (
            <div style={{ marginTop: 16 }}>

              <div className="rounded-lg px-4 py-3 mb-4" style={{ background: "var(--accent-light)", border: "1px solid var(--accent)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Beaker size={14} style={{ color: "var(--accent)" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>
                    {CENTRIFUGES.find(c => c.id === centEquip)?.name ?? centEquip}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>
                    {scannedTubes.length} tube{scannedTubes.length > 1 ? "s" : ""} · {batchMatrix}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {scannedTubes.map(t => (
                    <span key={t.id} style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 600,
                      background: "white", border: "1px solid var(--accent)", borderRadius: 4,
                      padding: "1px 6px", color: "var(--accent)" }}>
                      {t.subject} · {t.timePoint}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-x-4">
                <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600 }}>Speed (RPM) <span style={{ color: "var(--status-fail)" }}>*</span></span>}>
                  <InputNumber style={{ width: "100%" }} placeholder="e.g. 3000" min={100} max={15000} />
                </Form.Item>
                <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600 }}>Duration (min) <span style={{ color: "var(--status-fail)" }}>*</span></span>}>
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="e.g. 10"
                    min={1} max={120}
                    value={centDuration ?? undefined}
                    onChange={val => setCentDuration(val)}
                    suffix={<span style={{ fontSize: 11, color: "var(--text-muted)" }}>min</span>}
                    disabled={centRunning || centDone}
                  />
                </Form.Item>
                <Form.Item
                  label={
                    <span style={{ fontSize: 11, fontWeight: 600 }}>
                      Temperature (°C) <span style={{ color: "var(--status-fail)" }}>*</span>
                    </span>
                  }
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="e.g. 10"
                    min={-10} max={40}
                    value={centTemp ?? undefined}
                    onChange={val => setCentTemp(val)}
                    prefix={<span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>&lt;</span>}
                    suffix={<span style={{ fontSize: 11, color: "var(--text-muted)" }}>°C</span>}
                  />
                  {centTemp !== null && (
                    <div style={{ marginTop: 4, fontSize: 11, fontWeight: 600, color: "var(--status-info)" }}>
                      Must run at &lt; {centTemp}°C
                    </div>
                  )}
                </Form.Item>
              </div>

              <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600 }}>Operator Notes</span>}>
                <Input.TextArea rows={2} placeholder="Any centrifuge run notes or deviations…" />
              </Form.Item>

              {centStartTime && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-lg px-4 py-3 flex flex-col gap-1"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                      Start Time
                    </span>
                    <span style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>
                      {centStartTime}
                    </span>
                  </div>
                  <div className="rounded-lg px-4 py-3 flex flex-col gap-1"
                    style={{ background: centDone ? "var(--status-pass-bg)" : "var(--bg-card)", border: `1px solid ${centDone ? "var(--status-pass)" : "var(--border)"}` }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                      Expected End Time {!centDuration && <span style={{ fontWeight: 400 }}>(enter duration)</span>}
                    </span>
                    <span style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: centDone ? "var(--status-pass)" : centEndTime ? "var(--text-primary)" : "var(--text-muted)" }}>
                      {centEndTime ?? "—"}
                    </span>
                  </div>
                </div>
              )}

              {centDone ? (
                <div className="flex items-center gap-3 rounded-lg px-4 py-3 mb-4"
                  style={{ background: "var(--status-pass-bg)", border: "1px solid var(--status-pass)" }}>
                  <CheckCircle2 size={14} style={{ color: "var(--status-pass)" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--status-pass)" }}>
                    Centrifugation complete — plasma separated
                  </span>
                </div>
              ) : centRunning ? (
                <div className="flex items-center gap-3 rounded-lg px-4 py-3 mb-4"
                  style={{ background: "var(--status-warn-bg)", border: "1px solid var(--status-warn)" }}>
                  <div className="animate-spin" style={{ width: 14, height: 14, border: "2px solid var(--status-warn)", borderTopColor: "transparent", borderRadius: "50%" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--status-warn)" }}>
                    Centrifuge running… &nbsp;
                    {centEndTime && <span style={{ fontWeight: 400, fontSize: 12 }}>Expected end: {centEndTime}</span>}
                  </span>
                </div>
              ) : null}

              <div className="flex justify-between gap-2 mt-2">
                <Button onClick={() => setWfStep("intake")}>← Back</Button>
                <div className="flex gap-2">
                  {!centDone && (
                    <Button
                      icon={<Beaker size={13} />}
                      loading={centRunning}
                      disabled={!centDuration || centRunning}
                      onClick={startCentrifuge}
                    >
                      {centRunning ? `Running… ends at ${centEndTime ?? "—"}` : "Start Centrifugation"}
                    </Button>
                  )}
                  <Button
                    type="primary"
                    icon={<ArrowRight size={13} />}
                    disabled={!centDone}
                    onClick={proceedFromCentrifuge}
                  >
                    Proceed to Post-Processing
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Post-Processing ── */}
          {wfStep === "post" && (
            <div style={{ marginTop: 16 }}>

              <div className="rounded-lg px-4 py-3 mb-4" style={{ background: "var(--accent-light)", border: "1px solid var(--accent)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Layers size={14} style={{ color: "var(--accent)" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>
                    {scannedTubes.length} tube{scannedTubes.length > 1 ? "s" : ""} · {batchMatrix}
                    {!isBlood && centEquip && <> · {CENTRIFUGES.find(c => c.id === centEquip)?.id} · Separated</>}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {scannedTubes.map(t => (
                    <span key={t.id} style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 600,
                      background: "white", border: "1px solid var(--accent)", borderRadius: 4,
                      padding: "1px 6px", color: "var(--accent)" }}>
                      {t.subject} · {t.timePoint}
                    </span>
                  ))}
                </div>
              </div>

              {!isBlood && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 10 }}>
                    Sample Quality Observation
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 mb-2">
                    <Form.Item
                      label={<span style={{ fontSize: 11, fontWeight: 600 }}>Quality <span style={{ color: "var(--status-fail)" }}>*</span></span>}
                    >
                      <Select placeholder="Select observation" defaultValue="normal">
                        <Option value="normal">Normal</Option>
                        <Option value="haemolysed_mild">Haemolysed (Mild)</Option>
                        <Option value="haemolysed_moderate">Haemolysed (Moderate)</Option>
                        <Option value="haemolysed_severe">Haemolysed (Severe)</Option>
                        <Option value="lipaemic">Lipaemic</Option>
                        <Option value="turbid">Turbid</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600 }}>Plasma Appearance</span>}>
                      <Select placeholder="Select">
                        <Option value="clear">Clear</Option>
                        <Option value="slightly_turbid">Slightly Turbid</Option>
                        <Option value="turbid">Turbid</Option>
                        <Option value="haemolysed">Haemolysed</Option>
                      </Select>
                    </Form.Item>
                  </div>
                  <Divider style={{ margin: "8px 0 16px", borderColor: "var(--border)" }} />
                </>
              )}

              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 10 }}>
                Aliquot Details
              </div>

              <Form.Item
                label={<span style={{ fontSize: 11, fontWeight: 600 }}>No. of Aliquots <span style={{ color: "var(--status-fail)" }}>*</span></span>}
                style={{ marginBottom: aliquotCount ? 12 : 0 }}
              >
                <InputNumber
                  style={{ width: 160 }}
                  placeholder="e.g. 4"
                  min={1} max={20}
                  value={aliquotCount ?? undefined}
                  onChange={handleAliquotCountChange}
                />
              </Form.Item>

              {aliquotCount && aliquotCount > 0 && (
                <div className="rounded-lg overflow-hidden mb-4" style={{ border: "1px solid var(--border)" }}>
                  <div className="grid grid-cols-2 px-4 py-2"
                    style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase" }}>#</span>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase" }}>Volume (mL)</span>
                  </div>

                  {Array.from({ length: aliquotCount }, (_, idx) => {
                    const isLast = idx === aliquotCount - 1;
                    return (
                      <div key={idx} className="grid grid-cols-2 items-center px-4 py-2.5"
                        style={{
                          borderBottom: idx < aliquotCount - 1 ? "1px solid var(--border)" : "none",
                          background: isLast ? "var(--status-info-bg)" : "white",
                        }}>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white flex-shrink-0"
                            style={{ background: isLast ? "var(--status-info)" : "var(--accent)", fontSize: 10, fontWeight: 700 }}>
                            {idx + 1}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: isLast ? "var(--status-info)" : "var(--text-primary)" }}>
                            Aliquot {idx + 1}
                            {isLast && <span style={{ fontSize: 10, fontWeight: 400, color: "var(--status-info)", marginLeft: 4 }}>(last — approx remaining)</span>}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <InputNumber
                            size="small"
                            style={{ width: 110 }}
                            placeholder="0.00"
                            min={0.01} step={isLast ? 0.01 : 0.1}
                            value={aliquotVolumes[idx] ?? undefined}
                            onChange={val => updateAliquotVolume(idx, val)}
                            addonAfter="mL"
                          />
                          {isLast && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--status-info)",
                              background: "var(--status-info-bg)", border: "1px solid var(--status-info)",
                              borderRadius: 4, padding: "1px 5px" }}>
                              approx
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {aliquotVolumes.some(v => v !== null) && (
                    <div className="flex items-center justify-between px-4 py-2"
                      style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>Total volume</span>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
                        {parseFloat(aliquotVolumes.reduce<number>((s, v) => s + (v ?? 0), 0).toFixed(2))} mL
                      </span>
                    </div>
                  )}
                </div>
              )}

              <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600 }}>Remarks / Deviations</span>}>
                <Input.TextArea rows={2} placeholder="Any post-processing observations or deviations from protocol…" />
              </Form.Item>

              <div className="flex justify-between gap-2 mt-2">
                <Button onClick={() => setWfStep(isBlood ? "intake" : "centrifuge")}>← Back</Button>
                <Button type="primary" icon={<ArrowRight size={13} />}
                  disabled={!aliquotCount || aliquotCount < 1}
                  onClick={proceedFromPost}>
                  Proceed to Storage
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Storage ── */}
          {wfStep === "storage" && (
            <div style={{ marginTop: 16 }}>

              {/* Header banner */}
              <div className="rounded-lg px-4 py-3 mb-4 flex items-center gap-3"
                style={{ background: "var(--accent-light)", border: "1px solid var(--accent)" }}>
                <Archive size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>
                    {storageEntries.length} aliquot{storageEntries.length !== 1 ? "s" : ""} to store
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>
                    {scannedTubes.length} tube{scannedTubes.length > 1 ? "s" : ""} · {aliquotCount} aliquot{aliquotCount !== 1 ? "s" : ""} each · {batchMatrix}
                  </span>
                </div>
              </div>

              {/* Quick-fill defaults */}
              <div className="rounded-lg p-4 mb-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div className="block-label mb-3">Quick-fill defaults — apply to all rows</div>
                <div className="grid grid-cols-4 gap-3 items-end">
                  <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600 }}>Freezer</span>} style={{ marginBottom: 0 }}>
                    <Select
                      placeholder="Select freezer"
                      size="small"
                      value={defaultFreezer || undefined}
                      onChange={setDefaultFreezer}
                      allowClear
                    >
                      {FREEZERS.map(f => <Option key={f} value={f}>{f}</Option>)}
                    </Select>
                  </Form.Item>
                  <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600 }}>Rack</span>} style={{ marginBottom: 0 }}>
                    <Input size="small" placeholder="e.g. R-03" value={defaultRack} onChange={e => setDefaultRack(e.target.value)} />
                  </Form.Item>
                  <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600 }}>Box</span>} style={{ marginBottom: 0 }}>
                    <Input size="small" placeholder="e.g. B-07" value={defaultBox} onChange={e => setDefaultBox(e.target.value)} />
                  </Form.Item>
                  <Button size="small" onClick={applyDefaults}
                    disabled={!defaultFreezer && !defaultRack && !defaultBox}
                    style={{ marginBottom: 0 }}>
                    Apply to All
                  </Button>
                </div>
              </div>

              {/* Per-aliquot storage grid */}
              <div className="rounded-lg overflow-hidden mb-4" style={{ border: "1px solid var(--border)" }}>
                {/* Column headers */}
                <div className="grid px-3 py-2"
                  style={{ gridTemplateColumns: "22px 80px 55px 50px 1fr 70px 70px 70px 80px", gap: 6,
                    background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                  {["#","Subject","T.Pt","Ali.","Vol","Freezer","Rack","Box","Position"].map(h => (
                    <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)" }}>{h}</span>
                  ))}
                </div>

                {storageEntries.map((entry, i) => (
                  <div key={entry.key} className="grid items-center px-3 py-2"
                    style={{
                      gridTemplateColumns: "22px 80px 55px 50px 1fr 70px 70px 70px 80px", gap: 6,
                      borderBottom: i < storageEntries.length - 1 ? "1px solid var(--border)" : "none",
                      background: i % 2 === 0 ? "white" : "var(--bg-page)",
                    }}>
                    <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>{i + 1}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.subject}</span>
                    <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-secondary)" }}>{entry.timePoint}</span>
                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white flex-shrink-0"
                        style={{ background: entry.isApprox ? "var(--status-info)" : "var(--accent)", fontSize: 9, fontWeight: 700 }}>
                        {entry.aliquotIdx + 1}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-secondary)" }}>
                      {entry.volumeMl ? `${entry.volumeMl} mL${entry.isApprox ? " ~" : ""}` : "—"}
                    </span>
                    <Select
                      size="small"
                      placeholder="Freezer"
                      value={entry.freezer || undefined}
                      onChange={v => updateStorage(entry.key, "freezer", v)}
                      style={{ width: "100%" }}
                    >
                      {FREEZERS.map(f => <Option key={f} value={f}>{f.split(" ")[0]}</Option>)}
                    </Select>
                    <Input
                      size="small"
                      placeholder="Rack"
                      value={entry.rack}
                      onChange={e => updateStorage(entry.key, "rack", e.target.value)}
                    />
                    <Input
                      size="small"
                      placeholder="Box"
                      value={entry.box}
                      onChange={e => updateStorage(entry.key, "box", e.target.value)}
                    />
                    <Input
                      size="small"
                      placeholder="A1"
                      value={entry.position}
                      onChange={e => updateStorage(entry.key, "position", e.target.value)}
                      prefix={<MapPin size={9} style={{ color: "var(--text-muted)" }} />}
                    />
                  </div>
                ))}
              </div>

              {/* Completion summary */}
              {(() => {
                const filled = storageEntries.filter(e => e.freezer && e.rack && e.box && e.position).length;
                const total  = storageEntries.length;
                const allDone = filled === total && total > 0;
                return (
                  <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg"
                    style={{
                      background: allDone ? "var(--status-pass-bg)" : "var(--bg-card)",
                      border: `1px solid ${allDone ? "var(--status-pass)" : "var(--border)"}`,
                    }}>
                    {allDone
                      ? <CheckCircle2 size={13} style={{ color: "var(--status-pass)" }} />
                      : <MapPin size={13} style={{ color: "var(--text-muted)" }} />}
                    <span style={{ fontSize: 12, fontWeight: 600, color: allDone ? "var(--status-pass)" : "var(--text-secondary)" }}>
                      {filled} / {total} aliquots assigned a storage location
                    </span>
                  </div>
                );
              })()}

              <div className="flex justify-between gap-2 mt-2">
                <Button onClick={() => setWfStep("post")}>← Back</Button>
                <Button
                  type="primary"
                  icon={<ThumbsUp size={13} />}
                  onClick={closeModal}
                >
                  Confirm &amp; Store
                </Button>
              </div>
            </div>
          )}

        </Modal>
      </div>
    </AppLayout>
  );
}
