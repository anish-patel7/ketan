"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatusTag from "@/components/ui/StatusTag";
import {
  Button, Input, InputNumber, Select, Table, Modal, Form,
  Tag, Divider, message, AutoComplete, Switch,
} from "antd";
import { Plus, Search, CheckCircle2, FileText, Edit2, Eye, Trash2, Printer } from "lucide-react";

const { Option } = Select;

/* ── domain types ── */
type CCConcentration = { level: string; conc: string };
type QCSample        = { id: string; name: string; conc: string };

type StabilityParams = {
  benchTopTemp:         string;
  benchTopDuration:     string;
  freezeThawCycles:     number | null;
  freezeThawTemp:       string;
  longTermTemp:         string;
  longTermDuration:     string;
  ltsStabilityDrug:     string;
  ltsStabilityFortified:string;
  stockSolDuration:     string;
  inProcessTemp:        string;
  inProcessDuration:    string;
  isrRequired:          boolean;
};

type ApsDetails = {
  dose:                 string;
  lloqConc:             string;
  uloqConc:             string;
  ccLevels:             number | null;
  ccConcentrations:     CCConcentration[];
  qcSamples:            QCSample[];
  matrix:               string;
  anticoagulant:        string;
  dosingDetails:        string;
  numSubjects:          number | null;
  numPeriods:           number | null;
  numTimePoints:        number | null;
  subjectsPerRun:       number | null;
  runsPerSubject:       number | null;
  extBatchSize:         number | null;
  approxIsrSamples:     number | null;
  sopList:              string[];
  stability:            StabilityParams;
  remarks:              string;
  studyDirectorName:    string;
  studyDirectorDate:    string;
  studyDirectorApproved:boolean;
};

/* ── dropdown option lists ── */
const CONC_OPTIONS = [
  "0.100","0.200","0.500","1.00","2.00","5.00","10.00",
  "20.00","50.00","100.00","200.00","500.00","1000.00",
].map(v => ({ value: v }));

const TEMP_OPTIONS = ["RT","25°C","37°C","4°C","-20°C","-40°C","-60°C","-80°C"].map(v => ({ value: v }));

const DUR_OPTIONS = [
  "1 h","2 h","4 h","6 h","8 h","12 h","24 h","48 h",
  "7 days","14 days","30 days","60 days","90 days","6 months","12 months",
].map(v => ({ value: v }));

const PRESET_QC_NAMES = [
  "HQC","MQC","LQC","LLOQ QC",
  "Surrogate Matrix QC","Formulation QC","Dilution QC","ISR QC",
];

const DEFAULT_QC_IDS = ["hqc","mqc","lqc","lloqqc"];

const EMPTY_STABILITY: StabilityParams = {
  benchTopTemp: "", benchTopDuration: "",
  freezeThawCycles: null, freezeThawTemp: "",
  longTermTemp: "", longTermDuration: "",
  ltsStabilityDrug: "", ltsStabilityFortified: "",
  stockSolDuration: "",
  inProcessTemp: "", inProcessDuration: "",
  isrRequired: false,
};

const DEFAULT_QC: QCSample[] = [
  { id: "hqc",    name: "HQC",     conc: "" },
  { id: "mqc",    name: "MQC",     conc: "" },
  { id: "lqc",    name: "LQC",     conc: "" },
  { id: "lloqqc", name: "LLOQ QC", conc: "" },
];

const EMPTY_DETAILS: ApsDetails = {
  dose: "", lloqConc: "", uloqConc: "", ccLevels: null, ccConcentrations: [],
  qcSamples: DEFAULT_QC.map(q => ({ ...q })),
  matrix: "", anticoagulant: "",
  dosingDetails: "", numSubjects: null, numPeriods: null,
  numTimePoints: null, subjectsPerRun: null, runsPerSubject: null,
  extBatchSize: null, approxIsrSamples: null,
  sopList: [],
  stability: { ...EMPTY_STABILITY },
  remarks: "",
  studyDirectorName: "", studyDirectorDate: "", studyDirectorApproved: false,
};

/* ── project type ── */
type Project = {
  id: string; study: string; molecule: string; analyte: string;
  aps: string; template: string;
  subFolder: string; stockWeighing: string; bms: string; bulkSpike: string; distSheet: string;
  created: string;
  apsDetails: ApsDetails | null;
};

