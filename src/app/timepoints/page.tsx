"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatusTag from "@/components/ui/StatusTag";
import { Select, Button, Table, Modal, Input, InputNumber } from "antd";
import { CheckCircle2, Save, ChevronRight, MapPin, Layers, Trash2 } from "lucide-react";

const { Option } = Select;

const APPROVED_PROJECTS = [
  { id: "SID-2026-001", projectNo: "PRJ-2026-001", name: "METFORMIN BE STUDY",    analytes: "METFORMIN",              periods: 2, matrix: "PLASMA" },
  { id: "SID-2026-003", projectNo: "PRJ-2026-003", name: "COMBO BE STUDY",        analytes: "METFORMIN, SITAGLIPTIN", periods: 2, matrix: "PLASMA" },
  { id: "SID-2025-012", projectNo: "PRJ-2025-012", name: "AMLODIPINE BE",         analytes: "AMLODIPINE",             periods: 2, matrix: "PLASMA" },
];

const SAVED_MAPPINGS = [
  { projectNo: "PRJ-2026-001", name: "METFORMIN BE STUDY", module: "PK MODULE 1", anticoagulant: "K2EDTA", timepoints: 12, status: "approved", savedBy: "T. OKAFOR", savedAt: "17 Apr 2026" },
  { projectNo: "PRJ-2025-012", name: "AMLODIPINE BE",      module: "PK MODULE 1", anticoagulant: "K2EDTA", timepoints: 12, status: "approved", savedBy: "N. SHARMA", savedAt: "10 Jan 2026" },
];

type TPEntry = {
  type: string;
  label: string;
  window: string;
};

function emptyTP(): TPEntry {
  return { type: "", label: "", window: "" };
}

const LABEL_STYLE = { fontSize: 11, fontWeight: 600 as const, color: "var(--text-secondary)", letterSpacing: "0.04em", textTransform: "uppercase" as const, marginBottom: 4 };

