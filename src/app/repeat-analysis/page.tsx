"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Input, Select, Table } from "antd";
import { Repeat, CheckCircle2, Clock, AlertTriangle, FlaskConical, ListChecks, Search, Plus } from "lucide-react";

const { Option } = Select;

const KPI_CARDS = [
  { label: "Open Repeat Requests",        value: "2",       sub: "1 pending re-prep · 1 queued for injection", icon: Repeat,       color: "var(--status-info)" },
  { label: "Repeats Completed This Week", value: "6",       sub: "5 confirmed · 1 discordant",                  icon: CheckCircle2, color: "var(--status-pass)" },
  { label: "Avg Turnaround",              value: "1.3 days", sub: "request to repeat result",                   icon: Clock,        color: "var(--accent)" },
  { label: "Discordant — Needs Review",   value: "1",       sub: "RPT-2026-003-008 exceeds ±20%",          icon: AlertTriangle, color: "var(--status-fail)" },
];

type RepeatReason = "Above ULOQ" | "IS Response Failure" | "Carryover Suspected" | "Chromatography Issue" | "Instrument Malfunction" | "QC Failure (Batch Repeat)" | "Below LLOQ Borderline";
type RepeatStatus = "pending-prep" | "queued" | "confirmed" | "discordant";

const REPEATS: { id: string; sampleId: string; project: string; analyte: string; run: string; reason: RepeatReason; original: string; repeat: string; pctDiff: number | null; status: RepeatStatus; requestedBy: string; date: string }[] = [
  { id: "RPT-2026-001-009", sampleId: "SID-2026-001-009-P1-1H-MET-1",  project: "SID-2026-001", analyte: "Metformin",    run: "RUN-2026-001-005", reason: "IS Response Failure",       original: "21.30 ng/mL",              repeat: "20.10 ng/mL",          pctDiff: 5.8,  status: "confirmed",   requestedBy: "A. Liang", date: "2026-06-12" },
  { id: "RPT-2026-001-008", sampleId: "SID-2026-001-008-P1-1H-MET-1",  project: "SID-2026-001", analyte: "Metformin",    run: "RUN-2026-001-005", reason: "Above ULOQ",                 original: "115.20 ng/mL",             repeat: "110.60 ng/mL (1:2 dilution)", pctDiff: 4.1,  status: "confirmed",   requestedBy: "A. Liang", date: "2026-06-12" },
  { id: "RPT-2026-001-024", sampleId: "SID-2026-001-024-P1-12H-MET-1", project: "SID-2026-001", analyte: "Metformin",    run: "RUN-2026-001-005", reason: "Above ULOQ",                 original: "482.00 ng/mL",             repeat: "465.30 ng/mL (1:5 dilution)", pctDiff: 3.5,  status: "confirmed",   requestedBy: "A. Liang", date: "2026-06-12" },
  { id: "RPT-2026-002-020", sampleId: "SID-2026-002-020-P1-4H-AML-1",  project: "SID-2026-002", analyte: "Amlodipine",   run: "RUN-2026-002-011", reason: "QC Failure (Batch Repeat)", original: "14.20 ng/mL",              repeat: "13.85 ng/mL",          pctDiff: 2.5,  status: "confirmed",   requestedBy: "R. Patel", date: "2026-06-10" },
  { id: "RPT-2026-002-019", sampleId: "SID-2026-002-019-P1-2H-AML-1",  project: "SID-2026-002", analyte: "Amlodipine",   run: "RUN-2026-002-011", reason: "Carryover Suspected",       original: "0.42 ng/mL (borderline)",  repeat: "<0.10 ng/mL (BLQ)",    pctDiff: null, status: "confirmed",   requestedBy: "R. Patel", date: "2026-06-12" },
  { id: "RPT-2026-003-008", sampleId: "SID-2026-003-008-P1-2H-ATO-1",  project: "SID-2026-003", analyte: "Atorvastatin", run: "RUN-2026-003-005", reason: "Below LLOQ Borderline",     original: "0.048 ng/mL (BLQ)",        repeat: "0.061 ng/mL",          pctDiff: 23.9, status: "discordant",  requestedBy: "S. Mehta", date: "2026-06-09" },
  { id: "RPT-2026-003-007", sampleId: "SID-2026-003-007-P1-1H-ATO-1",  project: "SID-2026-003", analyte: "Atorvastatin", run: "RUN-2026-003-005", reason: "Chromatography Issue",      original: "18.6 ng/mL (peak splitting)", repeat: "Pending",           pctDiff: null, status: "queued",      requestedBy: "S. Mehta", date: "2026-06-11" },
  { id: "RPT-2026-001-023", sampleId: "SID-2026-001-023-P1-8H-MET-1",  project: "SID-2026-001", analyte: "Metformin",    run: "RUN-2026-001-005", reason: "Instrument Malfunction",    original: "No peak (autosampler error)", repeat: "Pending",           pctDiff: null, status: "pending-prep", requestedBy: "A. Liang", date: "2026-06-12" },
];

const STATUS_DISPLAY: Record<RepeatStatus, { label: string; icon: typeof CheckCircle2; color: string; bg: string }> = {
  "pending-prep": { label: "Pending Re-prep",     icon: FlaskConical, color: "var(--text-muted)",   bg: "var(--bg-card)" },
  queued:         { label: "Queued for Injection", icon: ListChecks,   color: "var(--status-info)", bg: "var(--status-info-bg)" },
  confirmed:      { label: "Confirmed",            icon: CheckCircle2, color: "var(--status-pass)", bg: "var(--status-pass-bg)" },
  discordant:     { label: "Discordant",           icon: AlertTriangle, color: "var(--status-fail)", bg: "var(--status-fail-bg)" },
};

