"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatusTag from "@/components/ui/StatusTag";
import { Button, Input, Select, Table, Modal, Form, TimePicker, Tag } from "antd";
import { Plus, Search, ScanLine, AlertTriangle, Clock, CheckCircle2, User, Pipette } from "lucide-react";

const { Option } = Select;

/* ── Vacutainer label lookup ──────────────────────────────────────────────
   Keyed by the anticoagulant code embedded in the tube barcode.
   When the label system is live, this data will be fetched from the label
   service via the scanned barcode — structure intentionally matches what
   the label API will return.
──────────────────────────────────────────────────────────────────────── */
type VacutainerLabel = {
  anticoagulant: string;
  tubeColor:     string;
  colorHex:      string;
  matrix:        string;
  volumeMl:      number;
  additive:      string;
};

const VACUTAINER_LOOKUP: Record<string, VacutainerLabel> = {
  "K2EDTA": { anticoagulant: "K2EDTA",              tubeColor: "Lavender",    colorHex: "#9b72cf", matrix: "PLASMA / WHOLE BLOOD", volumeMl: 3,   additive: "Dipotassium EDTA" },
  "K3EDTA": { anticoagulant: "K3EDTA",              tubeColor: "Lavender",    colorHex: "#9b72cf", matrix: "PLASMA / WHOLE BLOOD", volumeMl: 3,   additive: "Tripotassium EDTA" },
  "LIHEP":  { anticoagulant: "LITHIUM HEPARIN",     tubeColor: "Green",       colorHex: "#4caf6e", matrix: "PLASMA",              volumeMl: 4,   additive: "Lithium Heparin" },
  "NAHEP":  { anticoagulant: "SODIUM HEPARIN",      tubeColor: "Green",       colorHex: "#4caf6e", matrix: "PLASMA",              volumeMl: 4,   additive: "Sodium Heparin" },
  "NACIT":  { anticoagulant: "SODIUM CITRATE",      tubeColor: "Light Blue",  colorHex: "#64b5f6", matrix: "PLASMA",              volumeMl: 2.7, additive: "3.2% Sodium Citrate" },
  "PLAIN":  { anticoagulant: "PLAIN (NO ADDITIVE)", tubeColor: "Red",         colorHex: "#e57373", matrix: "SERUM",               volumeMl: 5,   additive: "None — clot activator" },
  "GEL":    { anticoagulant: "PLAIN (GEL)",         tubeColor: "Gold/Yellow", colorHex: "#ffd54f", matrix: "SERUM",               volumeMl: 5,   additive: "Serum Separator Gel" },
};

/* Simulate parsing a scanned barcode to extract the anticoagulant code.
   Real implementation: call label service API with the raw barcode string. */
function parseBarcodeForVacutainer(barcode: string): VacutainerLabel | null {
  const upper = barcode.toUpperCase();
  const match = Object.keys(VACUTAINER_LOOKUP).find(key => upper.includes(key));
  return match ? VACUTAINER_LOOKUP[match] : null;
}

const SUBJECTS = [
  { id: "SUB-001", name: "Subj 001", period: "P1", timePoint: "0h (Pre-dose)", scheduled: "07:00", collected: "07:02", tubes: 3, analytes: ["MET", "MET-G"], status: "collected", collector: "Dr. S. Nair", deviation: null },
  { id: "SUB-002", name: "Subj 002", period: "P1", timePoint: "0h (Pre-dose)", scheduled: "07:00", collected: "07:04", tubes: 3, analytes: ["MET", "MET-G"], status: "collected", collector: "Dr. S. Nair", deviation: null },
  { id: "SUB-003", name: "Subj 003", period: "P1", timePoint: "0.5h",          scheduled: "07:30", collected: "07:38", tubes: 3, analytes: ["MET", "MET-G"], status: "deviation", collector: "Dr. R. Das",  deviation: "+8 min (limit ±5)" },
  { id: "SUB-004", name: "Subj 004", period: "P1", timePoint: "0.5h",          scheduled: "07:30", collected: null,    tubes: 3, analytes: ["MET", "MET-G"], status: "pending",   collector: "—",          deviation: null },
  { id: "SUB-005", name: "Subj 005", period: "P1", timePoint: "1h",            scheduled: "08:00", collected: null,    tubes: 3, analytes: ["MET", "MET-G"], status: "pending",   collector: "—",          deviation: null },
  { id: "SUB-006", name: "Subj 006", period: "P1", timePoint: "2h",            scheduled: "09:00", collected: null,    tubes: 3, analytes: ["MET", "MET-G"], status: "pending",   collector: "—",          deviation: null },
  { id: "SUB-007", name: "Subj 007", period: "P1", timePoint: "4h",            scheduled: "11:00", collected: null,    tubes: 3, analytes: ["MET", "MET-G"], status: "upcoming",  collector: "—",          deviation: null },
  { id: "SUB-008", name: "Subj 008", period: "P1", timePoint: "4h",            scheduled: "11:00", collected: null,    tubes: 3, analytes: ["MET", "MET-G"], status: "upcoming",  collector: "—",          deviation: null },
];

