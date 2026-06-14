"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatusTag from "@/components/ui/StatusTag";
import { Button, Input, Select, Table } from "antd";
import { Inbox, Send, Clock, CheckCircle2, Search, Plus, Snowflake } from "lucide-react";

const { Option } = Select;

const KPI_CARDS = [
  { label: "Open Requests",          value: "3",     sub: "2 awaiting Freezer Room action", icon: Inbox,        color: "var(--status-warn)" },
  { label: "Samples Requested (MTD)", value: "248",   sub: "across 3 studies",               icon: Snowflake,    color: "var(--status-info)" },
  { label: "Avg. Turnaround",        value: "4.2 hr", sub: "request to retrieval",          icon: Clock,        color: "var(--accent)" },
  { label: "Fulfilled This Month",   value: "9",     sub: "1 rejected, re-submitted",       icon: CheckCircle2, color: "var(--status-pass)" },
];

const REQUESTS = [
  { id: "SR-2026-001-009", project: "SID-2026-001", purpose: "Prep for RUN-2026-001-006",       samples: 48, requestedBy: "A. Liang", date: "2026-06-12 09:10", status: "pending" },
  { id: "SR-2026-001-008", project: "SID-2026-001", purpose: "Distribution Sheet DS-2026-001-007", samples: 48, requestedBy: "A. Liang", date: "2026-06-11 14:20", status: "approved" },
  { id: "SR-2026-001-007", project: "SID-2026-001", purpose: "Repeat analysis — RUN-2026-001-005", samples: 6,  requestedBy: "J. Chen",  date: "2026-06-10 11:05", status: "fulfilled" },
  { id: "SR-2026-002-004", project: "SID-2026-002", purpose: "Prep for RUN-2026-002-011",       samples: 36, requestedBy: "R. Patel", date: "2026-06-10 08:40", status: "fulfilled" },
  { id: "SR-2026-003-003", project: "SID-2026-003", purpose: "ISR batch ISR-2026-003-01",       samples: 12, requestedBy: "S. Mehta", date: "2026-06-09 16:15", status: "rejected" },
  { id: "SR-2026-001-006", project: "SID-2026-001", purpose: "Distribution Sheet DS-2026-001-006", samples: 48, requestedBy: "A. Liang", date: "2026-06-08 10:30", status: "fulfilled" },
  { id: "SR-2026-002-003", project: "SID-2026-002", purpose: "Prep for RUN-2026-002-010",       samples: 36, requestedBy: "R. Patel", date: "2026-06-07 09:55", status: "fulfilled" },
];

const columns = [
  { title: "Request ID", dataIndex: "id", key: "id",
    render: (v: string) => <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--accent)", fontSize: 13 }}>{v}</span> },
  { title: "Project", dataIndex: "project", key: "project",
    render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{v}</span> },
  { title: "Purpose", dataIndex: "purpose", key: "purpose",
    render: (v: string) => <span style={{ fontSize: 12.5 }}>{v}</span> },
  { title: "Samples", dataIndex: "samples", key: "samples",
    render: (v: number) => <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{v}</span> },
  { title: "Requested By", dataIndex: "requestedBy", key: "requestedBy",
    render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span> },
  { title: "Date", dataIndex: "date", key: "date",
    render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 11.5, color: "var(--text-secondary)" }}>{v}</span> },
  { title: "Status", dataIndex: "status", key: "status",
    render: (v: string) => <StatusTag status={v} /> },
  {
    title: "", key: "actions",
    render: (_: unknown, r: typeof REQUESTS[0]) => (
      r.status === "pending"
        ? <button className="text-xs px-2 py-1 rounded" style={{ background: "var(--accent-light)", color: "var(--accent)", fontWeight: 600 }}>
            <span className="flex items-center gap-1"><Send size={11} /> Send to Freezer</span>
          </button>
        : null
    )
  },
];

export default function SampleRequestPage() {
  const [search, setSearch] = useState("");

  const filtered = REQUESTS.filter(r =>
    r.id.toLowerCase().includes(search.toLowerCase()) ||
    r.project.toLowerCase().includes(search.toLowerCase()) ||
    r.purpose.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="page-container">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="section-title">Sample Request</h1>
            <p className="section-subtitle">Request subject samples from the Freezer Room for analytical runs, repeats, and ISR</p>
          </div>
          <Button type="primary" icon={<Plus size={14} />}>New Sample Request</Button>
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
            placeholder="Search by Request ID, project, or purpose…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 320 }}
          />
          <Select placeholder="Status" style={{ width: 140 }} allowClear>
            <Option value="pending">Pending</Option>
            <Option value="approved">Approved</Option>
            <Option value="fulfilled">Fulfilled</Option>
            <Option value="rejected">Rejected</Option>
          </Select>
          <Select placeholder="Study" style={{ width: 160 }} allowClear>
            <Option value="SID-2026-001">SID-2026-001</Option>
            <Option value="SID-2026-002">SID-2026-002</Option>
            <Option value="SID-2026-003">SID-2026-003</Option>
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
          />
        </div>
      </div>
    </AppLayout>
  );
}
