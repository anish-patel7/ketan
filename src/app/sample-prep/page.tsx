"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatusTag from "@/components/ui/StatusTag";
import { Button, Input, Select, Table } from "antd";
import { Pipette, FlaskConical, AlertTriangle, Timer, Search, Plus } from "lucide-react";

const { Option } = Select;

const KPI_CARDS = [
  { label: "Active Prep Batches",     value: "2",     sub: "1 pending QA verification",   icon: Pipette,      color: "var(--status-info)" },
  { label: "Standards Prepared (MTD)", value: "14",   sub: "CC + QC sets, all analytes",  icon: FlaskConical, color: "var(--accent)" },
  { label: "Expiring Within 7 Days",  value: "2",     sub: "re-preparation required",     icon: AlertTriangle, color: "var(--status-warn)" },
  { label: "Avg Prep Time",           value: "1.8 hr", sub: "per batch, weighing to vortex", icon: Timer,      color: "var(--status-pass)" },
];

const BATCHES = [
  { id: "PREP-2026-001-014", type: "CC Set (CC1–CC8)",        analyte: "Metformin",    preparedBy: "A. Liang", prepared: "2026-06-12", expiry: "2026-06-26", status: "verified" },
  { id: "PREP-2026-001-013", type: "QC Set (LQC/MQC/HQC)",    analyte: "Metformin",    preparedBy: "A. Liang", prepared: "2026-06-12", expiry: "2026-06-26", status: "verified" },
  { id: "PREP-2026-002-008", type: "CC Set (CC1–CC8)",        analyte: "Amlodipine",   preparedBy: "R. Patel", prepared: "2026-06-11", expiry: "2026-06-25", status: "in progress" },
  { id: "PREP-2026-002-007", type: "Working Solution (1 mg/mL)", analyte: "Amlodipine", preparedBy: "R. Patel", prepared: "2026-06-11", expiry: "2026-07-11", status: "prepared" },
  { id: "PREP-2026-003-005", type: "QC Set (LQC/MQC/HQC)",    analyte: "Atorvastatin", preparedBy: "S. Mehta", prepared: "2026-06-05", expiry: "2026-06-19", status: "warning" },
  { id: "PREP-2026-001-012", type: "Working Solution (1 mg/mL)", analyte: "Metformin", preparedBy: "A. Liang", prepared: "2026-05-20", expiry: "2026-06-19", status: "warning" },
  { id: "PREP-2026-003-004", type: "CC Set (CC1–CC8)",        analyte: "Atorvastatin", preparedBy: "S. Mehta", prepared: "2026-05-25", expiry: "2026-06-08", status: "expired" },
];

const columns = [
  { title: "Batch ID", dataIndex: "id", key: "id",
    render: (v: string) => <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--accent)", fontSize: 13 }}>{v}</span> },
  { title: "Type", dataIndex: "type", key: "type",
    render: (v: string) => <span style={{ fontSize: 12.5 }}>{v}</span> },
  { title: "Analyte", dataIndex: "analyte", key: "analyte" },
  { title: "Prepared By", dataIndex: "preparedBy", key: "preparedBy",
    render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span> },
  { title: "Prepared Date", dataIndex: "prepared", key: "prepared",
    render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-secondary)" }}>{v}</span> },
  { title: "Expiry", dataIndex: "expiry", key: "expiry",
    render: (v: string, r: typeof BATCHES[0]) => (
      <span style={{ fontFamily: "monospace", fontSize: 12, color: r.status === "expired" || r.status === "warning" ? "var(--status-warn)" : "var(--text-primary)", fontWeight: r.status === "expired" || r.status === "warning" ? 700 : 400 }}>
        {v} {(r.status === "expired" || r.status === "warning") && "⚠"}
      </span>
    ) },
  { title: "Status", dataIndex: "status", key: "status",
    render: (v: string) => <StatusTag status={v === "warning" ? "Expiring Soon" : v} /> },
];

export default function SamplePrepPage() {
  const [search, setSearch] = useState("");

  const filtered = BATCHES.filter(b =>
    b.id.toLowerCase().includes(search.toLowerCase()) ||
    b.analyte.toLowerCase().includes(search.toLowerCase()) ||
    b.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="page-container">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="section-title">Sample Preparation</h1>
            <p className="section-subtitle">Calibration standards, QC sets, and working solution preparation prior to extraction</p>
          </div>
          <Button type="primary" icon={<Plus size={14} />}>New Prep Batch</Button>
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
            placeholder="Search by Batch ID, analyte, or type…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 320 }}
          />
          <Select placeholder="Type" style={{ width: 170 }} allowClear>
            <Option value="cc">CC Set</Option>
            <Option value="qc">QC Set</Option>
            <Option value="working">Working Solution</Option>
          </Select>
          <Select placeholder="Status" style={{ width: 150 }} allowClear>
            <Option value="in progress">In Progress</Option>
            <Option value="prepared">Prepared</Option>
            <Option value="verified">Verified</Option>
            <Option value="warning">Expiring Soon</Option>
            <Option value="expired">Expired</Option>
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
            onRow={(r) => ({ style: { background: r.status === "expired" ? "var(--status-fail-bg)" : r.status === "warning" ? "var(--status-warn-bg)" : "transparent" } })}
          />
        </div>
      </div>
    </AppLayout>
  );
}
