"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatusTag from "@/components/ui/StatusTag";
import {
  Button, Select, Input, InputNumber, Table, Modal,
  Form, Checkbox, Divider, Tag, message, Badge,
} from "antd";
import {
  Printer, ScanLine, TestTube2, Package, FlaskConical,
  ArrowRight, Plus, AlertTriangle, Trash2, Send,
  XCircle, ClipboardList, Eye, ShieldCheck,
} from "lucide-react";

const { Option } = Select;

/* ── Logged-in user (replace with real auth session) ── */
const CURRENT_USER = { name: "A. Liang", role: "Admin" };

type TabKey = "clinical" | "ba" | "approvals";

const ROLE_ACCESS: Record<string, TabKey[]> = {
  "Phlebotomist":         ["clinical"],
  "Clinical Coordinator": ["clinical"],
  "Clinical Analyst":     ["clinical"],
  "Lab Coordinator":      ["clinical", "ba"],
  "Analyst":              ["ba"],
  "Bioanalyst":           ["ba"],
  "Senior Analyst":       ["ba"],
  "Project Leader":       ["clinical", "ba", "approvals"],
  "Admin":                ["clinical", "ba", "approvals"],
  "QA":                   ["clinical", "ba", "approvals"],
  "Manager":              ["clinical", "ba", "approvals"],
};
const userAccess: TabKey[] = ROLE_ACCESS[CURRENT_USER.role] ?? ["clinical", "ba"];

const VERIFIER_ROLES = ["Project Leader", "Admin", "QA", "Manager"];
const canVerify = VERIFIER_ROLES.includes(CURRENT_USER.role);

/* ── Project master data ── */
const PROJECTS = [
  { projectNo: "PRJ-2026-001", name: "Metformin BE Study",    apsNo: "APS-2026-001", analytes: ["MET","MET-D6"],  subjects: ["SUB-001","SUB-002","SUB-003","SUB-004","SUB-005","SUB-006"] },
  { projectNo: "PRJ-2026-002", name: "Atorvastatin PK Study", apsNo: "APS-2026-002", analytes: ["ATV","ATV-OH"], subjects: ["SUB-001","SUB-002","SUB-003"] },
  { projectNo: "PRJ-2025-018", name: "Amlodipine BE Study",   apsNo: "APS-2025-018", analytes: ["AML"],           subjects: ["SUB-001","SUB-002"] },
];

/* ── Predefined BA sample names ── */
const SAMPLE_NAMES = [
  "ST-1","ST-2","ST-3","ST-4","ST-5","ST-6","ST-7","ST-8","ST-9","ST-10",
  "BLK/BLK","BLK",
  "HQC","MQC","MQC-1","MQC-2","LQC","LOQQC",
  "SES","SPC",
  "ULOQ","LLOQ",
  "Other",
];

const PRINTERS = [
  { id: "zd421-clin", name: "Zebra ZD421 — Clinical Lab",       online: true  },
  { id: "zd421-ba",   name: "Zebra ZD421 — Bioanalytical Lab",  online: true  },
  { id: "zd620-rcpt", name: "Zebra ZD620 — Reception",          online: false },
];

type BaItem = {
  key: string; sampleName: string; customName: string; qty: number; lightSensitive: boolean;
};

type ApprovalItem = { sampleName: string; qty: number; lightSensitive: boolean };
type ApprovalRequest = {
  id: string; projectNo: string; projectName: string; apsNo: string;
  items: ApprovalItem[]; remark: string;
  requestedBy: string; requestedAt: string;
  status: "pending" | "verified" | "rejected";
  verifiedBy?: string; verifiedAt?: string;
  rejectedReason?: string;
};

const INIT_APPROVALS: ApprovalRequest[] = [
  {
    id: "REQ-2026-012", projectNo: "PRJ-2026-001", projectName: "Metformin BE Study", apsNo: "APS-2026-001",
    items: [
      { sampleName: "ST-1", qty: 3, lightSensitive: false },
      { sampleName: "ST-2", qty: 3, lightSensitive: false },
      { sampleName: "ST-3", qty: 3, lightSensitive: false },
      { sampleName: "HQC",  qty: 3, lightSensitive: false },
      { sampleName: "LQC",  qty: 3, lightSensitive: false },
      { sampleName: "BLK/BLK", qty: 6, lightSensitive: false },
      { sampleName: "BLK",  qty: 6, lightSensitive: false },
    ],
    remark: "Urgent — batch run scheduled for 14:00.",
    requestedBy: "A. Liang", requestedAt: "Today 10:08", status: "pending",
  },
  {
    id: "REQ-2026-011", projectNo: "PRJ-2026-002", projectName: "Atorvastatin PK Study", apsNo: "APS-2026-002",
    items: [
      { sampleName: "LLOQ", qty: 3, lightSensitive: true },
      { sampleName: "ULOQ", qty: 3, lightSensitive: true },
      { sampleName: "SES",  qty: 2, lightSensitive: false },
    ],
    remark: "Light-sensitive samples — wrap immediately after printing.",
    requestedBy: "R. Patel", requestedAt: "Today 09:45", status: "pending",
  },
  {
    id: "REQ-2026-010", projectNo: "PRJ-2025-018", projectName: "Amlodipine BE Study", apsNo: "APS-2025-018",
    items: [{ sampleName: "MQC", qty: 4, lightSensitive: false }],
    remark: "",
    requestedBy: "A. Liang", requestedAt: "Yesterday 16:30",
    status: "verified", verifiedBy: "A. Liang", verifiedAt: "Yesterday 17:05",
  },
];

type PrintJobItem = { sampleName: string; qty: number; lightSensitive: boolean };
type PrintJob = {
  id: string; section: string; type: string; projectNo: string;
  description: string; qty: number; lightSensitive: boolean;
  requestedBy: string; verifiedBy: string; status: string; created: string;
  items: PrintJobItem[];
};

const INIT_PRINT_QUEUE: PrintJob[] = [
  {
    id: "PQ-2026-055", section: "BA Lab", type: "HQC", projectNo: "PRJ-2026-001",
    description: "HQC × 3", qty: 3, lightSensitive: false,
    requestedBy: "A. Liang", verifiedBy: "A. Liang", status: "verified", created: "Today 10:12",
    items: [{ sampleName: "HQC", qty: 3, lightSensitive: false }],
  },
  {
    id: "PQ-2026-054", section: "BA Lab", type: "ST-1", projectNo: "PRJ-2026-001",
    description: "ST-1 × 5", qty: 5, lightSensitive: true,
    requestedBy: "A. Liang", verifiedBy: "A. Liang", status: "verified", created: "Today 10:08",
    items: [{ sampleName: "ST-1", qty: 5, lightSensitive: true }],
  },
  {
    id: "PQ-2026-053", section: "Clinical", type: "Sample Tube", projectNo: "PRJ-2026-001",
    description: "SUB-001, SUB-002 · P1", qty: 36, lightSensitive: false,
    requestedBy: "Dr. S. Nair", verifiedBy: "Dr. K. Rao", status: "printed", created: "Today 07:55",
    items: [
      { sampleName: "SUB-001", qty: 18, lightSensitive: false },
      { sampleName: "SUB-002", qty: 18, lightSensitive: false },
    ],
  },
  {
    id: "PQ-2026-052", section: "Clinical", type: "Pouch Label", projectNo: "PRJ-2026-001",
    description: "SUB-001–SUB-006 · P1", qty: 6, lightSensitive: false,
    requestedBy: "Dr. S. Nair", verifiedBy: "Dr. K. Rao", status: "printed", created: "Yesterday",
    items: Array.from({ length: 6 }, (_, i) => ({
      sampleName: `SUB-00${i + 1}`, qty: 1, lightSensitive: false,
    })),
  },
  {
    id: "PQ-2026-051", section: "BA Lab", type: "LLOQ", projectNo: "PRJ-2026-001",
    description: "LLOQ × 3", qty: 3, lightSensitive: true,
    requestedBy: "A. Liang", verifiedBy: "A. Liang", status: "printed", created: "Yesterday",
    items: [{ sampleName: "LLOQ", qty: 3, lightSensitive: true }],
  },
];