const columns = [
  { title: "Repeat ID", dataIndex: "id", key: "id",
    render: (v: string) => <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--accent)", fontSize: 12.5 }}>{v}</span> },
  { title: "Sample ID", dataIndex: "sampleId", key: "sampleId",
    render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 11 }}>{v}</span> },
  { title: "Analyte", dataIndex: "analyte", key: "analyte" },
  { title: "Original Run", dataIndex: "run", key: "run",
    render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 11.5, color: "var(--text-secondary)" }}>{v}</span> },
  { title: "Reason", dataIndex: "reason", key: "reason",
    render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span> },
  { title: "Original Result", dataIndex: "original", key: "original",
    render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{v}</span> },
  { title: "Repeat Result", dataIndex: "repeat", key: "repeat",
    render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 12, color: v === "Pending" ? "var(--text-muted)" : "var(--text-primary)" }}>{v}</span> },
  { title: "% Diff", dataIndex: "pctDiff", key: "pctDiff",
    render: (v: number | null) => v === null
      ? <span style={{ color: "var(--text-muted)" }}>—</span>
      : <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: v <= 20 ? "var(--status-pass)" : "var(--status-fail)" }}>{v.toFixed(1)}%</span> },
  { title: "Status", dataIndex: "status", key: "status",
    render: (v: RepeatStatus) => {
      const s = STATUS_DISPLAY[v];
      const Icon = s.icon;
      return (
        <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5" style={{ background: s.bg }}>
          <Icon size={12} style={{ color: s.color }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: s.color, letterSpacing: "0.04em", textTransform: "uppercase" }}>{s.label}</span>
        </span>
      );
    } },
];

export default function RepeatAnalysisPage() {
  const [search, setSearch] = useState("");

  const filtered = REPEATS.filter(r =>
    r.id.toLowerCase().includes(search.toLowerCase()) ||
    r.sampleId.toLowerCase().includes(search.toLowerCase()) ||
    r.analyte.toLowerCase().includes(search.toLowerCase())
  );

  const discordant = REPEATS.filter(r => r.status === "discordant");

  return (
    <AppLayout>
      <div className="page-container">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="section-title">Repeat Analysis</h1>
            <p className="section-subtitle">Samples flagged for re-injection or re-analysis — ULOQ dilutions, IS failures, carryover checks, chromatography issues, and QC-triggered batch repeats</p>
          </div>
          <Button type="primary" icon={<Plus size={14} />}>New Repeat Request</Button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {KPI_CARDS.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="stat-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: `${k.color}20`, color: k.color }}>
                    <Icon size={17} />
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 600, lineHeight: 1, fontFamily: "DM Serif Display, serif" }}>
                  {k.value}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>{k.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{k.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <Input
            prefix={<Search size={13} style={{ color: "var(--text-muted)" }} />}
            placeholder="Search by Repeat ID, Sample ID, or analyte…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 320 }}
          />
          <Select placeholder="Reason" style={{ width: 210 }} allowClear>
            <Option value="Above ULOQ">Above ULOQ</Option>
            <Option value="IS Response Failure">IS Response Failure</Option>
            <Option value="Carryover Suspected">Carryover Suspected</Option>
            <Option value="Chromatography Issue">Chromatography Issue</Option>
            <Option value="Instrument Malfunction">Instrument Malfunction</Option>
            <Option value="QC Failure (Batch Repeat)">QC Failure (Batch Repeat)</Option>
            <Option value="Below LLOQ Borderline">Below LLOQ Borderline</Option>
          </Select>
          <Select placeholder="Status" style={{ width: 180 }} allowClear>
            <Option value="pending-prep">Pending Re-prep</Option>
            <Option value="queued">Queued for Injection</Option>
            <Option value="confirmed">Confirmed</Option>
            <Option value="discordant">Discordant</Option>
          </Select>
          <Select placeholder="Study" style={{ width: 160 }} allowClear>
            <Option value="SID-2026-001">SID-2026-001</Option>
            <Option value="SID-2026-002">SID-2026-002</Option>
            <Option value="SID-2026-003">SID-2026-003</Option>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden mb-6" style={{ border: "1px solid var(--border)", background: "white" }}>
          <Table
            dataSource={filtered}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            onRow={(r) => ({
              style: {
                background: r.status === "discordant" ? "var(--status-fail-bg)"
                  : r.status === "pending-prep" || r.status === "queued" ? "var(--status-info-bg)"
                  : "transparent",
              }
            })}
          />
        </div>

        {/* Investigation note */}
        {discordant.length > 0 && (
          <div>
            <div className="block-label" style={{ marginBottom: 10 }}>Investigation Required</div>
            <div className="flex flex-col gap-2">
              {discordant.map(d => (
                <div key={d.id} className="flex items-start gap-3 rounded-lg px-3 py-3"
                  style={{ background: "var(--status-fail-bg)", border: "1px solid #d4a0a0" }}>
                  <AlertTriangle size={13} style={{ color: "var(--status-fail)", marginTop: 1, flexShrink: 0 }} />
                  <div className="flex-1">
                    <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--accent)" }}>{d.id}</span> — {d.sampleId} repeat result ({d.repeat}) differs from original ({d.original}) by {d.pctDiff?.toFixed(1)}%, exceeding the ±20% acceptance criterion.
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Escalate to QA for review and determine which result is reportable.</div>
                  </div>
                  <Button size="small">Escalate to QA</Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