const STAT_CARDS = [
  { label: "Enrolled",   value: "12", color: "var(--text-secondary)" },
  { label: "Collected",  value: "2",  color: "var(--status-pass)" },
  { label: "Pending",    value: "6",  color: "var(--status-info)" },
  { label: "Deviations", value: "1",  color: "var(--status-warn)" },
  { label: "Upcoming",   value: "4",  color: "var(--text-muted)" },
];

const TIME_POINTS = ["0h (Pre-dose)", "0.5h", "1h", "1.5h", "2h", "3h", "4h", "6h", "8h", "10h", "12h", "24h"];

const LOGGED_IN_USER = { name: "Dr. S. Nair", role: "Phlebotomist" };

const cols = [
  {
    title: "Subject ID", dataIndex: "id", key: "id",
    render: (v: string) => <span style={{ fontFamily: "monospace", fontWeight: 600, fontSize: 13, color: "var(--accent)" }}>{v}</span>
  },
  { title: "Period", dataIndex: "period", key: "period", render: (v: string) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{v}</span> },
  { title: "Time Point", dataIndex: "timePoint", key: "timePoint", render: (v: string) => <span style={{ fontSize: 13 }}>{v}</span> },
  {
    title: "Scheduled", dataIndex: "scheduled", key: "scheduled",
    render: (v: string) => (
      <span className="flex items-center gap-1" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
        <Clock size={11} /> {v}
      </span>
    )
  },
  {
    title: "Collected", dataIndex: "collected", key: "collected",
    render: (v: string | null) => v
      ? <span style={{ fontSize: 12, fontFamily: "monospace" }}>{v}</span>
      : <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
  },
  {
    title: "Analytes", dataIndex: "analytes", key: "analytes",
    render: (v: string[]) => (
      <div className="flex gap-1 flex-wrap">
        {v.map(a => <Tag key={a} style={{ fontSize: 11, padding: "0 6px", margin: 0 }}>{a}</Tag>)}
      </div>
    )
  },
  { title: "Tubes", dataIndex: "tubes", key: "tubes", render: (v: number) => <span style={{ fontSize: 12 }}>{v}</span> },
  {
    title: "Status", dataIndex: "status", key: "status",
    render: (v: string) => <StatusTag status={v} />
  },
  {
    title: "Deviation", dataIndex: "deviation", key: "deviation",
    render: (v: string | null) => v
      ? <span className="flex items-center gap-1" style={{ fontSize: 11, color: "var(--status-warn)", fontWeight: 600 }}>
          <AlertTriangle size={11} /> {v}
        </span>
      : <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
  },
  { title: "Collector", dataIndex: "collector", key: "collector", render: (v: string) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{v}</span> },
  {
    title: "", key: "actions",
    render: (_: unknown, r: typeof SUBJECTS[0]) => (
      <div className="flex gap-1">
        {(r.status === "pending") && (
          <button className="text-xs px-2 py-1 rounded flex items-center gap-1"
            style={{ background: "var(--accent-light)", color: "var(--accent)", fontWeight: 600 }}>
            <ScanLine size={11} /> Scan & Collect
          </button>
        )}
        {r.status === "deviation" && (
          <button className="text-xs px-2 py-1 rounded" style={{ background: "var(--status-warn-bg)", color: "var(--status-warn)", fontWeight: 600 }}>
            Log Deviation
          </button>
        )}
      </div>
    )
  },
];

