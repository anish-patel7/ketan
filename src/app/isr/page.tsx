"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Select, Table } from "antd";
import { RefreshCw, GitCompare, Percent, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

const { Option } = Select;

const KPI_CARDS = [
  { label: "ISR Batches This Study", value: "1",     sub: "ISR-2026-001-01 · SID-2026-001",  icon: RefreshCw,    color: "var(--status-info)" },
  { label: "Samples Reanalyzed",     value: "12",    sub: "10% of subject samples, per protocol", icon: GitCompare, color: "var(--accent)" },
  { label: "Within ±20% (Pass Rate)", value: "91.7%", sub: "11 / 12 pairs",                   icon: Percent,      color: "var(--status-pass)" },
  { label: "Open ISR Failures",      value: "1",     sub: "requires investigation / CAPA",   icon: AlertTriangle, color: "var(--status-fail)" },
];

const PAIRS = [
  { sampleId: "SID-2026-001-007-P1-1H-MET-1",  timepoint: "1H",  original: 47.40, repeat: 45.80 },
  { sampleId: "SID-2026-001-008-P1-1H-MET-1",  timepoint: "1H",  original: 115.2, repeat: 110.6 },
  { sampleId: "SID-2026-001-009-P1-1H-MET-1",  timepoint: "1H",  original: 21.30, repeat: 20.10 },
  { sampleId: "SID-2026-001-010-P1-1H-MET-1",  timepoint: "1H",  original: 38.60, repeat: 36.90 },
  { sampleId: "SID-2026-001-011-P1-2H-MET-1",  timepoint: "2H",  original: 62.40, repeat: 58.10 },
  { sampleId: "SID-2026-001-012-P1-2H-MET-1",  timepoint: "2H",  original: 29.80, repeat: 28.50 },
  { sampleId: "SID-2026-001-013-P1-4H-MET-1",  timepoint: "4H",  original: 18.20, repeat: 26.40 },
  { sampleId: "SID-2026-001-014-P1-4H-MET-1",  timepoint: "4H",  original: 12.50, repeat: 11.80 },
  { sampleId: "SID-2026-001-015-P1-6H-MET-1",  timepoint: "6H",  original: 9.80,  repeat: 9.30 },
  { sampleId: "SID-2026-001-016-P1-8H-MET-1",  timepoint: "8H",  original: 6.40,  repeat: 6.10 },
  { sampleId: "SID-2026-001-017-P1-12H-MET-1", timepoint: "12H", original: 4.20,  repeat: 4.50 },
  { sampleId: "SID-2026-001-018-P1-24H-MET-1", timepoint: "24H", original: 2.10,  repeat: 2.30 },
];

const ISR_DATA = PAIRS.map(p => {
  const pctDiff = (Math.abs(p.original - p.repeat) / ((p.original + p.repeat) / 2)) * 100;
  return { ...p, pctDiff, pass: pctDiff <= 20 };
});

const columns = [
  { title: "Sample ID", dataIndex: "sampleId", key: "sampleId",
    render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 11.5, color: "var(--accent)" }}>{v}</span> },
  { title: "Timepoint", dataIndex: "timepoint", key: "timepoint",
    render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-secondary)" }}>{v}</span> },
  { title: "Original Conc (ng/mL)", dataIndex: "original", key: "original",
    render: (v: number) => <span style={{ fontFamily: "monospace", fontSize: 13 }}>{v.toFixed(2)}</span> },
  { title: "Repeat Conc (ng/mL)", dataIndex: "repeat", key: "repeat",
    render: (v: number) => <span style={{ fontFamily: "monospace", fontSize: 13 }}>{v.toFixed(2)}</span> },
  { title: "% Difference", dataIndex: "pctDiff", key: "pctDiff",
    render: (v: number, r: typeof ISR_DATA[0]) => (
      <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: r.pass ? "var(--status-pass)" : "var(--status-fail)" }}>
        {v.toFixed(1)}%
      </span>
    ) },
  { title: "Criteria", key: "criteria",
    render: () => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>±20%</span> },
  { title: "Result", key: "result",
    render: (_: unknown, r: typeof ISR_DATA[0]) => (
      r.pass
        ? <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5" style={{ background: "var(--status-pass-bg)" }}>
            <CheckCircle2 size={12} style={{ color: "var(--status-pass)" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--status-pass)", letterSpacing: "0.04em" }}>PASS</span>
          </span>
        : <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5" style={{ background: "var(--status-fail-bg)" }}>
            <XCircle size={12} style={{ color: "var(--status-fail)" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--status-fail)", letterSpacing: "0.04em" }}>FAIL</span>
          </span>
    ) },
];

export default function IsrPage() {
  const [study] = useState("SID-2026-001");
  const failed = ISR_DATA.filter(d => !d.pass);

  return (
    <AppLayout>
      <div className="page-container">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="section-title">Incurred Sample Reanalysis (ISR)</h1>
            <p className="section-subtitle">ISR-2026-001-01 · {study} · Metformin · Reanalysis results must agree with original results within ±20%</p>
          </div>
          <div className="flex gap-2">
            <Select defaultValue={study} style={{ width: 160 }}>
              <Option value="SID-2026-001">SID-2026-001</Option>
              <Option value="SID-2026-002">SID-2026-002</Option>
              <Option value="SID-2026-003">SID-2026-003</Option>
            </Select>
            <Button type="primary" icon={<RefreshCw size={14} />}>New ISR Batch</Button>
          </div>
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

        {/* Table */}
        <div className="rounded-xl overflow-hidden mb-6" style={{ border: "1px solid var(--border)", background: "white" }}>
          <Table
            dataSource={ISR_DATA}
            columns={columns}
            rowKey="sampleId"
            size="small"
            pagination={false}
            onRow={(r) => ({ style: { background: r.pass ? "transparent" : "var(--status-fail-bg)" } })}
          />
        </div>

        {/* Investigation note */}
        {failed.length > 0 && (
          <div>
            <div className="block-label" style={{ marginBottom: 10 }}>Investigation Required</div>
            <div className="flex flex-col gap-2">
              {failed.map(f => (
                <div key={f.sampleId} className="flex items-start gap-3 rounded-lg px-3 py-3"
                  style={{ background: "var(--status-fail-bg)", border: "1px solid #d4a0a0" }}>
                  <AlertTriangle size={13} style={{ color: "var(--status-fail)", marginTop: 1, flexShrink: 0 }} />
                  <div className="flex-1">
                    <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--accent)" }}>{f.sampleId}</span> — {f.pctDiff.toFixed(1)}% difference exceeds the ±20% acceptance criterion. Original: {f.original.toFixed(2)} ng/mL, Repeat: {f.repeat.toFixed(2)} ng/mL.
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Open a deviation / CAPA and document root cause before study report finalisation.</div>
                  </div>
                  <Button size="small">Open CAPA</Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