const INIT_PROJECTS: Project[] = [
  {
    id: "PRJ-2026-001-MET", study: "SID-2026-001", molecule: "Metformin", analyte: "MET",
    aps: "APS042.02", template: "T-018",
    subFolder: "approved", stockWeighing: "approved", bms: "approved", bulkSpike: "approved", distSheet: "pending",
    created: "2026-04-15",
    apsDetails: {
      dose: "500 mg single oral dose",
      lloqConc: "1.00", uloqConc: "200.00", ccLevels: 8,
      ccConcentrations: [
        { level: "CS1", conc: "1.00"   },
        { level: "CS2", conc: "2.00"   },
        { level: "CS3", conc: "5.00"   },
        { level: "CS4", conc: "10.00"  },
        { level: "CS5", conc: "20.00"  },
        { level: "CS6", conc: "50.00"  },
        { level: "CS7", conc: "100.00" },
        { level: "CS8", conc: "200.00" },
      ],
      qcSamples: [
        { id: "hqc",    name: "HQC",     conc: "150.00" },
        { id: "mqc",    name: "MQC",     conc: "50.00"  },
        { id: "lqc",    name: "LQC",     conc: "3.00"   },
        { id: "lloqqc", name: "LLOQ QC", conc: "1.00"   },
      ],
      matrix: "Human Plasma", anticoagulant: "K2-EDTA",
      dosingDetails: "Single oral dose, 500 mg tablet",
      numSubjects: 12, numPeriods: 2, numTimePoints: 13,
      subjectsPerRun: 6, runsPerSubject: 1, extBatchSize: 6, approxIsrSamples: 20,
      sopList: ["SOP-BA-001 v3.0", "SOP-BA-007 v2.1", "SOP-BA-012 v1.0"],
      stability: {
        benchTopTemp: "RT",   benchTopDuration: "6 h",
        freezeThawCycles: 3,  freezeThawTemp: "-20°C",
        longTermTemp: "-20°C", longTermDuration: "30 days",
        ltsStabilityDrug: "6 months",
        ltsStabilityFortified: "3 months",
        stockSolDuration: "30 days",
        inProcessTemp: "RT",  inProcessDuration: "4 h",
        isrRequired: false,
      },
      remarks: "",
      studyDirectorName: "Dr. S. Mehta",
      studyDirectorDate: "2026-04-20",
      studyDirectorApproved: true,
    },
  },
  {
    id: "PRJ-2026-001-METG", study: "SID-2026-001", molecule: "Metformin", analyte: "MET-G",
    aps: "APS043.01", template: "T-019",
    subFolder: "approved", stockWeighing: "approved", bms: "pending", bulkSpike: "pending", distSheet: "pending",
    created: "2026-04-15", apsDetails: null,
  },
  {
    id: "PRJ-2026-002-AML", study: "SID-2026-002", molecule: "Amlodipine", analyte: "AML",
    aps: "APS017.03", template: "T-009",
    subFolder: "approved", stockWeighing: "pending", bms: "pending", bulkSpike: "pending", distSheet: "pending",
    created: "2026-04-17", apsDetails: null,
  },
  {
    id: "PRJ-2026-003-ATR", study: "SID-2026-003", molecule: "Atorvastatin", analyte: "ATR",
    aps: "APS031.02", template: "T-014",
    subFolder: "pending", stockWeighing: "pending", bms: "pending", bulkSpike: "pending", distSheet: "pending",
    created: "2026-04-18", apsDetails: null,
  },
];

type StepKey = "subFolder" | "stockWeighing" | "bms" | "bulkSpike" | "distSheet";
const STEP_COLS: { key: StepKey; label: string }[] = [
  { key: "subFolder",    label: "Sub-Folder"    },
  { key: "stockWeighing",label: "Stock Weighing"},
  { key: "bms",          label: "BMS"           },
  { key: "bulkSpike",    label: "Bulk Spike"    },
  { key: "distSheet",    label: "Dist. Sheet"   },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4,
        textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      {children}
    </div>
  );
}

function concFilter(input: string, option?: { value?: string }) {
  return (option?.value ?? "").includes(input);
}
function labelFilter(input: string, option?: { value?: string }) {
  return (option?.value ?? "").toLowerCase().includes(input.toLowerCase());
}

