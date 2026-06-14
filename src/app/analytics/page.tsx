"use client";

import AppLayout from "@/components/layout/AppLayout";
import StatusTag from "@/components/ui/StatusTag";
import UtilBar from "@/components/ui/UtilBar";
import { Button, Select, Table } from "antd";
import { Download, TrendingUp, CheckCircle2, AlertTriangle, FlaskConical, PackageSearch } from "lucide-react";

const { Option } = Select;

const KPI_CARDS = [
  { label: "Run Acceptance Rate",     value: "94.1%",  sub: "32 of 34 runs accepted",         icon: CheckCircle2, color: "var(--status-pass)" },
  { label: "QC Pass Rate (All QCs)",  value: "96.8%",  sub: "across 34 accepted runs",         icon: TrendingUp,   color: "var(--status-pass)" },
  { label: "CC R² Average",           value: "0.9991", sub: "Min observed: 0.9978",            icon: TrendingUp,   color: "var(--accent)" },
  { label: "Deviations This Month",   value: "3",      sub: "1 open CAPA",                    icon: AlertTriangle,color: "var(--status-warn)" },
  { label: "Samples Analysed",        value: "1,248",  sub: "across 3 active studies",         icon: FlaskConical, color: "var(--status-info)" },
  { label: "Columns Nearing Limit",   value: "3",      sub: ">80% injection utilisation",     icon: PackageSearch,color: "var(--status-warn)" },
];

const STUDY_PERF = [
  { study: "SID-2026-001", molecule: "Metformin",    runs: 18, accepted: 17, rejected: 1, qcPass: "97.2%", avgR2: "0.9993", samples: 648, status: "active" },
  { study: "SID-2026-002", molecule: "Amlodipine",   runs: 10, accepted: 10, rejected: 0, qcPass: "98.1%", avgR2: "0.9995", samples: 360, status: "active" },
  { study: "SID-2026-003", molecule: "Atorvastatin", runs: 6,  accepted: 5,  rejected: 1, qcPass: "94.4%", avgR2: "0.9985", samples: 240, status: "active" },
];

const RECENT_RUNS = [
  { run: "RUN-2026-001-018", study: "SID-2026-001", analyte: "MET", date: "18 Apr", ccR2: "0.9993", hqc: "102.3%", mqc: "98.7%", lqc: "101.2%", result: "accepted" },
  { run: "RUN-2026-002-010", study: "SID-2026-002", analyte: "AML", date: "18 Apr", ccR2: "0.9996", hqc: "99.8%",  mqc: "101.5%",lqc: "98.3%",  result: "accepted" },
  { run: "RUN-2026-003-005", study: "SID-2026-003", analyte: "ATR", date: "17 Apr", ccR2: "0.9976", hqc: "88.4%",  mqc: "90.1%", lqc: "85.9%",  result: "rejected" },
  { run: "RUN-2026-001-017", study: "SID-2026-001", analyte: "MET", date: "17 Apr", ccR2: "0.9991", hqc: "100.4%", mqc: "99.2%", lqc: "102.1%", result: "accepted" },
  { run: "RUN-2026-001-016", study: "SID-2026-001", analyte: "MET", date: "16 Apr", ccR2: "0.9988", hqc: "97.6%",  mqc: "98.9%", lqc: "96.8%",  result: "accepted" },
];

const COLUMN_PERF = [
  { id: "260001", name: "Kinetex C18 100A", project: "SID-2026-001", used: 420, max: 500, pct: 84 },
  { id: "260028", name: "Kinetex C18 100A", project: "SID-2026-001", used: 420, max: 500, pct: 84 },
  { id: "260031", name: "Zorbax RRHD",      project: "SID-2026-003", used: 290, max: 400, pct: 73 },
  { id: "260006", name: "Kinetex Phenyl",   project: "SID-2026-002", used: 240, max: 300, pct: 80 },
];

const studyPerfCols = [
  { title: "Study", dataIndex: "study", key: "study", render: (v: string) => <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--accent)", fontSize: 13 }}>{v}</span> },
  { title: "Molecule", dataIndex: "molecule", key: "molecule" },
  { title: "Total Runs", dataIndex: "runs", key: "runs", render: (v: number) => <span style={{ fontWeight: 600 }}>{v}</span> },
  { title: "Accepted", dataIndex: "accepted", key: "accepted", render: (v: number) => <span style={{ color: "var(--status-pass)", fontWeight: 600 }}>{v}</span> },
  { title: "Rejected", dataIndex: "rejected", key: "rejected", render: (v: number) => <span style={{ color: v > 0 ? "var(--status-fail)" : "var(--text-muted)", fontWeight: v > 0 ? 600 : 400 }}>{v}</span> },
  { title: "QC Pass Rate", dataIndex: "qcPass", key: "qcPass", render: (v: string) => <span style={{ color: "var(--status-pass)", fontWeight: 600 }}>{v}</span> },
  { title: "Avg CC R²", dataIndex: "avgR2", key: "avgR2", render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{v}</span> },
  { title: "Samples", dataIndex: "samples", key: "samples" },
  { title: "Status", dataIndex: "status", key: "status", render: (v: string) => <StatusTag status={v} /> },
];