/* ── Generate serial strings for a sample ── */
function genSerials(sampleName: string, qty: number): string[] {
  return Array.from({ length: qty }, (_, i) =>
    `${sampleName}-${String(i + 1).padStart(3, "0")}`
  );
}

/* ── Label preview ── */
function LabelPreview({
  lines, lightSensitive, verifiedBy,
}: {
  lines: string[];
  lightSensitive?: boolean;
  verifiedBy?: string;
}) {
  const filtered = lines.filter(Boolean);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-col items-center justify-center rounded-lg p-4 w-full"
        style={{ background: "white", border: "2px dashed var(--border)" }}>
        <div className="rounded border px-4 py-3 flex flex-col gap-1"
          style={{ borderColor: "#333", background: "white", minWidth: 180, maxWidth: 220 }}>
          {filtered.map((l, i) => (
            <div key={i} style={{
              fontSize: i === 0 ? 11 : i === 1 ? 13 : 10,
              fontWeight: i <= 1 ? 700 : 400,
              fontFamily: i >= filtered.length - 1 ? "monospace" : "inherit",
              color: "#111",
              borderBottom: i === 1 ? "1px solid #ddd" : "none",
              paddingBottom: i === 1 ? 4 : 0,
              marginTop: i === 2 ? 2 : 0,
              letterSpacing: i === filtered.length - 1 ? "0.12em" : "normal",
            }}>{l}</div>
          ))}
          {verifiedBy && (
            <div style={{
              fontSize: 8, fontWeight: 700, color: "#1565c0",
              borderTop: "1px dashed #90caf9", paddingTop: 3, marginTop: 3,
            }}>
              ✓ Verified By: {verifiedBy}
            </div>
          )}
          <div className="flex gap-px mt-2" style={{ height: 28 }}>
            {Array.from({ length: 36 }, (_, j) => (
              <div key={j} style={{
                width: j % 3 === 0 ? 3 : j % 5 === 0 ? 1 : 2,
                height: "100%",
                background: j % 4 === 0 ? "transparent" : "#111",
                borderRadius: 1,
              }} />
            ))}
          </div>
          <div style={{ fontSize: 8, fontFamily: "monospace", textAlign: "center", color: "#555", marginTop: 2 }}>
            {filtered.at(-1)}
          </div>
        </div>
      </div>
      {lightSensitive && (
        <div className="flex items-center gap-2 w-full rounded-lg px-3 py-2"
          style={{ background: "var(--status-warn-bg)", border: "1px solid var(--status-warn)" }}>
          <AlertTriangle size={13} style={{ color: "var(--status-warn)", flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--status-warn)" }}>Light Sensitive</span>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════ */
export default function LabelCreationPage() {
  const [tab, setTab] = useState<TabKey>(userAccess[0]);

  /* ── Clinical modals ── */
  const [sampleOpen, setSampleOpen] = useState(false);
  const [pouchOpen,  setPouchOpen]  = useState(false);

  /* ── BA Label Request modal ── */
  const [baOpen,       setBaOpen]      = useState(false);
  const [baProjectNo,  setBaProjectNo] = useState("");
  const [baItems,      setBaItems]     = useState<BaItem[]>([]);
  const [baAddMode,    setBaAddMode]   = useState<"single" | "cc">("single");
  const [baAddName,    setBaAddName]   = useState("");
  const [baAddCustom,  setBaAddCustom] = useState("");
  const [baAddQty,     setBaAddQty]    = useState<number>(1);
  const [baAddLS,      setBaAddLS]     = useState(false);
  const [baRemark,     setBaRemark]    = useState("");
  const [baCcCount,    setBaCcCount]   = useState<number>(8);
  const [baCcQty,      setBaCcQty]     = useState<number>(3);

  /* ── Clinical state ── */
  const [study,        setStudy]        = useState("PRJ-2026-001");
  const [analyte,      setAnalyte]      = useState("");
  const [printer,      setPrinter]      = useState("zd421-clin");
  const [subjects,     setSubjects]     = useState<string[]>([]);
  const [period,       setPeriod]       = useState("");
  const [timePoints,   setTimePoints]   = useState<string[]>([]);
  const [tubeReplicas, setTubeReplicas] = useState<number>(2);
  const [pouchSubjects,setPouchSubjects]= useState<string[]>([]);
  const [pouchPeriod,  setPouchPeriod]  = useState("");
  const [tubesPerPouch,setTubesPerPouch]= useState<number | null>(null);

  /* ── BA project auto-fill ── */
  const baProject = PROJECTS.find(p => p.projectNo === baProjectNo);

  /* ── Approvals ── */
  const [approvals,    setApprovals]    = useState<ApprovalRequest[]>(INIT_APPROVALS);
  const [viewReq,      setViewReq]      = useState<ApprovalRequest | null>(null);
  const [rejectOpen,   setRejectOpen]   = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string>("");
  const [rejectReason, setRejectReason] = useState("");

  /* ── Verification modal ── */
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyReq,  setVerifyReq]  = useState<ApprovalRequest | null>(null);

  /* ── Print queue ── */
  const [printQueue, setPrintQueue] = useState<PrintJob[]>(INIT_PRINT_QUEUE);

  /* ── Print selection modal ── */
  const [printOpen,     setPrintOpen]     = useState(false);
  const [printJob,      setPrintJob]      = useState<PrintJob | null>(null);
  const [printSample,   setPrintSample]   = useState<string>("all");
  const [printSelected, setPrintSelected] = useState<Set<string>>(new Set());
  const [isReprint,     setIsReprint]     = useState(false);
  /* range inputs keyed by sampleName */
  const [rangeInputs, setRangeInputs] = useState<Record<string, { from: number; to: number }>>({});

  const pendingCount = approvals.filter(r => r.status === "pending").length;

  /* ── BA helpers ── */
  function openBaModal() {
    setBaProjectNo("");
    setBaItems([]);
    setBaAddMode("single");
    setBaAddName(""); setBaAddCustom(""); setBaAddQty(1); setBaAddLS(false);
    setBaCcCount(8); setBaCcQty(3);
    setBaRemark("");
    setBaOpen(true);
  }

  function addCcSet() {
    const standards = Array.from({ length: baCcCount }, (_, i) => `ST-${i + 1}`);
    const rows: BaItem[] = [
      ...standards.map(name => ({
        key: `${Date.now()}-${name}`, sampleName: name, customName: "", qty: baCcQty, lightSensitive: false,
      })),
      { key: `${Date.now()}-STDB`, sampleName: "BLK/BLK", customName: "", qty: baCcQty * 2, lightSensitive: false },
      { key: `${Date.now()}-STDZ`, sampleName: "BLK",  customName: "", qty: baCcQty * 2, lightSensitive: false },
    ];
    setBaItems(prev => [...prev, ...rows]);
    setBaAddMode("single");
  }

  function addBaRow() {
    if (!baAddName) return;
    if (baAddName === "Other" && !baAddCustom.trim()) return;
    setBaItems(prev => [...prev, {
      key: Date.now().toString(),
      sampleName: baAddName, customName: baAddCustom,
      qty: baAddQty, lightSensitive: baAddLS,
    }]);
    setBaAddName(""); setBaAddCustom(""); setBaAddQty(1); setBaAddLS(false);
  }

  function removeBaRow(key: string) {
    setBaItems(prev => prev.filter(i => i.key !== key));
  }

  function submitBaRequest() {
    const newReq: ApprovalRequest = {
      id: `REQ-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Date.now()).slice(-3)}`,
      projectNo: baProjectNo,
      projectName: baProject?.name ?? "",
      apsNo: baProject?.apsNo ?? "",
      items: baItems.map(i => ({
        sampleName: i.sampleName === "Other" ? i.customName : i.sampleName,
        qty: i.qty,
        lightSensitive: i.lightSensitive,
      })),
      remark: baRemark,
      requestedBy: CURRENT_USER.name,
      requestedAt: `Today ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`,
      status: "pending",
    };
    setApprovals(prev => [newReq, ...prev]);
    message.success(
      `Request submitted to Project Leader for verification (${baItems.length} label type${baItems.length > 1 ? "s" : ""})`
    );
    setBaOpen(false);
  }

  /* ── Verification ── */
  function openVerify(req: ApprovalRequest) {
    setVerifyReq(req);
    setVerifyOpen(true);
  }

  function confirmVerify() {
    if (!verifyReq) return;
    const now = `Today ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
    setApprovals(prev => prev.map(r =>
      r.id === verifyReq.id
        ? { ...r, status: "verified", verifiedBy: CURRENT_USER.name, verifiedAt: now }
        : r
    ));
    if (viewReq?.id === verifyReq.id)
      setViewReq(prev => prev ? { ...prev, status: "verified", verifiedBy: CURRENT_USER.name, verifiedAt: now } : prev);
    /* push new print job */
    const totalQty = verifyReq.items.reduce((s, i) => s + i.qty, 0);
    const newJob: PrintJob = {
      id: `PQ-${String(Date.now()).slice(-6)}`,
      section: "BA Lab",
      type: verifyReq.items.length === 1 ? verifyReq.items[0].sampleName : "Multi-sample",
      projectNo: verifyReq.projectNo,
      description: verifyReq.items.length === 1
        ? `${verifyReq.items[0].sampleName} × ${verifyReq.items[0].qty}`
        : `${verifyReq.items.length} types · ${totalQty} labels`,
      qty: totalQty,
      lightSensitive: verifyReq.items.some(i => i.lightSensitive),
      requestedBy: verifyReq.requestedBy,
      verifiedBy: CURRENT_USER.name,
      status: "verified",
      created: now,
      items: verifyReq.items,
    };
    setPrintQueue(prev => [newJob, ...prev]);
    setVerifyOpen(false);
    setVerifyReq(null);
    message.success("Label request verified — added to print queue.");
  }

  /* ── Reject ── */
  function openReject(id: string) {
    setRejectTarget(id); setRejectReason(""); setRejectOpen(true);
  }

  function confirmReject() {
    setApprovals(prev => prev.map(r =>
      r.id === rejectTarget ? { ...r, status: "rejected", rejectedReason: rejectReason } : r
    ));
    if (viewReq?.id === rejectTarget)
      setViewReq(prev => prev ? { ...prev, status: "rejected", rejectedReason: rejectReason } : prev);
    if (verifyReq?.id === rejectTarget) {
      setVerifyOpen(false);
      setVerifyReq(null);
    }
    setRejectOpen(false);
    message.warning("Request rejected.");
  }

  /* ── Print selection ── */
  function openPrintModal(job: PrintJob, reprint = false) {
    const reprintMode = reprint || job.status === "printed";
    setPrintJob(job);
    setPrintSample("all");
    setIsReprint(reprintMode);
    setRangeInputs(
      Object.fromEntries(job.items.map(i => [i.sampleName, { from: 1, to: i.qty }]))
    );
    if (reprintMode) {
      setPrintSelected(new Set());
    } else {
      const all = new Set<string>();
      job.items.forEach(item => genSerials(item.sampleName, item.qty).forEach(s => all.add(s)));
      setPrintSelected(all);
    }
    setPrintOpen(true);
  }

  function applyRange(sampleName: string, qty: number) {
    const r = rangeInputs[sampleName] ?? { from: 1, to: qty };
    const from = Math.max(1, r.from ?? 1);
    const to   = Math.min(qty, r.to ?? qty);
    const serials = genSerials(sampleName, qty).slice(from - 1, to);
    setPrintSelected(prev => {
      const next = new Set(prev);
      serials.forEach(s => next.add(s));
      return next;
    });
  }

  function confirmPrint() {
    if (!printJob) return;
    setPrintQueue(prev => prev.map(j => j.id === printJob.id ? { ...j, status: "printed" } : j));
    setPrintOpen(false);
    message.success(`Sending ${printSelected.size} label${printSelected.size !== 1 ? "s" : ""} to printer…`);
  }

  /* ── Clinical preview data ── */
  const currentProject = PROJECTS.find(p => p.projectNo === study) ?? PROJECTS[0];

  const tubePreviewLines = [
    study,
    subjects[0] ?? "SUB-001",
    `Period: ${period || "P1"}  |  Pre-dose`,
    `Analyte: ${analyte || (currentProject.analytes[0] ?? "—")}`,
    new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    `${study.replace(/-/g, "")}-${(subjects[0] ?? "SUB001").replace("-", "")}-0h`,
  ];

  const pouchPreviewLines = [
    study,
    pouchSubjects[0] ?? "SUB-001",
    `Period: ${pouchPeriod || "P1"}`,
    `Tubes: ${tubesPerPouch ?? "—"}  |  Store −80°C`,
    `${study.replace(/-/g, "")}-${(pouchSubjects[0] ?? "SUB001").replace("-", "")}-POUCH`,
  ];

  /* ── Print-queue table columns (defined inside to close over openPrintModal) ── */
  const queueCols = [
    { title: "Job ID",   dataIndex: "id",        key: "id",        render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--accent)" }}>{v}</span> },
    { title: "Section",  dataIndex: "section",   key: "section",   render: (v: string) => <Tag style={{ fontSize: 10 }} color={v === "BA Lab" ? "purple" : "blue"}>{v}</Tag> },
    { title: "Sample",   dataIndex: "type",      key: "type",      render: (v: string) => <span style={{ fontSize: 12, fontWeight: 600 }}>{v}</span> },
    { title: "Project",  dataIndex: "projectNo", key: "projectNo", render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 11 }}>{v}</span> },
    { title: "Description", dataIndex: "description", key: "description", render: (v: string) => <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{v}</span> },
    { title: "Qty",      dataIndex: "qty",       key: "qty",       render: (v: number) => <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{v}</span> },
    {
      title: "", dataIndex: "lightSensitive", key: "ls",
      render: (v: boolean) => v ? (
        <span title="Light Sensitive — wrap in foil"
          style={{ fontSize: 10, fontWeight: 700, color: "var(--status-warn)", background: "var(--status-warn-bg)",
            border: "1px solid var(--status-warn)", borderRadius: 4, padding: "1px 5px" }}>
          ⚠ LS
        </span>
      ) : null,
    },
    { title: "Requested By", dataIndex: "requestedBy", key: "requestedBy", render: (v: string) => <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{v}</span> },
    {
      title: "Verified By", dataIndex: "verifiedBy", key: "verifiedBy",
      render: (v: string) => v
        ? <span style={{ fontSize: 11, color: "#1565c0", fontWeight: 600 }}>✓ {v}</span>
        : <span style={{ fontSize: 11, color: "var(--text-muted)" }}>—</span>,
    },
    { title: "Created",  dataIndex: "created",   key: "created",   render: (v: string) => <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{v}</span> },
    { title: "Status",   dataIndex: "status",    key: "status",    render: (v: string) => <StatusTag status={v} /> },
  ];

  /* ── Items visible in print modal for current sample filter ── */
  const printItems = printJob
    ? (printSample === "all" ? printJob.items : printJob.items.filter(i => i.sampleName === printSample))
    : [];

  return (
    <AppLayout>
      <div className="page-container">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <h1 className="section-title">Label Creation</h1>
          <Button icon={<ScanLine size={14} />} style={{ borderColor: "var(--border)" }}>Verify Scan</Button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", width: "fit-content" }}>
          {([
            { key: "clinical"  as TabKey, label: "Clinical Lab",      icon: TestTube2     },
            { key: "ba"        as TabKey, label: "Bioanalytical Lab", icon: FlaskConical  },
            { key: "approvals" as TabKey, label: "Approvals",         icon: ClipboardList },
          ]).filter(t => userAccess.includes(t.key)).map(t => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex items-center gap-2 px-5 py-2 rounded-lg transition-all"
                style={{
                  background: active ? "white" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-muted)",
                  fontWeight: active ? 600 : 400, fontSize: 13,
                  boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  border: active ? "1px solid var(--border)" : "1px solid transparent",
                }}>
                <Icon size={14} style={{ color: active ? "var(--accent)" : undefined }} />
                {t.key === "approvals" && pendingCount > 0
                  ? <Badge count={pendingCount} size="small" offset={[4, -1]}>{t.label}</Badge>
                  : t.label}
              </button>
            );
          })}
        </div>

        {/* ══════════════════ CLINICAL LAB ══════════════════ */}
        {tab === "clinical" && (
          <>
            <div className="block-label mb-3">Clinical Lab — Label Types</div>
            <div className="grid grid-cols-2 gap-5 mb-8" style={{ maxWidth: 680 }}>
              <div className="rounded-xl cursor-pointer transition-all"
                style={{ background: "white", border: "1px solid var(--border)", overflow: "hidden" }}
                onClick={() => setSampleOpen(true)}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}>
                <div className="px-5 py-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "#EAF2FA", color: "#3A6B9B" }}>
                      <TestTube2 size={22} />
                    </div>
                    <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
                  </div>
                  <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 16, marginBottom: 6 }}>Subject Sample Label</div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    Individual tube labels per subject, period and time point with barcode.
                  </div>
                </div>
                <div className="px-5 pb-4 flex flex-wrap gap-1">
                  {["Study ID","Subject","Period","Time Point","Analyte","Date"].map(f => (
                    <span key={f} style={{ fontSize: 10, background: "#EAF2FA", color: "#3A6B9B", padding: "2px 6px", borderRadius: 4 }}>{f}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl cursor-pointer transition-all"
                style={{ background: "white", border: "1px solid var(--border)", overflow: "hidden" }}
                onClick={() => setPouchOpen(true)}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}>
                <div className="px-5 py-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "#EBF0E7", color: "#5C6E4E" }}>
                      <Package size={22} />
                    </div>
                    <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
                  </div>
                  <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 16, marginBottom: 6 }}>Subject / Period Pouch Label</div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    Pouch or bag labels per subject per period for batch transport.
                  </div>
                </div>
                <div className="px-5 pb-4 flex flex-wrap gap-1">
                  {["Study ID","Subject","Period","No. of Tubes","Storage Condition"].map(f => (
                    <span key={f} style={{ fontSize: 10, background: "#EBF0E7", color: "#5C6E4E", padding: "2px 6px", borderRadius: 4 }}>{f}</span>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════ BIOANALYTICAL LAB ══════════════════ */}
        {tab === "ba" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="block-label">Bioanalytical Lab — Label Request</div>
              <Button type="primary" icon={<Plus size={14} />} onClick={() => openBaModal()}>
                New Label Request
              </Button>
            </div>
          </>
        )}

        {/* ══════════════════ APPROVALS ══════════════════ */}
        {tab === "approvals" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="block-label">Label Verification Requests</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  Review and verify label requests submitted by analysts before printing.
                </div>
              </div>
              {pendingCount > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--status-warn)",
                  background: "var(--status-warn-bg)", border: "1px solid var(--status-warn)",
                  borderRadius: 6, padding: "3px 10px" }}>
                  {pendingCount} pending
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3 mb-8">
              {approvals.map(req => (
                <div key={req.id} className="rounded-xl overflow-hidden"
                  style={{ background: "white", border: "1px solid var(--border)" }}>
                  {/* header row */}
                  <div className="flex items-center justify-between px-5 py-3"
                    style={{ borderBottom: "1px solid var(--border)", background: req.status === "pending" ? "white" : "var(--bg-card)" }}>
                    <div className="flex items-center gap-3">
                      <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>{req.id}</span>
                      <Tag style={{ fontSize: 10, margin: 0 }} color="purple">{req.projectNo}</Tag>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{req.projectName}</span>
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--accent)", opacity: 0.7 }}>{req.apsNo}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>By {req.requestedBy} · {req.requestedAt}</span>
                      {req.status === "pending" && (
                        <>
                          <Button size="small" icon={<Eye size={11} />} onClick={() => setViewReq(req)}
                            style={{ fontSize: 11 }}>View</Button>
                          {canVerify && (
                            <>
                              <Button size="small" type="primary" icon={<ShieldCheck size={11} />}
                                style={{ fontSize: 11, background: "#1565c0" }}
                                onClick={() => openVerify(req)}>Verify</Button>
                              <Button size="small" danger icon={<XCircle size={11} />}
                                style={{ fontSize: 11 }}
                                onClick={() => openReject(req.id)}>Reject</Button>
                            </>
                          )}
                        </>
                      )}
                      {req.status !== "pending" && (
                        <Button size="small" icon={<Eye size={11} />} onClick={() => setViewReq(req)}
                          style={{ fontSize: 11 }}>View</Button>
                      )}
                      {req.status === "verified" && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#1565c0",
                          background: "#e3f2fd", border: "1px solid #90caf9",
                          borderRadius: 5, padding: "2px 8px" }}>✓ Verified</span>
                      )}
                      {req.status === "rejected" && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--status-fail)",
                          background: "var(--status-fail-bg)", border: "1px solid var(--status-fail)",
                          borderRadius: 5, padding: "2px 8px" }}>✕ Rejected</span>
                      )}
                    </div>
                  </div>

                  {/* items summary */}
                  <div className="px-5 py-3 flex flex-wrap gap-2 items-center">
                    {req.items.map((item, i) => (
                      <span key={i} style={{
                        fontSize: 11, fontFamily: "monospace", fontWeight: 600,
                        background: "var(--bg-card)", border: "1px solid var(--border)",
                        borderRadius: 5, padding: "2px 8px", color: "var(--text-primary)",
                      }}>
                        {item.sampleName} <span style={{ color: "var(--text-muted)" }}>×{item.qty}</span>
                        {item.lightSensitive && <span style={{ color: "var(--status-warn)", marginLeft: 4 }}>⚠</span>}
                      </span>
                    ))}
                    <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>
                      — {req.items.length} type{req.items.length > 1 ? "s" : ""} · {req.items.reduce((s, i) => s + i.qty, 0)} labels total
                    </span>
                  </div>

                  {req.remark && (
                    <div className="px-5 pb-3">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Remark: </span>
                      <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{req.remark}</span>
                    </div>
                  )}
                  {req.status === "verified" && req.verifiedBy && (
                    <div className="px-5 pb-3">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#1565c0", textTransform: "uppercase", letterSpacing: "0.06em" }}>Verified By: </span>
                      <span style={{ fontSize: 11, color: "#1565c0", fontWeight: 600 }}>{req.verifiedBy}</span>
                      {req.verifiedAt && <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6 }}>· {req.verifiedAt}</span>}
                    </div>
                  )}
                  {req.status === "rejected" && req.rejectedReason && (
                    <div className="px-5 pb-3">
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--status-fail)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Rejection Reason: </span>
                      <span style={{ fontSize: 11, color: "var(--status-fail)" }}>{req.rejectedReason}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Print queue */}
        <div className="block-label mb-3">Print Queue</div>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "white" }}>
          <Table dataSource={printQueue} columns={queueCols} rowKey="id" size="small"
            pagination={{ pageSize: 8, showSizeChanger: false }} />
        </div>


        {/* ════════════════════════════════════════
            BA LAB — Label Request Modal
        ════════════════════════════════════════ */}
        <Modal
          title={<span style={{ fontFamily: "DM Serif Display, serif", fontSize: 18 }}>New Label Request</span>}
          open={baOpen} onCancel={() => setBaOpen(false)} footer={null} width={620}
        >
          <div className="flex flex-col gap-4 mt-4">

            {/* Project selector */}
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <div className="block-label mb-1">Project No <span style={{ color: "var(--status-fail)" }}>*</span></div>
                <Select placeholder="Select project" value={baProjectNo || undefined}
                  onChange={v => setBaProjectNo(v)} style={{ width: "100%" }}>
                  {PROJECTS.map(p => (
                    <Option key={p.projectNo} value={p.projectNo}>
                      <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{p.projectNo}</span>
                    </Option>
                  ))}
                </Select>
              </div>
              <div>
                <div className="block-label mb-1">APS No</div>
                <div className="rounded-lg px-3 py-2"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", fontSize: 12,
                    fontFamily: "monospace", color: baProject ? "var(--accent)" : "var(--text-muted)", height: 32, lineHeight: "16px" }}>
                  {baProject?.apsNo ?? <span style={{ fontStyle: "italic", fontFamily: "inherit", fontSize: 11 }}>Auto-filled</span>}
                </div>
              </div>
            </div>
            {baProject && (
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: -8 }}>{baProject.name}</div>
            )}

            <Divider style={{ margin: "4px 0", borderColor: "var(--border)" }} />

            {/* Items list */}
            {baItems.length > 0 && (
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                      {["#", "Sample Name", "Qty", "LS", ""].map(h => (
                        <th key={h} style={{ padding: "6px 10px", fontSize: 10, fontWeight: 600,
                          color: "var(--text-muted)", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {baItems.map((item, idx) => {
                      const label = item.sampleName === "Other" ? item.customName : item.sampleName;
                      return (
                        <tr key={item.key} style={{ borderBottom: idx < baItems.length - 1 ? "1px solid var(--border)" : "none", background: "white" }}>
                          <td style={{ padding: "7px 10px", fontSize: 11, color: "var(--text-muted)", width: 28 }}>{idx + 1}</td>
                          <td style={{ padding: "7px 10px", fontSize: 12, fontFamily: "monospace", fontWeight: 700 }}>{label}</td>
                          <td style={{ padding: "7px 10px", fontSize: 12, fontFamily: "monospace", fontWeight: 600 }}>{item.qty}</td>
                          <td style={{ padding: "7px 10px", width: 40 }}>
                            {item.lightSensitive && (
                              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--status-warn)",
                                background: "var(--status-warn-bg)", border: "1px solid var(--status-warn)",
                                borderRadius: 4, padding: "1px 5px" }}>LS</span>
                            )}
                          </td>
                          <td style={{ padding: "7px 10px", width: 32, textAlign: "right" }}>
                            <button onClick={() => removeBaRow(item.key)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--status-fail)", padding: 2 }}>
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)" }}>
                      <td colSpan={2} style={{ padding: "6px 10px", fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>
                        Total — {baItems.length} label type{baItems.length > 1 ? "s" : ""}
                      </td>
                      <td style={{ padding: "6px 10px", fontSize: 12, fontFamily: "monospace", fontWeight: 700 }}>
                        {baItems.reduce((s, i) => s + i.qty, 0)}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Add row — mode switcher */}
            <div className="rounded-xl p-3" style={{ background: "var(--bg-card)", border: "1px dashed var(--border)" }}>
              <div className="flex gap-1 mb-3">
                {(["single", "cc"] as const).map(mode => (
                  <button key={mode} onClick={() => setBaAddMode(mode)}
                    style={{
                      fontSize: 11, fontWeight: 600, padding: "3px 12px", borderRadius: 6, cursor: "pointer",
                      background: baAddMode === mode ? "var(--accent)" : "white",
                      color: baAddMode === mode ? "white" : "var(--text-muted)",
                      border: `1px solid ${baAddMode === mode ? "var(--accent)" : "var(--border)"}`,
                    }}>
                    {mode === "single" ? "Single Label" : "CC Set"}
                  </button>
                ))}
              </div>

              {baAddMode === "single" && (
                <div className="flex gap-2 items-end flex-wrap">
                  <div style={{ flex: "1 1 160px" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>Sample Name</div>
                    <Select placeholder="Select" value={baAddName || undefined}
                      onChange={v => { setBaAddName(v); setBaAddCustom(""); }}
                      style={{ width: "100%" }} showSearch optionFilterProp="children">
                      {SAMPLE_NAMES.filter(s => s !== "Other").map(name => (
                        <Option key={name} value={name}>
                          <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{name}</span>
                        </Option>
                      ))}
                      <Option value="Other"><span style={{ color: "var(--text-muted)" }}>+ Other</span></Option>
                    </Select>
                  </div>
                  {baAddName === "Other" && (
                    <div style={{ flex: "1 1 120px" }}>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>Custom Name</div>
                      <Input placeholder="e.g. DILQC-1" value={baAddCustom}
                        onChange={e => setBaAddCustom(e.target.value.toUpperCase())}
                        style={{ fontFamily: "monospace", fontWeight: 600 }} />
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>Qty</div>
                    <InputNumber min={1} max={500} value={baAddQty} onChange={v => setBaAddQty(v ?? 1)} style={{ width: 110 }} addonAfter="labels" />
                  </div>
                  <div style={{ paddingBottom: 2 }}>
                    <Checkbox checked={baAddLS} onChange={e => setBaAddLS(e.target.checked)}>
                      <span style={{ fontSize: 12 }}>Light Sensitive</span>
                    </Checkbox>
                  </div>
                  <Button icon={<Plus size={13} />}
                    disabled={!baAddName || (baAddName === "Other" && !baAddCustom.trim())}
                    onClick={addBaRow}>
                    Add
                  </Button>
                </div>
              )}

              {baAddMode === "cc" && (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3 items-end flex-wrap">
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>No. of Standards</div>
                      <InputNumber min={1} max={10} value={baCcCount} onChange={v => setBaCcCount(v ?? 8)} style={{ width: 120 }} addonAfter="ST" />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>Qty per Standard</div>
                      <InputNumber min={1} max={500} value={baCcQty} onChange={v => setBaCcQty(v ?? 3)} style={{ width: 120 }} addonAfter="labels" />
                    </div>
                    <Button type="primary" icon={<Plus size={13} />} onClick={addCcSet}>
                      Add CC Set
                    </Button>
                  </div>
                  <div className="rounded-lg px-3 py-2" style={{ background: "white", border: "1px solid var(--border)", fontSize: 11 }}>
                    <span style={{ color: "var(--text-muted)" }}>Will add: </span>
                    <span style={{ fontFamily: "monospace", fontWeight: 700 }}>ST-1…ST-{baCcCount}</span>
                    <span style={{ color: "var(--text-muted)" }}> × {baCcQty} each · </span>
                    <span style={{ fontFamily: "monospace", fontWeight: 700 }}>BLK/BLK, BLK</span>
                    <span style={{ color: "var(--text-muted)" }}> × {baCcQty * 2} each</span>
                    <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>
                      = <strong>{baCcCount + 2}</strong> label types · <strong>{baCcCount * baCcQty + baCcQty * 4}</strong> total labels
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Remark */}
            <div>
              <div className="block-label mb-1">Remark / Conditions</div>
              <Input.TextArea
                placeholder="e.g. Use fresh solvent, store at −20°C before printing, urgent batch…"
                value={baRemark}
                onChange={e => setBaRemark(e.target.value)}
                rows={2}
                style={{ fontSize: 12, resize: "none" }}
              />
            </div>

          </div>

          <Divider style={{ borderColor: "var(--border)", margin: "20px 0 16px" }} />
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {baItems.length > 0
                ? `${baItems.length} label type${baItems.length > 1 ? "s" : ""} · ${baItems.reduce((s, i) => s + i.qty, 0)} total labels`
                : "No labels added yet"}
            </span>
            <div className="flex gap-2">
              <Button onClick={() => setBaOpen(false)}>Cancel</Button>
              <Button type="primary" icon={<Send size={13} />}
                disabled={!baProjectNo || baItems.length === 0}
                onClick={submitBaRequest}>
                Send for Verification
              </Button>
            </div>
          </div>
        </Modal>


        {/* ════════════════════════════════════════
            VERIFICATION — Detail Modal (Project Leader)
        ════════════════════════════════════════ */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} style={{ color: "#1565c0" }} />
              <span style={{ fontFamily: "DM Serif Display, serif", fontSize: 18 }}>
                Verify Label Request — {verifyReq?.id}
              </span>
            </div>
          }
          open={verifyOpen} onCancel={() => { setVerifyOpen(false); setVerifyReq(null); }} footer={null} width={760}
        >
          {verifyReq && (
            <div className="flex flex-col gap-4 mt-4">
              {/* project info */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="block-label mb-1">Project No</div>
                  <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: "var(--accent)" }}>{verifyReq.projectNo}</div>
                </div>
                <div>
                  <div className="block-label mb-1">APS No</div>
                  <div style={{ fontFamily: "monospace", fontWeight: 600, fontSize: 12 }}>{verifyReq.apsNo}</div>
                </div>
                <div>
                  <div className="block-label mb-1">Requested By</div>
                  <div style={{ fontSize: 12 }}>{verifyReq.requestedBy} · {verifyReq.requestedAt}</div>
                </div>
                <div className="col-span-3">
                  <div className="block-label mb-1">Project Name</div>
                  <div style={{ fontSize: 12 }}>{verifyReq.projectName}</div>
                </div>
              </div>
              <Divider style={{ margin: "0", borderColor: "var(--border)" }} />

              {/* two-column: items table + label preview */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="block-label mb-2">Label Items</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                        {["#","Sample Name","Qty","LS"].map(h => (
                          <th key={h} style={{ padding: "5px 10px", fontSize: 10, fontWeight: 600,
                            color: "var(--text-muted)", textAlign: "left", textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {verifyReq.items.map((item, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "6px 10px", color: "var(--text-muted)", width: 28 }}>{i + 1}</td>
                          <td style={{ padding: "6px 10px", fontFamily: "monospace", fontWeight: 700 }}>{item.sampleName}</td>
                          <td style={{ padding: "6px 10px", fontFamily: "monospace", fontWeight: 600 }}>{item.qty}</td>
                          <td style={{ padding: "6px 10px" }}>
                            {item.lightSensitive && (
                              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--status-warn)",
                                background: "var(--status-warn-bg)", border: "1px solid var(--status-warn)",
                                borderRadius: 4, padding: "1px 5px" }}>LS</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ background: "var(--bg-card)", borderTop: "2px solid var(--border)" }}>
                        <td colSpan={2} style={{ padding: "6px 10px", fontWeight: 600, fontSize: 11 }}>Total</td>
                        <td style={{ padding: "6px 10px", fontFamily: "monospace", fontWeight: 700 }}>
                          {verifyReq.items.reduce((s, i) => s + i.qty, 0)}
                        </td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                  {verifyReq.remark && (
                    <div className="rounded-lg px-3 py-2 mt-3"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                      <div className="block-label mb-1">Remark</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{verifyReq.remark}</div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="block-label mb-2">Label Preview</div>
                  <LabelPreview
                    lines={[
                      verifyReq.projectNo,
                      verifyReq.items[0]?.sampleName ?? "SAMPLE",
                      `${verifyReq.items[0]?.sampleName ?? ""} × ${verifyReq.items[0]?.qty ?? 0}`,
                      verifyReq.apsNo,
                      new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                      `${verifyReq.projectNo.replace(/-/g, "")}-${verifyReq.items[0]?.sampleName?.replace(/[^A-Z0-9]/gi, "") ?? "SMP"}-001`,
                    ]}
                    lightSensitive={verifyReq.items.some(i => i.lightSensitive)}
                    verifiedBy={CURRENT_USER.name}
                  />
                  <div className="mt-3 rounded-lg px-3 py-2"
                    style={{ background: "#e3f2fd", border: "1px solid #90caf9" }}>
                    <div style={{ fontSize: 11, color: "#1565c0", fontWeight: 600 }}>
                      Your name will appear as "Verified By" on all {verifyReq.items.reduce((s, i) => s + i.qty, 0)} labels in this request.
                    </div>
                  </div>
                </div>
              </div>

              <Divider style={{ margin: "0", borderColor: "var(--border)" }} />
              <div className="flex justify-end gap-2">
                <Button onClick={() => { setVerifyOpen(false); setVerifyReq(null); }}>Close</Button>
                <Button danger icon={<XCircle size={13} />}
                  onClick={() => { setVerifyOpen(false); openReject(verifyReq.id); }}>
                  Reject
                </Button>
                <Button type="primary" icon={<ShieldCheck size={13} />}
                  style={{ background: "#1565c0" }}
                  onClick={confirmVerify}>
                  Confirm Verification
                </Button>
              </div>
            </div>
          )}
        </Modal>


        {/* ════════════════════════════════════════
            APPROVAL — View Detail Modal (read-only)
        ════════════════════════════════════════ */}
        <Modal
          title={<span style={{ fontFamily: "DM Serif Display, serif", fontSize: 18 }}>Request Detail — {viewReq?.id}</span>}
          open={!!viewReq} onCancel={() => setViewReq(null)} footer={null} width={560}
        >
          {viewReq && (
            <div className="flex flex-col gap-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="block-label mb-1">Project No</div>
                  <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: "var(--accent)" }}>{viewReq.projectNo}</div>
                </div>
                <div>
                  <div className="block-label mb-1">APS No</div>
                  <div style={{ fontFamily: "monospace", fontWeight: 600, fontSize: 12 }}>{viewReq.apsNo}</div>
                </div>
                <div className="col-span-2">
                  <div className="block-label mb-1">Project Name</div>
                  <div style={{ fontSize: 12 }}>{viewReq.projectName}</div>
                </div>
              </div>
              <Divider style={{ margin: "0", borderColor: "var(--border)" }} />
              <div>
                <div className="block-label mb-2">Label Items</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                      {["#","Sample Name","Qty","LS"].map(h => (
                        <th key={h} style={{ padding: "5px 10px", fontSize: 10, fontWeight: 600,
                          color: "var(--text-muted)", textAlign: "left", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {viewReq.items.map((item, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "6px 10px", color: "var(--text-muted)", width: 28 }}>{i + 1}</td>
                        <td style={{ padding: "6px 10px", fontFamily: "monospace", fontWeight: 700 }}>{item.sampleName}</td>
                        <td style={{ padding: "6px 10px", fontFamily: "monospace", fontWeight: 600 }}>{item.qty}</td>
                        <td style={{ padding: "6px 10px" }}>
                          {item.lightSensitive && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--status-warn)",
                              background: "var(--status-warn-bg)", border: "1px solid var(--status-warn)",
                              borderRadius: 4, padding: "1px 5px" }}>LS</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: "var(--bg-card)", borderTop: "2px solid var(--border)" }}>
                      <td colSpan={2} style={{ padding: "6px 10px", fontWeight: 600, fontSize: 11 }}>Total</td>
                      <td style={{ padding: "6px 10px", fontFamily: "monospace", fontWeight: 700 }}>
                        {viewReq.items.reduce((s, i) => s + i.qty, 0)}
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
              {viewReq.remark && (
                <div className="rounded-lg px-3 py-2" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  <div className="block-label mb-1">Remark</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{viewReq.remark}</div>
                </div>
              )}
              {viewReq.status === "verified" && viewReq.verifiedBy && (
                <div className="rounded-lg px-3 py-2" style={{ background: "#e3f2fd", border: "1px solid #90caf9" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#1565c0", marginBottom: 2 }}>Verified By</div>
                  <div style={{ fontSize: 12, color: "#1565c0" }}>{viewReq.verifiedBy} · {viewReq.verifiedAt}</div>
                </div>
              )}
              {viewReq.status === "rejected" && viewReq.rejectedReason && (
                <div className="rounded-lg px-3 py-2" style={{ background: "var(--status-fail-bg)", border: "1px solid var(--status-fail)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--status-fail)", marginBottom: 2 }}>Rejection Reason</div>
                  <div style={{ fontSize: 12, color: "var(--status-fail)" }}>{viewReq.rejectedReason}</div>
                </div>
              )}
              {viewReq.status === "pending" && canVerify && (
                <>
                  <Divider style={{ margin: "0", borderColor: "var(--border)" }} />
                  <div className="flex justify-end gap-2">
                    <Button onClick={() => setViewReq(null)}>Close</Button>
                    <Button danger icon={<XCircle size={13} />}
                      onClick={() => { setViewReq(null); openReject(viewReq.id); }}>Reject</Button>
                    <Button type="primary" icon={<ShieldCheck size={13} />}
                      style={{ background: "#1565c0" }}
                      onClick={() => { setViewReq(null); openVerify(viewReq); }}>
                      Verify
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </Modal>


        {/* ════════════════════════════════════════
            APPROVAL — Reject Reason Modal
        ════════════════════════════════════════ */}
        <Modal
          title={<span style={{ fontFamily: "DM Serif Display, serif", fontSize: 18 }}>Reject Request</span>}
          open={rejectOpen} onCancel={() => setRejectOpen(false)} footer={null} width={420}
        >
          <div className="flex flex-col gap-4 mt-4">
            <div>
              <div className="block-label mb-1">Reason for Rejection <span style={{ color: "var(--status-fail)" }}>*</span></div>
              <Input.TextArea
                placeholder="e.g. Incorrect project selected, sample name not recognised, needs re-submission…"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                style={{ fontSize: 12, resize: "none" }}
              />
            </div>
          </div>
          <Divider style={{ borderColor: "var(--border)", margin: "20px 0 16px" }} />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button danger icon={<XCircle size={13} />}
              disabled={!rejectReason.trim()}
              onClick={confirmReject}>
              Confirm Rejection
            </Button>
          </div>
        </Modal>


        {/* ════════════════════════════════════════
            PRINT SELECTION MODAL (Lab Coordinator)
        ════════════════════════════════════════ */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <Printer size={16} style={{ color: "var(--accent)" }} />
              <span style={{ fontFamily: "DM Serif Display, serif", fontSize: 18 }}>
                {isReprint ? "Reprint Labels" : "Print Labels"} — {printJob?.id}
              </span>
            </div>
          }
          open={printOpen} onCancel={() => setPrintOpen(false)} footer={null} width={620}
        >
          {printJob && (
            <div className="flex flex-col gap-4 mt-4">

              {/* job summary */}
              <div className="rounded-lg px-4 py-3 grid grid-cols-3 gap-3"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div>
                  <div className="block-label mb-1">Section</div>
                  <Tag color={printJob.section === "BA Lab" ? "purple" : "blue"}>{printJob.section}</Tag>
                </div>
                <div>
                  <div className="block-label mb-1">Project</div>
                  <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>{printJob.projectNo}</span>
                </div>
                <div>
                  <div className="block-label mb-1">Verified By</div>
                  {printJob.verifiedBy
                    ? <span style={{ fontSize: 11, color: "#1565c0", fontWeight: 600 }}>✓ {printJob.verifiedBy}</span>
                    : <span style={{ fontSize: 11, color: "var(--text-muted)" }}>—</span>}
                </div>
              </div>

              {isReprint && (
                <div className="rounded-lg px-3 py-2"
                  style={{ background: "var(--status-warn-bg)", border: "1px solid var(--status-warn)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--status-warn)" }}>
                    Reprint Mode — select only the labels that need reprinting (e.g. printer malfunction)
                  </div>
                </div>
              )}

              {/* sample name filter */}
              <div>
                <div className="block-label mb-2">Filter by Sample Name</div>
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => setPrintSample("all")}
                    style={{
                      fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 6, cursor: "pointer",
                      background: printSample === "all" ? "var(--accent)" : "white",
                      color: printSample === "all" ? "white" : "var(--text-secondary)",
                      border: `1px solid ${printSample === "all" ? "var(--accent)" : "var(--border)"}`,
                    }}>
                    All Samples
                  </button>
                  {printJob.items.map(item => (
                    <button key={item.sampleName}
                      onClick={() => setPrintSample(item.sampleName)}
                      style={{
                        fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 6,
                        cursor: "pointer", fontFamily: "monospace",
                        background: printSample === item.sampleName ? "var(--accent)" : "white",
                        color: printSample === item.sampleName ? "white" : "var(--text-secondary)",
                        border: `1px solid ${printSample === item.sampleName ? "var(--accent)" : "var(--border)"}`,
                      }}>
                      {item.sampleName}
                    </button>
                  ))}
                </div>
              </div>

              {/* serial number selection per sample */}
              <div className="flex flex-col gap-3" style={{ maxHeight: 380, overflowY: "auto" }}>
                {printItems.map(item => {
                  const serials = genSerials(item.sampleName, item.qty);
                  const allSelected = serials.every(s => printSelected.has(s));
                  const noneSelected = serials.every(s => !printSelected.has(s));
                  const rng = rangeInputs[item.sampleName] ?? { from: 1, to: item.qty };
                  return (
                    <div key={item.sampleName} className="rounded-xl overflow-hidden"
                      style={{ border: "1px solid var(--border)" }}>

                      {/* sample header */}
                      <div className="flex items-center justify-between px-4 py-2"
                        style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                        <div className="flex items-center gap-2">
                          <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13 }}>{item.sampleName}</span>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {serials.filter(s => printSelected.has(s)).length} / {item.qty} selected
                          </span>
                          {item.lightSensitive && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--status-warn)",
                              background: "var(--status-warn-bg)", border: "1px solid var(--status-warn)",
                              borderRadius: 4, padding: "1px 5px" }}>⚠ LS</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}
                            onClick={() => setPrintSelected(prev => {
                              const next = new Set(prev);
                              serials.forEach(s => next.add(s));
                              return next;
                            })}>
                            Select All
                          </button>
                          <button
                            style={{ fontSize: 11, fontWeight: 600, color: "var(--status-fail)", background: "none", border: "none", cursor: "pointer" }}
                            onClick={() => setPrintSelected(prev => {
                              const next = new Set(prev);
                              serials.forEach(s => next.delete(s));
                              return next;
                            })}>
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* range selector row */}
                      <div className="flex items-center gap-2 px-4 py-2"
                        style={{ background: "white", borderBottom: "1px solid var(--border)" }}>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Select range:</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>From</span>
                        <InputNumber
                          size="small"
                          min={1} max={item.qty}
                          value={rng.from}
                          onChange={v => setRangeInputs(prev => ({
                            ...prev,
                            [item.sampleName]: { ...rng, from: v ?? 1 },
                          }))}
                          style={{ width: 70, fontFamily: "monospace" }}
                        />
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>To</span>
                        <InputNumber
                          size="small"
                          min={1} max={item.qty}
                          value={rng.to}
                          onChange={v => setRangeInputs(prev => ({
                            ...prev,
                            [item.sampleName]: { ...rng, to: v ?? item.qty },
                          }))}
                          style={{ width: 70, fontFamily: "monospace" }}
                        />
                        <Button size="small" type="primary"
                          style={{ fontSize: 11 }}
                          onClick={() => applyRange(item.sampleName, item.qty)}>
                          Apply Range
                        </Button>
                        {rng.from <= rng.to && (
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            ({rng.to - rng.from + 1} label{rng.to - rng.from + 1 !== 1 ? "s" : ""})
                          </span>
                        )}
                      </div>

                      {/* compact serial number grid */}
                      <div className="px-4 py-3"
                        style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "6px 4px" }}>
                        {serials.map((serial, idx) => {
                          const checked = printSelected.has(serial);
                          const num = idx + 1;
                          return (
                            <label key={serial}
                              title={serial}
                              style={{
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", userSelect: "none",
                                borderRadius: 5, padding: "3px 2px",
                                background: checked ? "var(--accent)" : "var(--bg-card)",
                                border: `1px solid ${checked ? "var(--accent)" : "var(--border)"}`,
                                fontSize: 11, fontFamily: "monospace", fontWeight: 700,
                                color: checked ? "white" : "var(--text-muted)",
                                transition: "all 0.1s",
                              }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => setPrintSelected(prev => {
                                  const next = new Set(prev);
                                  if (checked) next.delete(serial); else next.add(serial);
                                  return next;
                                })}
                                style={{ display: "none" }}
                              />
                              {String(num).padStart(3, "0")}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Divider style={{ borderColor: "var(--border)", margin: "4px 0" }} />
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {printSelected.size} of {printJob.items.reduce((s, i) => s + i.qty, 0)} label{printJob.items.reduce((s, i) => s + i.qty, 0) !== 1 ? "s" : ""} selected
                </span>
                <div className="flex gap-2">
                  <Button onClick={() => setPrintOpen(false)}>Cancel</Button>
                  <Button type="primary" icon={<Printer size={13} />}
                    disabled={printSelected.size === 0}
                    onClick={confirmPrint}>
                    {isReprint
                      ? `Reprint ${printSelected.size} Label${printSelected.size !== 1 ? "s" : ""}`
                      : `Print ${printSelected.size} Label${printSelected.size !== 1 ? "s" : ""}`}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>


        {/* ════════════════════════════════════════
            CLINICAL — Sample Tube Label Modal
        ════════════════════════════════════════ */}
        <Modal
          title={<span style={{ fontFamily: "DM Serif Display, serif", fontSize: 18 }}>Subject Sample Label</span>}
          open={sampleOpen} onCancel={() => setSampleOpen(false)} footer={null} width={680}
        >
          <div className="grid grid-cols-2 gap-6 mt-4">
            <div className="flex flex-col gap-4">
              <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600 }}>Study</span>} style={{ marginBottom: 0 }}>
                <Select value={study} onChange={setStudy} style={{ width: "100%" }}>
                  {PROJECTS.map(p => <Option key={p.projectNo} value={p.projectNo}>{p.projectNo} — {p.name}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600 }}>Analyte</span>} style={{ marginBottom: 0 }}>
                <Select placeholder="Select analyte" value={analyte || undefined} onChange={setAnalyte} style={{ width: "100%" }}>
                  {currentProject.analytes.map(a => <Option key={a} value={a}>{a}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600 }}>Subject(s)</span>} style={{ marginBottom: 0 }}>
                <Select mode="multiple" placeholder="Select subjects" value={subjects} onChange={setSubjects} style={{ width: "100%" }}>
                  {currentProject.subjects.map(s => <Option key={s} value={s}>{s}</Option>)}
                </Select>
              </Form.Item>
              <div className="grid grid-cols-2 gap-3">
                <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600 }}>Period</span>} style={{ marginBottom: 0 }}>
                  <Select placeholder="Period" value={period || undefined} onChange={setPeriod} style={{ width: "100%" }}>
                    {["P1","P2","P3","P4"].map(p => <Option key={p} value={p}>{p}</Option>)}
                  </Select>
                </Form.Item>
                <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600 }}>Copies / tube</span>} style={{ marginBottom: 0 }}>
                  <InputNumber min={1} max={5} value={tubeReplicas} onChange={v => setTubeReplicas(v ?? 2)} style={{ width: "100%" }} />
                </Form.Item>
              </div>
              <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600 }}>Time Points</span>} style={{ marginBottom: 0 }}>
                <Select mode="multiple" placeholder="Select time points" value={timePoints} onChange={setTimePoints} style={{ width: "100%" }}>
                  {["Pre-dose","0h","0.5h","1h","1.5h","2h","3h","4h","6h","8h","12h","24h","48h"].map(tp => (
                    <Option key={tp} value={tp}>{tp}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600 }}>Printer</span>} style={{ marginBottom: 0 }}>
                <Select value={printer} onChange={setPrinter} style={{ width: "100%" }}>
                  {PRINTERS.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                </Select>
              </Form.Item>
              {subjects.length > 0 && timePoints.length > 0 && (
                <div className="rounded-lg px-3 py-2" style={{ background: "var(--accent-light)", border: "1px solid var(--accent)" }}>
                  <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>
                    Total: {subjects.length} × {timePoints.length} × {tubeReplicas} = {subjects.length * timePoints.length * tubeReplicas} labels
                  </span>
                </div>
              )}
            </div>
            <div>
              <div className="block-label mb-3">Label Preview</div>
              <LabelPreview lines={tubePreviewLines} />
            </div>
          </div>
          <Divider style={{ borderColor: "var(--border)", margin: "20px 0 16px" }} />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setSampleOpen(false)}>Cancel</Button>
            <Button type="primary" icon={<Printer size={13} />} disabled={!subjects.length || !timePoints.length || !period}>
              Add to Print Queue
            </Button>
          </div>
        </Modal>


        {/* ════════════════════════════════════════
            CLINICAL — Pouch Label Modal
        ════════════════════════════════════════ */}
        <Modal
          title={<span style={{ fontFamily: "DM Serif Display, serif", fontSize: 18 }}>Subject / Period Pouch Label</span>}
          open={pouchOpen} onCancel={() => setPouchOpen(false)} footer={null} width={680}
        >
          <div className="grid grid-cols-2 gap-6 mt-4">
            <div className="flex flex-col gap-4">
              <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600 }}>Study</span>} style={{ marginBottom: 0 }}>
                <Select value={study} onChange={setStudy} style={{ width: "100%" }}>
                  {PROJECTS.map(p => <Option key={p.projectNo} value={p.projectNo}>{p.projectNo} — {p.name}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600 }}>Subject(s)</span>} style={{ marginBottom: 0 }}>
                <Select mode="multiple" placeholder="Select subjects" value={pouchSubjects} onChange={setPouchSubjects} style={{ width: "100%" }}>
                  {currentProject.subjects.map(s => <Option key={s} value={s}>{s}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600 }}>Period</span>} style={{ marginBottom: 0 }}>
                <Select placeholder="Select period" value={pouchPeriod || undefined} onChange={setPouchPeriod} style={{ width: "100%" }}>
                  {["P1","P2","P3","P4"].map(p => <Option key={p} value={p}>{p}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600 }}>No. of Tubes per Pouch</span>} style={{ marginBottom: 0 }}>
                <InputNumber min={1} max={50} value={tubesPerPouch ?? undefined} onChange={v => setTubesPerPouch(v)} style={{ width: "100%" }} placeholder="e.g. 18" />
              </Form.Item>
              <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600 }}>Storage Condition</span>} style={{ marginBottom: 0 }}>
                <Select defaultValue="-80" style={{ width: "100%" }}>
                  <Option value="-80">−80°C (Freezer)</Option>
                  <Option value="-20">−20°C (Freezer)</Option>
                  <Option value="rt">Room Temperature</Option>
                </Select>
              </Form.Item>
              <Form.Item label={<span style={{ fontSize: 11, fontWeight: 600 }}>Printer</span>} style={{ marginBottom: 0 }}>
                <Select value={printer} onChange={setPrinter} style={{ width: "100%" }}>
                  {PRINTERS.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                </Select>
              </Form.Item>
              {pouchSubjects.length > 0 && (
                <div className="rounded-lg px-3 py-2" style={{ background: "var(--accent-light)", border: "1px solid var(--accent)" }}>
                  <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>
                    Total pouches: {pouchSubjects.length}
                  </span>
                </div>
              )}
            </div>
            <div>
              <div className="block-label mb-3">Label Preview</div>
              <LabelPreview lines={pouchPreviewLines} />
            </div>
          </div>
          <Divider style={{ borderColor: "var(--border)", margin: "20px 0 16px" }} />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setPouchOpen(false)}>Cancel</Button>
            <Button type="primary" icon={<Printer size={13} />} disabled={!pouchSubjects.length || !pouchPeriod}>
              Add to Print Queue
            </Button>
          </div>
        </Modal>

      </div>
    </AppLayout>
  );
}