export default function CollectionPage() {
  const [scanOpen,     setScanOpen]     = useState(false);
  const [search,       setSearch]       = useState("");
  const [endTime,      setEndTime]      = useState<string | null>(null);
  const [barcode,      setBarcode]      = useState("");
  const [vacLabel,     setVacLabel]     = useState<VacutainerLabel | null>(null);

  function handleBarcodeChange(value: string) {
    setBarcode(value);
    setVacLabel(parseBarcodeForVacutainer(value));
  }

  function openScanModal() {
    setBarcode("");
    setVacLabel(null);
    setEndTime(null);
    setScanOpen(true);
  }

  function handleRecordCollection() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    setEndTime(`${hh}:${mm}:${ss}`);
    setTimeout(() => { setScanOpen(false); setEndTime(null); }, 1200);
  }

  const filtered = SUBJECTS.filter(s =>
    s.id.toLowerCase().includes(search.toLowerCase()) ||
    s.timePoint.toLowerCase().includes(search.toLowerCase()) ||
    s.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="page-container">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="section-title">Sample Collection</h1>
            <p className="section-subtitle">
              SID-2026-001 — Metformin BE · Period 1 · 18 Apr 2026 · 12 subjects enrolled
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              icon={<ScanLine size={14} />}
              type="primary"
              onClick={openScanModal}
            >
              Scan & Collect
            </Button>
          </div>
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

        {/* Live deviation alert */}
        <div className="flex items-center gap-3 rounded-lg px-4 py-3 mb-5"
          style={{ background: "var(--status-warn-bg)", border: "1px solid #e8c97c" }}>
          <AlertTriangle size={14} style={{ color: "var(--status-warn)", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "var(--status-warn)", fontWeight: 500 }}>
            Time-point deviation detected: SUB-003 — 0.5h collection was 8 minutes late (limit ±5 min). Log deviation before CPMA transfer.
          </span>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <Input
            prefix={<Search size={13} style={{ color: "var(--text-muted)" }} />}
            placeholder="Search by subject ID, time point or status…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 340 }}
          />
          <Select placeholder="Time Point" style={{ width: 160 }} allowClear>
            {TIME_POINTS.map(tp => <Option key={tp} value={tp}>{tp}</Option>)}
          </Select>
          <Select placeholder="Status" style={{ width: 140 }} allowClear>
            <Option value="collected">Collected</Option>
            <Option value="pending">Pending</Option>
            <Option value="deviation">Deviation</Option>
            <Option value="upcoming">Upcoming</Option>
          </Select>
          <Select placeholder="Period" style={{ width: 110 }} allowClear>
            <Option value="P1">Period 1</Option>
            <Option value="P2">Period 2</Option>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "white" }}>
          <Table
            dataSource={filtered}
            columns={cols}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 12, showSizeChanger: false }}
            rowClassName={(r) => r.status === "deviation" ? "row-deviation" : r.status === "upcoming" ? "row-muted" : ""}
          />
        </div>

        {/* Scan & Collect Modal */}
        <Modal
          title={<span style={{ fontFamily: "DM Serif Display, serif", fontSize: 18 }}>Scan & Collect Sample</span>}
          open={scanOpen}
          onCancel={() => { setScanOpen(false); setBarcode(""); setVacLabel(null); setEndTime(null); }}
          footer={null}
          width={520}
        >
          <Form layout="vertical" style={{ marginTop: 16 }}>

            {/* Vacutainer barcode scan */}
            <div className="rounded-lg p-4 mb-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="block-label mb-2">Scan Vacutainer Barcode</div>
              <Input
                prefix={<ScanLine size={14} style={{ color: "var(--accent)" }} />}
                placeholder="Scan Vacutainer label barcode…"
                size="large"
                value={barcode}
                onChange={e => handleBarcodeChange(e.target.value)}
                style={{ fontFamily: "monospace", fontSize: 14 }}
                autoFocus
              />
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 5 }}>
                Anticoagulant, matrix and tube details are auto-fetched from the Vacutainer label on scan
              </div>
            </div>

            {/* Vacutainer label details — shown after scan */}
            {vacLabel ? (
              <div className="rounded-lg p-4 mb-4" style={{ border: "1px solid var(--status-pass)", background: "var(--status-pass-bg)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={13} style={{ color: "var(--status-pass)" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--status-pass)" }}>
                    Vacutainer label detected — details auto-populated
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Anticoagulant</div>
                    <div className="flex items-center gap-1.5">
                      <Pipette size={12} style={{ color: "var(--accent)" }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{vacLabel.anticoagulant}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Tube Color</div>
                    <div className="flex items-center gap-1.5">
                      <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: vacLabel.colorHex, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{vacLabel.tubeColor}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Volume</div>
                    <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace", color: "var(--text-primary)" }}>{vacLabel.volumeMl} mL</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Matrix</div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>{vacLabel.matrix}</span>
                  </div>
                  <div style={{ gridColumn: "2 / -1" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Additive</div>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{vacLabel.additive}</span>
                  </div>
                </div>
              </div>
            ) : barcode.length > 3 ? (
              <div className="rounded-lg px-4 py-3 mb-4 flex items-center gap-2"
                style={{ border: "1px solid var(--status-warn)", background: "var(--status-warn-bg)" }}>
                <AlertTriangle size={13} style={{ color: "var(--status-warn)" }} />
                <span style={{ fontSize: 12, color: "var(--status-warn)", fontWeight: 500 }}>
                  Label not recognised — label design pending. Anticoagulant details will auto-populate once label system is configured.
                </span>
              </div>
            ) : (
              <div className="rounded-lg px-4 py-3 mb-4 flex items-center gap-2"
                style={{ border: "1px dashed var(--border)", background: "var(--bg-card)" }}>
                <Pipette size={13} style={{ color: "var(--text-muted)" }} />
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Anticoagulant · Tube color · Matrix · Volume — fetched automatically on scan
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-4">
              <Form.Item label="Subject ID" required>
                <Select placeholder="Auto-populated from scan">
                  {SUBJECTS.map(s => <Option key={s.id} value={s.id}>{s.id}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item label="Time Point" required>
                <Select placeholder="Auto-populated from scan">
                  {TIME_POINTS.map(tp => <Option key={tp} value={tp}>{tp}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item label="Actual Collection Time" required>
                <TimePicker format="HH:mm" style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="Collector (Phlebotomist)">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", height: 32 }}>
                  <User size={13} style={{ color: "var(--accent)" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    {LOGGED_IN_USER.name}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>
                    · {LOGGED_IN_USER.role}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>
                  Auto-assigned from your login session
                </div>
              </Form.Item>
              <Form.Item label="No. of Tubes Collected" required>
                <Input type="number" placeholder="e.g. 3" />
              </Form.Item>
              <Form.Item label="Collection End Time">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background: endTime ? "var(--status-pass-bg)" : "var(--bg-card)", border: `1px solid ${endTime ? "var(--status-pass)" : "var(--border)"}`, height: 32, transition: "all 0.2s" }}>
                  <Clock size={13} style={{ color: endTime ? "var(--status-pass)" : "var(--text-muted)" }} />
                  <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: endTime ? "var(--status-pass)" : "var(--text-muted)" }}>
                    {endTime ?? "Auto-captured on submit"}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>
                  Timestamp recorded at the moment of submission
                </div>
              </Form.Item>
            </div>

            <Form.Item label="Remarks / Deviation Notes">
              <Input.TextArea rows={2} placeholder="If time point exceeded ±5 min window, note reason here…" />
            </Form.Item>

            <div className="flex justify-end gap-2">
              <Button onClick={() => { setScanOpen(false); setEndTime(null); }}>Cancel</Button>
              <Button type="primary" icon={<CheckCircle2 size={13} />} onClick={handleRecordCollection}>
                Record Collection
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
}
