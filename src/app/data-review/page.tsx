"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Input, Select, Table } from "antd";
import { Clock, CheckCircle2, MessageSquare, Eye, Search } from "lucide-react";

const { Option } = Select;

const KPI_CARDS = [
  { label: "Runs Pending QA Review", value: "2", sub: "RUN-2026-001-005, RUN-2026-002-011", icon: Clock,        color: "var(--status-info)" },
  { label: "Reviewed This Week",     value: "5", sub: "4 approved, 1 query raised",         icon: CheckCircle2, color: "var(--status-pass)" },
  { label: "Avg Review Time",        value: "1.2 days", sub: "submission to QA decision",   icon: Eye,          color: "var(--accent)" },
  { label: "Open Queries",           value: "1", sub: "awaiting analyst response",          icon: MessageSquare, color: "var(--status-warn)" },
];

type ReviewStatus = "pending" | "in-review" | "approved" | "query";

const RUNS: { run: string; project: string; analyte: string; analyst: string; reviewer: string; submitted: string; status: ReviewStatus }[] = [
  { run: "RUN-2026-001-005", project: "SID-2026-001", analyte: "Metformin",    analyst: "A. Liang", reviewer: "—",      submitted: "2026-06-12 09:30", status: "pending" },
  { run: "RUN-2026-002-011", project: "SID-2026-002", analyte: "Amlodipine",   analyst: "R. Patel", reviewer: "—",      submitted: "2026-06-12 08:15", status: "in-review" },
  { run: "RUN-2026-003-005", project: "SID-2026-003", analyte: "Atorvastatin", analyst: "S. Mehta", reviewer: "J. Chen", submitted: "2026-06-09 10:00", status: "query" },
  { run: "RUN-2026-001-004", project: "SID-2026-001", analyte: "Metformin",    analyst: "A. Liang", reviewer: "J. Chen", submitted: "2026-06-11 16:00", status: "approved" },
  { run: "RUN-2026-002-010", project: "SID-2026-002", analyte: "Amlodipine",   analyst: "R. Patel", reviewer: "J. Chen", submitted: "2026-06-10 14:20", status: "approved" },
  { run: "RUN-2026-001-003", project: "SID-2026-001", analyte: "Metformin",    analyst: "A. Liang", reviewer: "J. Chen", submitted: "2026-06-08 09:00", status: "approved" },
];

const STATUS_DISPLAY: Record<ReviewStatus, { label: string; icon: typeof CheckCircle2; color: string; bg: string }> = {
  pending:   { label: "Pending QA Review", icon: Clock,        color: "var(--status-info)", bg: "var(--status-info-bg)" },
  "in-review": { label: "In Review",       icon: Eye,          color: "var(--text-secondary)", bg: "var(--bg-card)" },
  approved:  { label: "Approved",          icon: CheckCircle2, color: "var(--status-pass)", bg: "var(--status-pass-bg)" },
  query:     { label: "Query Raised",      icon: MessageSquare, color: "var(--status-warn)", bg: "var(--status-warn-bg)" },
};

const QUERIES = [
  { run: "RUN-2026-003-005", text: "CC R² (0.9976) below target — please confirm calibration curve was prepared with fresh stock and re-evaluate weighting.", raisedBy: "J. Chen", date: "2026-06-09 11:20" },
];

const columns = [
  { title: "Run ID", dataIndex: "run", key: "run",
    render: (v: string) => <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--accent)", fontSize: 13 }}>{v}</span> },
  { title: "Project", dataIndex: "project", key: "project",
    render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{v}</span> },
  { title: "Analyte", dataIndex: "analyte", key: "analyte" },
  { title: "Primary Analyst", dataIndex: "analyst", key: "analyst",
    render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span> },
  { title: "QA Reviewer", dataIndex: "reviewer", key: "reviewer",
    render: (v: string) => <span style={{ fontSize: 12, color: v === "—" ? "var(--text-muted)" : "var(--text-primary)" }}>{v}</span> },
  { title: "Submitted", dataIndex: "submitted", key: "submitted",
    render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 11.5, color: "var(--text-secondary)" }}>{v}</span> },
  { title: "Status", dataIndex: "status", key: "status",
    render: (v: ReviewStatus) => {
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

export default function DataReviewPage() {
  const [search, setSearch] = useState("");

  const filtered = RUNS.filter(r =>
    r.run.toLowerCase().includes(search.toLowerCase()) ||
    r.project.toLowerCase().includes(search.toLowerCase()) ||
    r.analyte.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="page-container">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="section-title">Data Review</h1>
            <p className="section-subtitle">Secondary QA review of analytical run data prior to reporting</p>
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

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <Input
            prefix={<Search size={13} style={{ color: "var(--text-muted)" }} />}
            placeholder="Search by Run ID, project, or analyte…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 320 }}
          />
          <Select placeholder="Status" style={{ width: 170 }} allowClear>
            <Option value="pending">Pending QA Review</Option>
            <Option value="in-review">In Review</Option>
            <Option value="approved">Approved</Option>
            <Option value="query">Query Raised</Option>
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
            rowKey="run"
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            onRow={(r) => ({ style: { background: r.status === "query" ? "var(--status-warn-bg)" : "transparent" } })}
          />
        </div>

        {/* Open queries */}
        <div>
          <div className="block-label" style={{ marginBottom: 10 }}>Open Queries</div>
          <div className="flex flex-col gap-2">
            {QUERIES.map((q, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg px-3 py-3"
                style={{ background: "var(--status-warn-bg)", border: "1px solid #e8c97c" }}>
                <MessageSquare size={13} style={{ color: "var(--status-warn)", marginTop: 1, flexShrink: 0 }} />
                <div className="flex-1">
                  <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--accent)" }}>{q.run}</span> — {q.text}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Raised by {q.raisedBy} · {q.date}</div>
                </div>
                <Button size="small">Respond</Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