const runCols = [
  { title: "Run ID", dataIndex: "run", key: "run", render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>{v}</span> },
  { title: "Study", dataIndex: "study", key: "study", render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span> },
  { title: "Analyte", dataIndex: "analyte", key: "analyte" },
  { title: "Date", dataIndex: "date", key: "date", render: (v: string) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{v}</span> },
  { title: "CC R²", dataIndex: "ccR2", key: "ccR2", render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{v}</span> },
  { title: "HQC RE%", dataIndex: "hqc", key: "hqc", render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span> },
  { title: "MQC RE%", dataIndex: "mqc", key: "mqc", render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span> },
  { title: "LQC RE%", dataIndex: "lqc", key: "lqc", render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span> },
  { title: "Result", dataIndex: "result", key: "result", render: (v: string) => <StatusTag status={v} /> },
];

const colPerfCols = [
  { title: "Column ID", dataIndex: "id", key: "id", render: (v: string) => <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--accent)", fontSize: 13 }}>{v}</span> },
  { title: "Name", dataIndex: "name", key: "name" },
  { title: "Project", dataIndex: "project", key: "project", render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span> },
  {
    title: "Utilisation", key: "util",
    render: (_: unknown, r: typeof COLUMN_PERF[0]) => (
      <div style={{ minWidth: 130 }}>
        <UtilBar pct={r.pct} />
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{r.used} / {r.max} inj</div>
      </div>
    )
  },
];

export default function AnalyticsPage() {
  return (
    <AppLayout>
      <div className="page-container">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="section-title">Analytics & Reporting</h1>
            <p className="section-subtitle">Study performance, run acceptance metrics, QC trends, and column utilisation — April 2026</p>
          </div>
          <div className="flex gap-2">
            <Select defaultValue="all" style={{ width: 200 }}>
              <Option value="all">All Studies</Option>
              <Option value="SID-2026-001">SID-2026-001</Option>
              <Option value="SID-2026-002">SID-2026-002</Option>
              <Option value="SID-2026-003">SID-2026-003</Option>
            </Select>
            <Button icon={<Download size={14} />} style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              Export PDF
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {KPI_CARDS.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="rounded-xl p-5" style={{ background: "white", border: "1px solid var(--border)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: `${k.color}20`, color: k.color }}>
                    <Icon size={17} />
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 600, lineHeight: 1, fontFamily: "DM Serif Display, serif", color: k.color }}>
                  {k.value}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>{k.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{k.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Study Performance Table */}
        <div className="mb-8">
          <div className="block-label mb-3">Study Performance Summary</div>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "white" }}>
            <Table
              dataSource={STUDY_PERF}
              columns={studyPerfCols}
              rowKey="study"
              size="small"
              pagination={false}
            />
          </div>
        </div>

        {/* Bottom 2-col: Recent Runs + Column Utilisation */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="block-label mb-3">Recent Runs</div>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "white" }}>
              <Table
                dataSource={RECENT_RUNS}
                columns={runCols}
                rowKey="run"
                size="small"
                pagination={false}
                scroll={{ x: true }}
              />
            </div>
          </div>

          <div>
            <div className="block-label mb-3">Column Utilisation — Active Columns</div>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "white" }}>
              <Table
                dataSource={COLUMN_PERF}
                columns={colPerfCols}
                rowKey="id"
                size="small"
                pagination={false}
              />
            </div>

            <div className="mt-4 rounded-xl p-4" style={{ background: "white", border: "1px solid var(--border)" }}>
              <div className="block-label mb-3">QC Acceptance by Level — Last 30 Days</div>
              {[
                { level: "HQC", pct: 98 },
                { level: "MQC", pct: 97 },
                { level: "LQC", pct: 95 },
              ].map(q => (
                <div key={q.level} className="flex items-center gap-3 mb-2">
                  <span style={{ fontSize: 12, fontWeight: 600, minWidth: 36 }}>{q.level}</span>
                  <UtilBar pct={q.pct} />
                  <span style={{ fontSize: 12, color: "var(--status-pass)", fontWeight: 600, minWidth: 40 }}>{q.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