/* ── Print helper ── */
function printStudyPlan(project: Project, d: ApsDetails) {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;

  const row = (label: string, value: string) =>
    `<tr><td class="lbl">${label}</td><td class="val">${value || "—"}</td></tr>`;

  const approvalBadge = d.studyDirectorApproved
    ? `<span style="background:#e8f5e9;color:#2e7d32;padding:2px 10px;border-radius:4px;font-weight:700;font-size:11px;">APPROVED</span>`
    : `<span style="background:#fff8e1;color:#f57f17;padding:2px 10px;border-radius:4px;font-weight:700;font-size:11px;">PENDING</span>`;

  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Study Plan — ${project.id}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1C1B18; padding: 32px; }
  h1  { font-size: 22px; margin-bottom: 2px; font-weight: 700; }
  .meta { font-size: 11px; color: #6B6560; margin-bottom: 24px; }
  h2  { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
        color: #5C6E4E; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin: 20px 0 10px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  td   { padding: 5px 8px; border: 1px solid #E0DBD3; vertical-align: top; }
  td.lbl { width: 38%; font-weight: 600; color: #6B6560; background: #FAF9F6; font-size: 11px; }
  td.val { font-size: 12px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; }
  .badge { display:inline-block; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:700; }
  .sop-list { list-style: none; }
  .sop-list li { padding: 4px 0; border-bottom: 1px solid #f0ede7; font-size: 12px; }
  .sop-list li:last-child { border-bottom: none; }
  .approval-box { border: 1px solid #E0DBD3; border-radius: 6px; padding: 12px 16px; margin-top: 4px; }
  @media print {
    body { padding: 16px; }
    @page { margin: 16mm; }
  }
</style></head><body>
<h1>Study Plan</h1>
<div class="meta">
  Project: <strong>${project.id}</strong> &nbsp;·&nbsp;
  Study: <strong>${project.study}</strong> &nbsp;·&nbsp;
  Molecule: <strong>${project.molecule}</strong> &nbsp;·&nbsp;
  APS: <strong>${project.aps}</strong> &nbsp;·&nbsp;
  Printed: ${new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}
</div>

<h2>Study Parameters</h2>
<div class="two-col">
<table>
  ${row("Dose", d.dose)}
  ${row("No. of Subjects", d.numSubjects?.toString() ?? "")}
  ${row("Periods per Subject", d.numPeriods?.toString() ?? "")}
  ${row("No. of Time Points", d.numTimePoints?.toString() ?? "")}
  ${row("Subjects per Run", d.subjectsPerRun?.toString() ?? "")}
  ${row("Runs per Subject", d.runsPerSubject?.toString() ?? "")}
</table>
<table>
  ${row("Extended Batch Size", d.extBatchSize?.toString() ?? "")}
  ${row("Approx Samples for ISR", d.approxIsrSamples?.toString() ?? "")}
  ${row("ISR Required", d.stability.isrRequired ? "Yes" : "No")}
  ${row("Matrix", d.matrix)}
  ${row("Anticoagulant", d.anticoagulant)}
  ${row("Dosing Details", d.dosingDetails)}
</table>
</div>

<h2>Calibration Range &amp; QC</h2>
<div class="two-col">
<table>
  ${row("LLOQ Concentration (ng/mL)", d.lloqConc)}
  ${row("ULOQ Concentration (ng/mL)", d.uloqConc)}
  ${row("No. of CC Levels", d.ccLevels?.toString() ?? "")}
  ${d.ccConcentrations.map(c => row(c.level, `${c.conc} ng/mL`)).join("")}
</table>
<table>
  ${d.qcSamples.map(q => row(`${q.name} (ng/mL)`, q.conc)).join("")}
</table>
</div>

<h2>Stability Parameters</h2>
<div class="two-col">
<table>
  ${row("Bench-top Temp.", d.stability.benchTopTemp)}
  ${row("Bench-top Duration", d.stability.benchTopDuration)}
  ${row("Freeze-thaw Cycles", d.stability.freezeThawCycles?.toString() ?? "")}
  ${row("Freeze-thaw Temp.", d.stability.freezeThawTemp)}
  ${row("Long-term Temp.", d.stability.longTermTemp)}
  ${row("Long-term Duration", d.stability.longTermDuration)}
</table>
<table>
  ${row("LTS Stability — Drug", d.stability.ltsStabilityDrug)}
  ${row("LTS Stability — Fortified", d.stability.ltsStabilityFortified)}
  ${row("Stock Solution Stability", d.stability.stockSolDuration)}
  ${row("In-process Temp.", d.stability.inProcessTemp)}
  ${row("In-process Duration", d.stability.inProcessDuration)}
</table>
</div>

<h2>SOP Follow List</h2>
${d.sopList.length
  ? `<ul class="sop-list">${d.sopList.map(s => `<li>• ${s}</li>`).join("")}</ul>`
  : "<p style='color:#9B9590;font-size:12px;'>No SOPs listed</p>"}

${d.remarks ? `<h2>Remarks</h2><p style="font-size:12px;line-height:1.6;">${d.remarks}</p>` : ""}

<h2>Study Director Approval</h2>
<div class="approval-box">
  <table>
    ${row("Study Director", d.studyDirectorName)}
    ${row("Approval Date", d.studyDirectorDate)}
    ${row("Status", approvalBadge)}
  </table>
</div>

</body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 400);
}

export default function BASetupPage() {
  const [projects, setProjects] = useState<Project[]>(INIT_PROJECTS);
  const [search,   setSearch]   = useState("");

  /* create modal */
  const [createOpen, setCreateOpen] = useState(false);
  const [cStudy,    setCStudy]    = useState("");
  const [cAnalyte,  setCAnalyte]  = useState("");
  const [cMolecule, setCMolecule] = useState("");
  const [cApsNo,    setCApsNo]    = useState("");
  const [cApsVer,   setCApsVer]   = useState("");
  const [cTemplate, setCTemplate] = useState("");

  /* Study Plan modal */
  const [detailsOpen,     setDetailsOpen]     = useState(false);
  const [detailsProject,  setDetailsProject]  = useState<Project | null>(null);
  const [detailsForm,     setDetailsForm]     = useState<ApsDetails>(EMPTY_DETAILS);
  const [detailsReadOnly, setDetailsReadOnly] = useState(false);

  /* add-QC mini form */
  const [newQcName, setNewQcName] = useState("");
  const [newQcConc, setNewQcConc] = useState("");

  /* add-SOP mini form */
  const [newSopEntry, setNewSopEntry] = useState("");

  const filtered = projects.filter(p =>
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.molecule.toLowerCase().includes(search.toLowerCase()) ||
    p.study.toLowerCase().includes(search.toLowerCase())
  );

  /* ── create helpers ── */
  function resetCreate() {
    setCStudy(""); setCAnalyte(""); setCMolecule("");
    setCApsNo(""); setCApsVer(""); setCTemplate("");
  }
  function canCreate() {
    return cStudy && cAnalyte.trim() && cMolecule.trim() && cApsNo.trim() && cApsVer.trim() && cTemplate.trim();
  }
  function handleCreate() {
    const analyte = cAnalyte.trim().toUpperCase();
    const id = `PRJ-${new Date().getFullYear()}-${String(projects.length + 1).padStart(3, "0")}-${analyte}`;
    const aps = `${cApsNo.trim().toUpperCase()}.${cApsVer.trim().padStart(2, "0")}`;
    const newProject: Project = {
      id, study: cStudy, molecule: cMolecule.trim(), analyte,
      aps, template: cTemplate.trim().toUpperCase(),
      subFolder: "approved", stockWeighing: "pending", bms: "pending", bulkSpike: "pending", distSheet: "pending",
      created: new Date().toISOString().slice(0, 10),
      apsDetails: null,
    };
    setProjects(prev => [newProject, ...prev]);
    message.success(`Project folder ${id} created successfully.`);
    resetCreate();
    setCreateOpen(false);
  }

  /* ── Study Plan helpers ── */
  function openDetails(project: Project, readOnly = false) {
    setDetailsProject(project);
    setDetailsForm(project.apsDetails ?? { ...EMPTY_DETAILS, qcSamples: DEFAULT_QC.map(q => ({ ...q })) });
    setDetailsReadOnly(readOnly);
    setNewQcName("");
    setNewQcConc("");
    setNewSopEntry("");
    setDetailsOpen(true);
  }

  function saveDetails() {
    if (!detailsProject) return;
    setProjects(prev => prev.map(p =>
      p.id === detailsProject.id ? { ...p, apsDetails: { ...detailsForm } } : p
    ));
    setDetailsOpen(false);
    message.success("Study plan saved.");
  }

  function df<K extends keyof ApsDetails>(key: K, val: ApsDetails[K]) {
    setDetailsForm(prev => ({ ...prev, [key]: val }));
  }

  function ds<K extends keyof StabilityParams>(key: K, val: StabilityParams[K]) {
    setDetailsForm(prev => ({ ...prev, stability: { ...prev.stability, [key]: val } }));
  }

  function handleCCLevelsChange(v: number | null) {
    setDetailsForm(prev => {
      if (!v || v <= 0) return { ...prev, ccLevels: v };
      const existing = prev.ccConcentrations;
      const newConcs: CCConcentration[] = Array.from({ length: v }, (_, i) => ({
        level: `CS${i + 1}`,
        conc: existing[i]?.conc ?? "",
      }));
      return { ...prev, ccLevels: v, ccConcentrations: newConcs };
    });
  }

  function updateCCConc(idx: number, conc: string) {
    setDetailsForm(prev => {
      const updated = [...prev.ccConcentrations];
      updated[idx] = { ...updated[idx], conc };
      return { ...prev, ccConcentrations: updated };
    });
  }

  function updateQcConc(id: string, conc: string) {
    setDetailsForm(prev => ({
      ...prev,
      qcSamples: prev.qcSamples.map(q => q.id === id ? { ...q, conc } : q),
    }));
  }

  function removeQcSample(id: string) {
    setDetailsForm(prev => ({
      ...prev,
      qcSamples: prev.qcSamples.filter(q => q.id !== id),
    }));
  }

  function addQcSample() {
    if (!newQcName.trim()) return;
    const id = `custom-${Date.now()}`;
    setDetailsForm(prev => ({
      ...prev,
      qcSamples: [...prev.qcSamples, { id, name: newQcName.trim(), conc: newQcConc.trim() }],
    }));
    setNewQcName("");
    setNewQcConc("");
  }

  function addSop() {
    if (!newSopEntry.trim()) return;
    setDetailsForm(prev => ({ ...prev, sopList: [...prev.sopList, newSopEntry.trim()] }));
    setNewSopEntry("");
  }

  function removeSop(idx: number) {
    setDetailsForm(prev => ({ ...prev, sopList: prev.sopList.filter((_, i) => i !== idx) }));
  }

  /* ── CC concentrations table columns ── */
  const ccCols = [
    {
      title: "Level", dataIndex: "level", key: "level", width: 72,
      render: (v: string) => (
        <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{v}</span>
      ),
    },
    {
      title: "Concentration (ng/mL)", dataIndex: "conc", key: "conc",
      render: (v: string, _: CCConcentration, idx: number) =>
        detailsReadOnly ? (
          <span style={{ fontFamily: "monospace", fontSize: 12 }}>{v || "—"}</span>
        ) : (
          <AutoComplete
            value={v}
            options={CONC_OPTIONS}
            onChange={val => updateCCConc(idx, val)}
            placeholder="e.g. 1.00"
            style={{ width: "100%", fontFamily: "monospace" }}
            filterOption={concFilter}
          />
        ),
    },
  ];

  /* ── QC samples table columns ── */
  const qcCols = [
    {
      title: "QC Sample Name", dataIndex: "name", key: "name",
      render: (v: string) => <span style={{ fontSize: 12, fontWeight: 600 }}>{v}</span>,
    },
    {
      title: "Concentration (ng/mL)", dataIndex: "conc", key: "conc",
      render: (v: string, r: QCSample) =>
        detailsReadOnly ? (
          <span style={{ fontFamily: "monospace", fontSize: 12 }}>{v || "—"}</span>
        ) : (
          <AutoComplete
            value={v}
            options={CONC_OPTIONS}
            onChange={val => updateQcConc(r.id, val)}
            placeholder="e.g. 0.00"
            style={{ width: "100%", fontFamily: "monospace" }}
            filterOption={concFilter}
          />
        ),
    },
    ...(!detailsReadOnly ? [{
      title: "", key: "del", width: 36,
      render: (_: unknown, r: QCSample) =>
        !DEFAULT_QC_IDS.includes(r.id) ? (
          <button onClick={() => removeQcSample(r.id)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 2 }}>
            <Trash2 size={13} />
          </button>
        ) : null,
    }] : []),
  ];

  /* ── main table columns ── */
  const cols = [
    {
      title: "Project ID", dataIndex: "id", key: "id",
      render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>{v}</span>,
    },
    { title: "Study",    dataIndex: "study",    key: "study",    render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span> },
    { title: "Molecule", dataIndex: "molecule", key: "molecule", render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span> },
    { title: "Analyte",  dataIndex: "analyte",  key: "analyte",  render: (v: string) => <Tag style={{ fontSize: 11 }}>{v}</Tag> },
    {
      title: "APS", dataIndex: "aps", key: "aps",
      render: (v: string, r: Project) => (
        <div>
          <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600 }}>{v}</span>
          <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 6 }}>Tpl: {r.template}</span>
        </div>
      ),
    },
    ...STEP_COLS.map(sc => ({
      title: sc.label, dataIndex: sc.key, key: sc.key,
      render: (v: string) => <StatusTag status={v} />,
    })),
    { title: "Created", dataIndex: "created", key: "created",
      render: (v: string) => <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{v}</span> },
    {
      title: "Study Plan", key: "apsDetails",
      render: (_: unknown, r: Project) => r.apsDetails ? (
        <button onClick={() => openDetails(r, true)} className="flex items-center gap-1"
          style={{ fontSize: 11, fontWeight: 600, color: "#2e7d32", background: "#e8f5e9",
            border: "1px solid #81c784", borderRadius: 5, padding: "2px 8px", cursor: "pointer" }}>
          <Eye size={11} /> View
        </button>
      ) : (
        <button onClick={() => openDetails(r, false)} className="flex items-center gap-1"
          style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", background: "var(--accent-light)",
            border: "1px solid var(--accent)", borderRadius: 5, padding: "2px 8px", cursor: "pointer" }}>
          <Plus size={11} /> Add Details
        </button>
      ),
    },
    {
      title: "", key: "edit",
      render: (_: unknown, r: Project) => r.apsDetails ? (
        <button onClick={() => openDetails(r, false)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2 }}>
          <Edit2 size={13} />
        </button>
      ) : null,
    },
  ];

  return (
    <AppLayout>
      <div className="page-container">
        <div className="flex items-start justify-between mb-6">
          <h1 className="section-title">Project Creation</h1>
          <Button type="primary" icon={<Plus size={14} />} onClick={() => { resetCreate(); setCreateOpen(true); }}>
            New Project Folder
          </Button>
        </div>

        <div className="flex gap-3 mb-4">
          <Input
            prefix={<Search size={13} style={{ color: "var(--text-muted)" }} />}
            placeholder="Search by project ID, molecule or study…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 340 }}
          />
        </div>

        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "white" }}>
          <Table dataSource={filtered} columns={cols} rowKey="id" size="small"
            pagination={{ pageSize: 10, showSizeChanger: false }} />
        </div>


        {/* ════ CREATE PROJECT FOLDER MODAL ════ */}
        <Modal
          title={<span style={{ fontFamily: "DM Serif Display, serif", fontSize: 18 }}>Create Project Folder</span>}
          open={createOpen} onCancel={() => setCreateOpen(false)} footer={null} width={560}
        >
          <Form layout="vertical" style={{ marginTop: 16 }}>
            <div className="grid grid-cols-2 gap-x-4">
              <Form.Item label="Study" required style={{ gridColumn: "span 2" }}>
                <Select placeholder="Select active study" value={cStudy || undefined} onChange={setCStudy}>
                  <Option value="SID-2026-001">SID-2026-001 — Metformin BE</Option>
                  <Option value="SID-2026-002">SID-2026-002 — Amlodipine BE</Option>
                  <Option value="SID-2026-003">SID-2026-003 — Atorvastatin BE</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Analyte Code" required>
                <Input placeholder="e.g. MET, AML, ATR"
                  value={cAnalyte} onChange={e => setCAnalyte(e.target.value.toUpperCase())} />
              </Form.Item>
              <Form.Item label="Molecule / Drug Name" required>
                <Input placeholder="e.g. Metformin HCl"
                  value={cMolecule} onChange={e => setCMolecule(e.target.value)} />
              </Form.Item>
              <Form.Item label="APS Number" required>
                <Input placeholder="e.g. APS042" style={{ fontFamily: "monospace" }}
                  value={cApsNo} onChange={e => setCApsNo(e.target.value)} />
              </Form.Item>
              <Form.Item label="APS Version" required>
                <Input placeholder="e.g. 02" style={{ fontFamily: "monospace" }}
                  value={cApsVer} onChange={e => setCApsVer(e.target.value)} />
              </Form.Item>
              <Form.Item label="Template Number" required style={{ gridColumn: "span 2" }}>
                <Input placeholder="e.g. T-018 (from APS)" style={{ fontFamily: "monospace" }}
                  value={cTemplate} onChange={e => setCTemplate(e.target.value)} />
              </Form.Item>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="primary" icon={<CheckCircle2 size={13} />}
                disabled={!canCreate()} onClick={handleCreate}>
                Create Sub-Folder
              </Button>
            </div>
          </Form>
        </Modal>


        {/* ════ STUDY PLAN MODAL ════ */}
        <Modal
          title={
            <div>
              <span style={{ fontFamily: "DM Serif Display, serif", fontSize: 18 }}>
                Study Plan — {detailsProject?.id}
              </span>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, fontFamily: "inherit" }}>
                {detailsProject?.molecule} · {detailsProject?.aps}
              </div>
            </div>
          }
          open={detailsOpen}
          onCancel={() => setDetailsOpen(false)}
          footer={null}
          width={800}
        >
          <div style={{ maxHeight: "74vh", overflowY: "auto", paddingRight: 4 }}>
            <div className="flex flex-col gap-5 mt-4">

              {/* ── Study Parameters ── */}
              <div>
                <div className="block-label mb-3">Study Parameters</div>
                <div className="grid grid-cols-3 gap-3">
                  <div style={{ gridColumn: "span 3" }}>
                    <Field label="Dose">
                      <Input value={detailsForm.dose} disabled={detailsReadOnly}
                        onChange={e => df("dose", e.target.value)}
                        placeholder="e.g. 500 mg single oral dose" />
                    </Field>
                  </div>
                  <Field label="No. of Subjects">
                    <InputNumber value={detailsForm.numSubjects} disabled={detailsReadOnly}
                      onChange={v => df("numSubjects", v)} min={1} style={{ width: "100%" }} />
                  </Field>
                  <Field label="No. of Periods">
                    <InputNumber value={detailsForm.numPeriods} disabled={detailsReadOnly}
                      onChange={v => df("numPeriods", v)} min={1} style={{ width: "100%" }} />
                  </Field>
                  <Field label="No. of Time Points">
                    <InputNumber value={detailsForm.numTimePoints} disabled={detailsReadOnly}
                      onChange={v => df("numTimePoints", v)} min={1} style={{ width: "100%" }} />
                  </Field>
                  <Field label="Subjects per Run">
                    <InputNumber value={detailsForm.subjectsPerRun} disabled={detailsReadOnly}
                      onChange={v => df("subjectsPerRun", v)} min={1} style={{ width: "100%" }} />
                  </Field>
                  <Field label="Runs per Subject">
                    <InputNumber value={detailsForm.runsPerSubject} disabled={detailsReadOnly}
                      onChange={v => df("runsPerSubject", v)} min={1} style={{ width: "100%" }} />
                  </Field>
                  <Field label="Extended Batch Size">
                    <InputNumber value={detailsForm.extBatchSize} disabled={detailsReadOnly}
                      onChange={v => df("extBatchSize", v)} min={1} style={{ width: "100%" }} />
                  </Field>
                  <Field label="Approx. Samples for ISR">
                    <InputNumber value={detailsForm.approxIsrSamples} disabled={detailsReadOnly}
                      onChange={v => df("approxIsrSamples", v)} min={0} style={{ width: "100%" }} />
                  </Field>
                  <div style={{ gridColumn: "span 3" }}>
                    <Field label="Dosing Details">
                      <Input value={detailsForm.dosingDetails} disabled={detailsReadOnly}
                        onChange={e => df("dosingDetails", e.target.value)}
                        placeholder="e.g. Single oral dose, 500 mg tablet" />
                    </Field>
                  </div>
                </div>
              </div>

              <Divider style={{ margin: "0", borderColor: "var(--border)" }} />

              {/* ── Calibration Curve ── */}
              <div>
                <div className="block-label mb-3">Calibration Curve (CC) Configuration</div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <Field label="LLOQ Concentration (ng/mL)">
                    <AutoComplete value={detailsForm.lloqConc} disabled={detailsReadOnly}
                      options={CONC_OPTIONS} onChange={v => df("lloqConc", v)}
                      placeholder="e.g. 1.00" filterOption={concFilter}
                      style={{ width: "100%", fontFamily: "monospace" }} />
                  </Field>
                  <Field label="ULOQ Concentration (ng/mL)">
                    <AutoComplete value={detailsForm.uloqConc} disabled={detailsReadOnly}
                      options={CONC_OPTIONS} onChange={v => df("uloqConc", v)}
                      placeholder="e.g. 200.00" filterOption={concFilter}
                      style={{ width: "100%", fontFamily: "monospace" }} />
                  </Field>
                  <Field label="No. of CC Levels">
                    <InputNumber value={detailsForm.ccLevels} disabled={detailsReadOnly}
                      onChange={handleCCLevelsChange} min={1} max={12} style={{ width: "100%" }} />
                  </Field>
                </div>

                {detailsForm.ccConcentrations.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)",
                      textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                      CC Concentrations (ng/mL)
                    </div>
                    <Table
                      dataSource={detailsForm.ccConcentrations}
                      columns={ccCols}
                      rowKey="level"
                      size="small"
                      pagination={false}
                      style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}
                    />
                  </div>
                )}
              </div>

              <Divider style={{ margin: "0", borderColor: "var(--border)" }} />

              {/* ── QC Set ── */}
              <div>
                <div className="block-label mb-3">QC Set Concentrations (ng/mL)</div>
                <Table
                  dataSource={detailsForm.qcSamples}
                  columns={qcCols}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", marginBottom: 10 }}
                />

                {!detailsReadOnly && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <AutoComplete
                      value={newQcName}
                      options={PRESET_QC_NAMES.map(n => ({ value: n }))}
                      onChange={setNewQcName}
                      placeholder="Select or type QC name…"
                      filterOption={labelFilter}
                      style={{ flex: 1 }}
                    />
                    <AutoComplete
                      value={newQcConc}
                      options={CONC_OPTIONS}
                      onChange={setNewQcConc}
                      placeholder="Conc. (ng/mL)"
                      filterOption={concFilter}
                      style={{ width: 160, fontFamily: "monospace" }}
                    />
                    <Button type="dashed" icon={<Plus size={13} />}
                      disabled={!newQcName.trim()} onClick={addQcSample}>
                      Add QC
                    </Button>
                  </div>
                )}
              </div>

              <Divider style={{ margin: "0", borderColor: "var(--border)" }} />

              {/* ── Matrix & Anticoagulant ── */}
              <div>
                <div className="block-label mb-3">Matrix &amp; Anticoagulant</div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Matrix Name">
                    <Input value={detailsForm.matrix} disabled={detailsReadOnly}
                      onChange={e => df("matrix", e.target.value)}
                      placeholder="e.g. Human Plasma, Human Urine" />
                  </Field>
                  <Field label="Anticoagulant">
                    <Input value={detailsForm.anticoagulant} disabled={detailsReadOnly}
                      onChange={e => df("anticoagulant", e.target.value)}
                      placeholder="e.g. K2-EDTA, Heparin, Citrate" />
                  </Field>
                </div>
              </div>

              <Divider style={{ margin: "0", borderColor: "var(--border)" }} />

              {/* ── Stability Parameters ── */}
              <div>
                <div className="block-label mb-3">Stability Parameters</div>
                <div className="grid grid-cols-3 gap-3">

                  <Field label="Bench-top Temp.">
                    <AutoComplete value={detailsForm.stability.benchTopTemp} disabled={detailsReadOnly}
                      options={TEMP_OPTIONS} onChange={v => ds("benchTopTemp", v)}
                      placeholder="e.g. RT" filterOption={labelFilter} style={{ width: "100%" }} />
                  </Field>
                  <Field label="Bench-top Duration">
                    <AutoComplete value={detailsForm.stability.benchTopDuration} disabled={detailsReadOnly}
                      options={DUR_OPTIONS} onChange={v => ds("benchTopDuration", v)}
                      placeholder="e.g. 6 h" filterOption={labelFilter} style={{ width: "100%" }} />
                  </Field>
                  <div />

                  <Field label="Freeze-thaw Cycles">
                    <InputNumber value={detailsForm.stability.freezeThawCycles} disabled={detailsReadOnly}
                      onChange={v => ds("freezeThawCycles", v)} min={1} max={10} style={{ width: "100%" }} />
                  </Field>
                  <Field label="Freeze-thaw Temp.">
                    <AutoComplete value={detailsForm.stability.freezeThawTemp} disabled={detailsReadOnly}
                      options={TEMP_OPTIONS} onChange={v => ds("freezeThawTemp", v)}
                      placeholder="e.g. -20°C" filterOption={labelFilter} style={{ width: "100%" }} />
                  </Field>
                  <div />

                  <Field label="Long-term Temp.">
                    <AutoComplete value={detailsForm.stability.longTermTemp} disabled={detailsReadOnly}
                      options={TEMP_OPTIONS} onChange={v => ds("longTermTemp", v)}
                      placeholder="e.g. -20°C" filterOption={labelFilter} style={{ width: "100%" }} />
                  </Field>
                  <Field label="Long-term Duration">
                    <AutoComplete value={detailsForm.stability.longTermDuration} disabled={detailsReadOnly}
                      options={DUR_OPTIONS} onChange={v => ds("longTermDuration", v)}
                      placeholder="e.g. 30 days" filterOption={labelFilter} style={{ width: "100%" }} />
                  </Field>
                  <div />

                  <Field label="LTS Stability — Drug">
                    <AutoComplete value={detailsForm.stability.ltsStabilityDrug} disabled={detailsReadOnly}
                      options={DUR_OPTIONS} onChange={v => ds("ltsStabilityDrug", v)}
                      placeholder="e.g. 6 months" filterOption={labelFilter} style={{ width: "100%" }} />
                  </Field>
                  <Field label="LTS Stability — Fortified">
                    <AutoComplete value={detailsForm.stability.ltsStabilityFortified} disabled={detailsReadOnly}
                      options={DUR_OPTIONS} onChange={v => ds("ltsStabilityFortified", v)}
                      placeholder="e.g. 3 months" filterOption={labelFilter} style={{ width: "100%" }} />
                  </Field>
                  <div />

                  <Field label="Stock Solution Stability">
                    <AutoComplete value={detailsForm.stability.stockSolDuration} disabled={detailsReadOnly}
                      options={DUR_OPTIONS} onChange={v => ds("stockSolDuration", v)}
                      placeholder="e.g. 30 days" filterOption={labelFilter} style={{ width: "100%" }} />
                  </Field>
                  <Field label="In-process Temp.">
                    <AutoComplete value={detailsForm.stability.inProcessTemp} disabled={detailsReadOnly}
                      options={TEMP_OPTIONS} onChange={v => ds("inProcessTemp", v)}
                      placeholder="e.g. RT" filterOption={labelFilter} style={{ width: "100%" }} />
                  </Field>
                  <Field label="In-process Duration">
                    <AutoComplete value={detailsForm.stability.inProcessDuration} disabled={detailsReadOnly}
                      options={DUR_OPTIONS} onChange={v => ds("inProcessDuration", v)}
                      placeholder="e.g. 4 h" filterOption={labelFilter} style={{ width: "100%" }} />
                  </Field>

                  <div style={{ gridColumn: "span 3" }}>
                    <Field label="ISR Required">
                      <div style={{ display: "flex", alignItems: "center", gap: 8, height: 32 }}>
                        <Switch
                          checked={detailsForm.stability.isrRequired}
                          disabled={detailsReadOnly}
                          onChange={v => ds("isrRequired", v)}
                          size="small"
                        />
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {detailsForm.stability.isrRequired
                            ? "Yes — Incurred Sample Reanalysis required"
                            : "No"}
                        </span>
                      </div>
                    </Field>
                  </div>
                </div>
              </div>

              <Divider style={{ margin: "0", borderColor: "var(--border)" }} />

              {/* ── SOP Follow List ── */}
              <div>
                <div className="block-label mb-3">SOP Follow List</div>
                {detailsForm.sopList.length > 0 ? (
                  <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
                    {detailsForm.sopList.map((sop, idx) => (
                      <div key={idx} className="flex items-center justify-between"
                        style={{
                          padding: "8px 12px",
                          borderBottom: idx < detailsForm.sopList.length - 1 ? "1px solid var(--border)" : "none",
                          background: idx % 2 === 0 ? "white" : "var(--bg-page)",
                        }}>
                        <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--text-primary)" }}>{sop}</span>
                        {!detailsReadOnly && (
                          <button onClick={() => removeSop(idx)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 2 }}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10,
                    padding: "12px", border: "1px dashed var(--border)", borderRadius: 8, textAlign: "center" }}>
                    No SOPs added yet
                  </div>
                )}
                {!detailsReadOnly && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <Input
                      value={newSopEntry}
                      onChange={e => setNewSopEntry(e.target.value)}
                      onPressEnter={addSop}
                      placeholder="e.g. SOP-BA-001 v3.0"
                      style={{ fontFamily: "monospace" }}
                    />
                    <Button type="dashed" icon={<Plus size={13} />}
                      disabled={!newSopEntry.trim()} onClick={addSop}>
                      Add SOP
                    </Button>
                  </div>
                )}
              </div>

              <Divider style={{ margin: "0", borderColor: "var(--border)" }} />

              {/* ── Remarks ── */}
              <div>
                <div className="block-label mb-3">Remarks</div>
                <Input.TextArea
                  value={detailsForm.remarks}
                  disabled={detailsReadOnly}
                  onChange={e => df("remarks", e.target.value)}
                  rows={3}
                  placeholder="Any special requirements, observations, or additional notes…"
                />
              </div>

              <Divider style={{ margin: "0", borderColor: "var(--border)" }} />

              {/* ── Study Director Approval ── */}
              <div>
                <div className="block-label mb-3">Study Director Approval</div>
                <div style={{
                  border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px",
                  background: detailsForm.studyDirectorApproved ? "var(--status-pass-bg)" : "var(--bg-page)",
                }}>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Study Director Name">
                      <Input value={detailsForm.studyDirectorName} disabled={detailsReadOnly}
                        onChange={e => df("studyDirectorName", e.target.value)}
                        placeholder="e.g. Dr. S. Mehta" />
                    </Field>
                    <Field label="Approval Date">
                      {detailsReadOnly ? (
                        <div style={{ height: 32, display: "flex", alignItems: "center",
                          fontSize: 13, color: "var(--text-primary)", fontFamily: "monospace" }}>
                          {detailsForm.studyDirectorDate || "—"}
                        </div>
                      ) : (
                        <Input
                          value={detailsForm.studyDirectorDate}
                          onChange={e => df("studyDirectorDate", e.target.value)}
                          placeholder="YYYY-MM-DD"
                          style={{ fontFamily: "monospace" }}
                        />
                      )}
                    </Field>
                    <Field label="Approval Status">
                      <div style={{ display: "flex", alignItems: "center", gap: 8, height: 32 }}>
                        <Switch
                          checked={detailsForm.studyDirectorApproved}
                          disabled={detailsReadOnly}
                          onChange={v => df("studyDirectorApproved", v)}
                          size="small"
                        />
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 4,
                          background: detailsForm.studyDirectorApproved ? "var(--status-pass-bg)" : "var(--status-warn-bg)",
                          color: detailsForm.studyDirectorApproved ? "var(--status-pass)" : "var(--status-warn)",
                          border: `1px solid ${detailsForm.studyDirectorApproved ? "var(--status-pass)" : "var(--status-warn)"}`,
                        }}>
                          {detailsForm.studyDirectorApproved ? "APPROVED" : "PENDING"}
                        </span>
                      </div>
                    </Field>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <Divider style={{ borderColor: "var(--border)", margin: "20px 0 16px" }} />
          <div className="flex justify-between items-center">
            {/* Print button — always visible when details exist */}
            <Button
              icon={<Printer size={13} />}
              onClick={() => detailsProject && printStudyPlan(detailsProject, detailsForm)}
              style={{ color: "var(--text-secondary)" }}
            >
              Print Study Plan
            </Button>
            <div className="flex gap-2">
              {detailsReadOnly ? (
                <>
                  <Button onClick={() => setDetailsOpen(false)}>Close</Button>
                  <Button type="primary" icon={<Edit2 size={13} />}
                    onClick={() => setDetailsReadOnly(false)}>
                    Edit Details
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setDetailsOpen(false)}>Cancel</Button>
                  <Button type="primary" icon={<FileText size={13} />} onClick={saveDetails}>
                    Save Study Plan
                  </Button>
                </>
              )}
            </div>
          </div>
        </Modal>

      </div>
    </AppLayout>
  );
}
