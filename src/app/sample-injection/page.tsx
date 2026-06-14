"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Input, Select, Table, Progress } from "antd";
import { Droplet, ListChecks, Microscope, Timer, PlayCircle, CheckCircle2, Clock, XCircle, Search, Plus } from "lucide-react";

const { Option } = Select;

const KPI_CARDS = [
  { label: "Active Sequences",      value: "1",      sub: "RUN-2026-001-006",                 icon: Droplet,    color: "var(--status-info)" },
  { label: "Injections Queued",     value: "21",     sub: "8 CC · 3 QC · 10 subject",          icon: ListChecks, color: "var(--accent)" },
  { label: "Instruments In Use",    value: "1 / 2",  sub: "LCMS-01 — Sciex Triple Quad 6500+", icon: Microscope, color: "var(--status-pass)" },
  { label: "Avg Injection Cycle",   value: "4.5 min", sub: "per sample, incl. equilibration",  icon: Timer,      color: "var(--status-warn)" },
];

type InjStatus = "complete" | "injecting" | "queued" | "error";

const SEQUENCE: { pos: number; sampleId: string; type: string; vial: string; volume: string; status: InjStatus }[] = [
  { pos: 1,  sampleId: "CC-2026-001-MET-CC1-001",       type: "CC",       vial: "A1", volume: "5 µL", status: "complete" },
  { pos: 2,  sampleId: "CC-2026-001-MET-CC2-001",       type: "CC",       vial: "A2", volume: "5 µL", status: "complete" },
  { pos: 3,  sampleId: "CC-2026-001-MET-CC3-001",       type: "CC",       vial: "A3", volume: "5 µL", status: "complete" },
  { pos: 4,  sampleId: "BLK-IS-001",                    type: "Blank+IS", vial: "A4", volume: "5 µL", status: "complete" },
  { pos: 5,  sampleId: "QC-2026-001-MET-HQC-001",       type: "QC",       vial: "A5", volume: "5 µL", status: "injecting" },
  { pos: 6,  sampleId: "SID-2026-001-010-P1-0H-MET-1",  type: "Subject",  vial: "B1", volume: "5 µL", status: "queued" },
  { pos: 7,  sampleId: "SID-2026-001-010-P1-0.5H-MET-1",type: "Subject",  vial: "B2", volume: "5 µL", status: "queued" },
  { pos: 8,  sampleId: "SID-2026-001-010-P1-1H-MET-1",  type: "Subject",  vial: "B3", volume: "5 µL", status: "queued" },
  { pos: 9,  sampleId: "QC-2026-001-MET-MQC-001",       type: "QC",       vial: "B4", volume: "5 µL", status: "queued" },
  { pos: 10, sampleId: "QC-2026-001-MET-LQC-001",       type: "QC",       vial: "B5", volume: "5 µL", status: "queued" },
];

const STATUS_DISPLAY: Record<InjStatus, { label: string; icon: typeof CheckCircle2; color: string }> = {
  complete:  { label: "Complete",  icon: CheckCircle2, color: "var(--status-pass)" },
  injecting: { label: "Injecting", icon: PlayCircle,   color: "var(--status-info)" },
  queued:    { label: "Queued",    icon: Clock,        color: "var(--text-muted)" },
  error:     { label: "Error",     icon: XCircle,      color: "var(--status-fail)" },
};

const columns = [
  { title: "Pos", dataIndex: "pos", key: "pos", width: 50,
    render: (v: number) => <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-muted)" }}>{v}</span> },
  { title: "Sample ID", dataIndex: "sampleId", key: "sampleId",
    render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--accent)" }}>{v}</span> },
  { title: "Type", dataIndex: "type", key: "type",
    render: (v: string) => <span style={{ fontSize: 12, fontWeight: 600, color: v === "CC" ? "#3A6B9B" : v === "QC" ? "var(--accent)" : "var(--text-secondary)" }}>{v}</span> },
  { title: "Vial", dataIndex: "vial", key: "vial",
    render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{v}</span> },
  { title: "Inj. Volume", dataIndex: "volume", key: "volume",
    render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-secondary)" }}>{v}</span> },
  { title: "Instrument", key: "instrument",
    render: () => <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-secondary)" }}>LCMS-01</span> },
  { title: "Column", key: "column",
    render: () => <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-secondary)" }}>260001</span> },
  { title: "Status", dataIndex: "status", key: "status",
    render: (v: InjStatus) => {
      const s = STATUS_DISPLAY[v];
      const Icon = s.icon;
      return (
        <div className="flex items-center gap-1.5">
          <Icon size={13} style={{ color: s.color }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</span>
        </div>
      );
    } },
];

export default function SampleInjectionPage() {
  const [search, setSearch] = useState("");

  const filtered = SEQUENCE.filter(s =>
    s.sampleId.toLowerCase().includes(search.toLowerCase()) ||
    s.type.toLowerCase().includes(search.toLowerCase())
  );

  const completed = SEQUENCE.filter(s => s.status === "complete").length;
  const pct = Math.round((completed / SEQUENCE.length) * 100);

  return (
    <AppLayout>
      <div className="page-container">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="section-title">Sample Injection</h1>
            <p className="section-subtitle">Injection sequence and worklist for LC-MS/MS analytical runs</p>
          </div>
          <Button type="primary" icon={<Plus size={14} />}>Build Sequence</Button>
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

        {/* Active sequence progress */}
        <div className="rounded-xl p-4 mb-6" style={{ background: "white", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="block-label" style={{ marginBottom: 2 }}>Active Sequence</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>RUN-2026-001-006 · LCMS-01 · Column 260001</div>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{completed} / {SEQUENCE.length} injections complete</span>
          </div>
          <Progress percent={pct} strokeColor="var(--accent)" showInfo={true} />
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <Input
            prefix={<Search size={13} style={{ color: "var(--text-muted)" }} />}
            placeholder="Search by Sample ID or type…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 320 }}
          />
          <Select placeholder="Type" style={{ width: 140 }} allowClear>
            <Option value="CC">CC</Option>
            <Option value="QC">QC</Option>
            <Option value="Subject">Subject</Option>
            <Option value="Blank+IS">Blank+IS</Option>
          </Select>
          <Select placeholder="Status" style={{ width: 140 }} allowClear>
            <Option value="complete">Complete</Option>
            <Option value="injecting">Injecting</Option>
            <Option value="queued">Queued</Option>
            <Option value="error">Error</Option>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "white" }}>
          <Table
            dataSource={filtered}
            columns={columns}
            rowKey="pos"
            size="small"
            pagination={false}
            onRow={(r) => ({ style: { background: r.status === "injecting" ? "var(--status-info-bg)" : "transparent" } })}
          />
        </div>
      </div>
    </AppLayout>
  );
}