export default function TimepointsPage() {
  const [project,   setProject]   = useState<typeof APPROVED_PROJECTS[number] | null>(null);
  const [drugName,  setDrugName]  = useState("");
  const [matrix,    setMatrix]    = useState("");
  const [anticoag,  setAnticoag]  = useState("");
  const [step,      setStep]      = useState<1 | 2 | 3>(1);
  const [tpCount,   setTpCount]   = useState<number | null>(null);
  const [tpData,    setTpData]    = useState<TPEntry[]>([]);
  const [saveOpen,  setSaveOpen]  = useState(false);

  function handleProjectSelect(id: string) {
    const p = APPROVED_PROJECTS.find(p => p.id === id) ?? null;
    setProject(p);
    setStep(2);
    setDrugName("");
    setMatrix("");
    setAnticoag("");
    setTpCount(null);
    setTpData([]);
  }

  function handleOpenTable() {
    if (!drugName.trim() || !matrix || !anticoag) return;
    setStep(3);
    setTpCount(null);
    setTpData([]);
  }

  function handleTpCountChange(count: number) {
    setTpCount(count);
    setTpData(Array.from({ length: count }, emptyTP));
  }

  function updateTp(index: number, field: keyof TPEntry, value: string | number | null) {
    setTpData(prev => prev.map((tp, i) => i === index ? { ...tp, [field]: value } : tp));
  }

  function removeTP(index: number) {
    setTpData(prev => prev.filter((_, i) => i !== index));
    setTpCount(prev => (prev ?? 1) - 1);
  }

  function reset() {
    setProject(null);
    setDrugName("");
    setMatrix("");
    setAnticoag("");
    setStep(1);
    setTpCount(null);
    setTpData([]);
  }

  const allFilled = tpData.length > 0 && tpData.every(
    tp => tp.type && tp.label.trim() && tp.window.trim()
  );

  const savedColumns = [
    { title: "Project No",    dataIndex: "projectNo",      key: "projectNo",      render: (v: string) => <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--accent)", fontSize: 12 }}>{v}</span> },
    { title: "Project Name",  dataIndex: "name",           key: "name",           render: (v: string) => <span style={{ fontWeight: 500, fontSize: 12 }}>{v}</span> },
    { title: "Module",        dataIndex: "module",         key: "module",         render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span> },
    { title: "Anticoagulant", dataIndex: "anticoagulant",  key: "anticoagulant",  render: (v: string) => <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>{v}</span> },
    { title: "Time Points",   dataIndex: "timepoints",     key: "timepoints",     render: (v: number) => <span style={{ fontFamily: "monospace" }}>{v}</span> },
    { title: "Status",        dataIndex: "status",         key: "status",         render: (v: string) => <StatusTag status={v} /> },
    { title: "Saved By",      dataIndex: "savedBy",        key: "savedBy",        render: (v: string) => <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{v}</span> },
    { title: "Date",          dataIndex: "savedAt",        key: "savedAt",        render: (v: string) => <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{v}</span> },
  ];

  return (
    <AppLayout>
      <div className="page-container">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="section-title" style={{ marginBottom: 4 }}>Time Point Mapping</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Map collection time points to approved projects — available after folder request approval
            </p>
          </div>
          {step === 3 && allFilled && (
            <Button type="primary" icon={<Save size={14} />} onClick={() => setSaveOpen(true)}>
              Save Mapping
            </Button>
          )}
        </div>

        {/* Breadcrumb steps */}
        <div className="flex items-center gap-2 mb-6">
          {[
            { n: 1, label: "Select Project" },
            { n: 2, label: "Drug and Anticoagulant" },
            { n: 3, label: "Time Point Schedule" },
          ].map((s, i) => (
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
              {i < 2 && <ChevronRight size={13} style={{ color: "var(--text-muted)" }} />}
            </div>
          ))}
          {step > 1 && (
            <button onClick={reset} className="ml-auto"
              style={{ fontSize: 11, color: "var(--text-muted)", textDecoration: "underline" }}>
              Start over
            </button>
          )}
        </div>

        {/* ── STEP 1: Project selection ── */}
        <div className="rounded-xl p-5 mb-5" style={{ background: "white", border: "1px solid var(--border)" }}>
          <div className="block-label" style={{ marginBottom: 10 }}>
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full mr-2 text-white"
              style={{ background: "var(--accent)", fontSize: 10, fontWeight: 700 }}>1</span>
            Select Approved Project
          </div>
          <Select
            style={{ width: "100%" }}
            placeholder="Choose a project to map time points…"
            onChange={handleProjectSelect}
            value={project?.id}
            size="large"
            disabled={step > 1}
            optionLabelProp="label"
            options={APPROVED_PROJECTS.map(p => ({
              value: p.id,
              label: `${p.projectNo}  ${p.name}`,
              desc: p,
            }))}
            optionRender={(opt) => {
              const p = (opt.data as { desc: typeof APPROVED_PROJECTS[number] }).desc;
              return (
                <>
                  <span style={{ fontFamily: "monospace", color: "var(--accent)", marginRight: 8 }}>{p.projectNo}</span>
                  {p.name}
                </>
              );
            }}
          />

          {project && (
            <div className="grid grid-cols-5 gap-4 mt-5 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
              {[
                { label: "PROJECT NO",   value: project.projectNo },
                { label: "PROJECT NAME", value: project.name },
                { label: "DRUG",         value: project.analytes },
                { label: "MATRIX",       value: project.matrix },
                { label: "PERIODS",      value: String(project.periods) },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 4 }}>
                    {f.label}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: "var(--text-primary)" }}>
                    {f.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── STEP 2: Drug + Matrix + Anticoagulant ── */}
        {step >= 2 && (
          <div className="rounded-xl p-5 mb-5"
            style={{ background: "white", border: `1px solid ${step === 2 ? "var(--accent)" : "var(--border)"}` }}>
            <div className="block-label" style={{ marginBottom: 14 }}>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full mr-2 text-white"
                style={{ background: "var(--accent)", fontSize: 10, fontWeight: 700 }}>2</span>
              Drug and Anticoagulant
            </div>

            <div className="grid grid-cols-3 gap-5">
              <div>
                <div style={LABEL_STYLE}>Drug Name</div>
                <Select
                  size="large"
                  style={{ width: "100%", fontFamily: "monospace", fontWeight: 600 }}
                  placeholder="Select drug"
                  value={drugName || undefined}
                  disabled={step === 3}
                  onChange={(val: string) => { setDrugName(val); setMatrix(""); setAnticoag(""); }}
                  options={(project?.analytes ?? "").split(",").map(d => ({ value: d.trim(), label: d.trim() }))}
                />
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                  Select from project's approved analytes
                </div>
              </div>
              <div>
                <div style={LABEL_STYLE}>Matrix</div>
                <Select
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="Select matrix"
                  value={matrix || undefined}
                  disabled={step === 3 || !drugName}
                  onChange={setMatrix}
                >
                  <Option value="PLASMA">PLASMA</Option>
                  <Option value="SERUM">SERUM</Option>
                  <Option value="WHOLE BLOOD">WHOLE BLOOD</Option>
                  <Option value="URINE">URINE</Option>
                  <Option value="DRIED BLOOD SPOT">DRIED BLOOD SPOT</Option>
                </Select>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                  Matrix may differ per drug
                </div>
              </div>
              <div>
                <div style={LABEL_STYLE}>Anticoagulant</div>
                <Select
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="Select anticoagulant"
                  value={anticoag || undefined}
                  disabled={step === 3 || !matrix}
                  onChange={setAnticoag}
                >
                  <Option value="K2EDTA">K2EDTA</Option>
                  <Option value="K3EDTA">K3EDTA</Option>
                  <Option value="SODIUM HEPARIN">SODIUM HEPARIN</Option>
                  <Option value="LITHIUM HEPARIN">LITHIUM HEPARIN</Option>
                  <Option value="SODIUM CITRATE">SODIUM CITRATE</Option>
                  <Option value="PLAIN (NO ANTICOAGULANT)">PLAIN (NO ANTICOAGULANT)</Option>
                </Select>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                  Tube anticoagulant for all time points
                </div>
              </div>
            </div>

            {step === 2 && (
              <div className="flex justify-end mt-5">
                <Button
                  type="primary"
                  size="large"
                  icon={<Layers size={14} />}
                  disabled={!drugName.trim() || !matrix || !anticoag}
                  onClick={handleOpenTable}
                >
                  Open Time Point Schedule
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="flex items-center gap-3 mt-4 px-4 py-3 rounded-lg"
                style={{ background: "var(--accent-light)", border: "1px solid var(--accent)" }}>
                <CheckCircle2 size={14} style={{ color: "var(--accent)" }} />
                <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>
                  {drugName} · {matrix} · {anticoag}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Time point cards ── */}
        {step === 3 && (
          <div className="rounded-xl p-5 mb-5"
            style={{ background: "white", border: "1px solid var(--accent)" }}>

            {/* Header bar */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white"
                  style={{ background: "var(--accent)", fontSize: 10, fontWeight: 700 }}>3</span>
                <span className="block-label" style={{ margin: 0 }}>Time Point Schedule</span>
                {tpData.length > 0 && (
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>
                    <MapPin size={11} style={{ display: "inline", marginRight: 3 }} />
                    {drugName} · {matrix} · {anticoag}
                  </span>
                )}
              </div>
              {tpData.length > 0 && (
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {tpData.length} time point{tpData.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Count selector */}
            <div className="flex items-center gap-4 mb-6 p-4 rounded-lg"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                How many time points?
              </div>
              <InputNumber
                size="large"
                min={1}
                style={{ width: 120 }}
                placeholder="Enter count"
                value={tpCount ?? undefined}
                onChange={val => val && handleTpCountChange(val)}
              />
              {tpCount && (
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Fill in each time point below
                </span>
              )}
            </div>

            {/* Time point cards */}
            {tpData.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {tpData.map((tp, idx) => (
                  <div key={idx} className="rounded-xl p-4"
                    style={{ border: "1px solid var(--border)", background: "var(--bg-card)", position: "relative" }}>

                    {/* Card header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white"
                          style={{ background: "var(--accent)", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                          Time Point {idx + 1}
                          {tp.label && <span style={{ color: "var(--accent)", marginLeft: 6, fontFamily: "monospace" }}>{tp.label}</span>}
                        </span>
                      </div>
                      <button onClick={() => removeTP(idx)}
                        className="opacity-40 hover:opacity-80 transition-opacity"
                        style={{ color: "var(--status-fail)" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Fields grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <div style={LABEL_STYLE}>Type</div>
                        <Select
                          size="small"
                          style={{ width: "100%" }}
                          placeholder="Select"
                          value={tp.type || undefined}
                          onChange={val => updateTp(idx, "type", val)}
                        >
                          <Option value="PRE-DOSE">PRE-DOSE</Option>
                          <Option value="POST-DOSE">POST-DOSE</Option>
                        </Select>
                      </div>
                      <div>
                        <div style={LABEL_STYLE}>Time Point</div>
                        <Input
                          size="small"
                          placeholder="e.g. 1H"
                          value={tp.label}
                          onChange={e => updateTp(idx, "label", e.target.value.toUpperCase())}
                          style={{ fontFamily: "monospace", fontWeight: 600 }}
                        />
                      </div>
                      <div>
                        <div style={LABEL_STYLE}>Window</div>
                        <Input
                          size="small"
                          placeholder="e.g. ±2 MIN"
                          value={tp.window}
                          onChange={e => updateTp(idx, "window", e.target.value.toUpperCase())}
                          style={{ fontFamily: "monospace" }}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Save button at bottom of cards */}
                <div className="flex justify-end mt-2">
                  <Button
                    type="primary"
                    size="large"
                    icon={<Save size={14} />}
                    disabled={!allFilled}
                    onClick={() => setSaveOpen(true)}
                  >
                    Save Mapping
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Saved mappings */}
        <div className="mt-4">
          <div className="block-label" style={{ marginBottom: 12 }}>Saved Time Point Mappings</div>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "white" }}>
            <Table
              dataSource={SAVED_MAPPINGS}
              columns={savedColumns}
              rowKey="projectNo"
              size="small"
              pagination={false}
            />
          </div>
        </div>

        {/* Save confirmation modal */}
        <Modal
          title={<span style={{ fontFamily: "DM Serif Display, serif", fontSize: 18 }}>Confirm & Save Mapping</span>}
          open={saveOpen}
          onCancel={() => setSaveOpen(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setSaveOpen(false)}>Cancel</Button>
              <Button type="primary" icon={<CheckCircle2 size={13} />} onClick={() => setSaveOpen(false)}>
                Confirm Save
              </Button>
            </div>
          }
          width={440}
        >
          {project && (
            <div style={{ padding: "12px 0" }}>
              <div className="rounded-xl p-4 mb-4" style={{ background: "var(--bg-card)" }}>
                {[
                  { label: "PROJECT NO",    value: project.projectNo },
                  { label: "PROJECT NAME",  value: project.name },
                  { label: "DRUG",          value: drugName },
                  { label: "MATRIX",        value: matrix },
                  { label: "ANTICOAGULANT", value: anticoag },
                  { label: "TIME POINTS",   value: String(tpData.length) },
                ].map((f, i, arr) => (
                  <div key={f.label} className="flex items-center justify-between py-1.5"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <span style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em" }}>{f.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>{f.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
                This mapping will be submitted for Project Leader approval before being used in sample collection.
              </div>
            </div>
          )}
        </Modal>

      </div>
    </AppLayout>
  );
}
