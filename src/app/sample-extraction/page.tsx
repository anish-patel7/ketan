"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatusTag from "@/components/ui/StatusTag";
import { Button, Input, Select, Table } from "antd";
import { Filter, Gauge, Clock, AlertTriangle, Search, Plus } from "lucide-react";

const { Option } = Select;

const KPI_CARDS = [
  { label: "Active Extraction Batches", value: "1",     sub: "48 samples in process",        icon: Filter,       color: "var(--status-info)" },
  { label: "Avg Recovery (Last 10)",    value: "92.7%", sub: "acceptance range 80–120%",      icon: Gauge,        color: "var(--accent)" },
  { label: "Batches Pending QC Review", value: "2",     sub: "1 below recovery threshold",   icon: Clock,        color: "var(--status-warn)" },
  { label: "Samples Extracted Today",   value: "48",    sub: "Batch EXT-2026-001-013",        icon: AlertTriangle, color: "var(--status-pass)" },
];

const BATCHES = [
  { id: "EXT-2026-001-015", method: "Protein Precipitation",    project: "SID-2026-001", analyte: "Metformin",    samples: 48, analyst: "A. Liang", recovery: "96.4%", status: "approved" },
  { id: "EXT-2026-001-014", method: "Protein Precipitation",    project: "SID-2026-001", analyte: "Metformin",    samples: 48, analyst: "A. Liang", recovery: "95.1%", status: "QC Review" },
  { id: "EXT-2026-002-009", method: "Liquid-Liquid Extraction", project: "SID-2026-002", analyte: "Amlodipine",   samples: 36, analyst: "R. Patel", recovery: "91.8%", status: "approved" },
  { id: "EXT-2026-002-008", method: "Liquid-Liquid Extraction", project: "SID-2026-002", analyte: "Amlodipine",   samples: 36, analyst: "R. Patel", recovery: "92.3%", status: "approved" },
  { id: "EXT-2026-003-006", method: "Solid-Phase Extraction",   project: "SID-2026-003", analyte: "Atorvastatin", samples: 24, analyst: "S. Mehta", recovery: "78.4%", status: "warning" },
  { id: "EXT-2026-003-005", method: "Solid-Phase Extraction",   project: "SID-2026-003", analyte: "Atorvastatin", samples: 24, analyst: "S. Mehta", recovery: "93.5%", status: "approved" },
  { id: "EXT-2026-001-013", method: "Protein Precipitation",    project: "SID-2026-001", analyte: "Metformin",    samples: 48, analyst: "J. Chen",  recovery: "—",     status: "in progress" },
];

const columns = [
  { title: "Batch ID", dataIndex: "id", key: "id",
    render: (v: string) => <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--accent)", fontSize: 13 }}>{v}</span> },
  { title: "Method", dataIndex: "method", key: "method",
    render: (v: string) => <span style={{ fontSize: 12.5 }}>{v}</span> },
  { title: "Project", dataIndex: "project", key: "project",
    render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{v}</span> },
  { title: "Analyte", dataIndex: "analyte", key: "analyte" },
  { title: "Samples", dataIndex: "samples", key: "samples",
    render: (v: number) => <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{v}</span> },
  { title: "Analyst", dataIndex: "analyst", key: "analyst",
    render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span> },
  { title: "Recovery", dataIndex: "recovery", key: "recovery",
    render: (v: string, r: typeof BATCHES[0]) => (
      <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: r.status === "warning" ? "var(--status-warn)" : "var(--text-primary)" }}>
        {v} {r.status === "warning" && "⚠"}
      </span>
    ) },
  { title: "Status", dataIndex: "status", key: "status",
    render: (v: string) => <StatusTag status={v === "warning" ? "Below Threshold" : v} /> },
];

export default function SampleExtractionPage() {
  const [search, setSearch] = useState("");

  const filtered = BATCHES.filter(b =>
    b.id.toLowerCase().includes(search.toLowerCase()) ||
    b.analyte.toLowerCase().includes(search.toLowerCase()) ||
    b.method.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="page-container">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="section-title">Sample Extraction</h1>
            <p className="section-subtitle">Extraction batches — protein precipitation, liquid-liquid, and solid-phase extraction with recovery tracking</p>
          </div>
          <Button type="primary" icon={<Plus size={14} />}>New Extraction Batch</Button>
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
            placeholder="Search by Batch ID, analyte, or method…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 320 }}
          />
          <Select placeholder="Method" style={{ width: 200 }} allowClear>
            <Option value="ppt">Protein Precipitation</Option>
            <Option value="lle">Liquid-Liquid Extraction</Option>
            <Option value="spe">Solid-Phase Extraction</Option>
          </Select>
          <Select placeholder="Status" style={{ width: 160 }} allowClear>
            <Option value="in progress">In Progress</Option>
            <Option value="QC Review">QC Review</Option>
            <Option value="approved">Approved</Option>
            <Option value="warning">Below Threshold</Option>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "white" }}>
          <Table
            dataSource={filtered}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            onRow={(r) => ({ style: { background: r.status === "warning" ? "var(--status-warn-bg)" : "transparent" } })}
          />
        </div>
      </div>
    </AppLayout>
  );
}
