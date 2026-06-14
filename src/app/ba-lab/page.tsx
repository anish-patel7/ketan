"use client";

import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import StatusTag from "@/components/ui/StatusTag";
import {
  FileSpreadsheet, Columns3, Activity,
  AlertTriangle, CheckCircle2, Clock, ArrowRight,
  PackageSearch, BarChart2, BarChart3, FlaskConical,
  Pipette, Inbox, Filter, Droplet, FileSearch, RefreshCw, Repeat,
} from "lucide-react";

const STATS = [
  { label: "Runs This Month",    value: "34", sub: "28 accepted, 6 pending",    icon: Activity,       color: "var(--status-pass)" },
  { label: "Pending Approvals",  value: "2",  sub: "distribution sheets",       icon: FileSpreadsheet, color: "var(--status-warn)" },
  { label: "Columns In Service", value: "12", sub: "3 nearing injection limit", icon: PackageSearch,  color: "var(--accent)" },
  { label: "Active Methods",     value: "4",  sub: "2 pending QC review",       icon: FlaskConical,   color: "var(--status-info)" },
];

const MODULE_LINKS = [
  { key: "ba-setup",          title: "Project Setup",                  icon: FileSpreadsheet, path: "/ba-setup",          description: "Project folders, mastersheets, and analyte method setup" },
  { key: "distribution",      title: "Distribution Sheet",             icon: Columns3,        path: "/distribution",      description: "Sample distribution from Freezer Room — QA & PL approval" },
  { key: "sample-prep",       title: "Sample Preparation",             icon: Pipette,         path: "/sample-prep",       description: "Calibration standards, QC spiking, and aliquoting" },
  { key: "sample-request",    title: "Sample Request",                 icon: Inbox,           path: "/sample-request",    description: "Request subject samples from Freezer Room for a run" },
  { key: "sample-extraction", title: "Sample Extraction",              icon: Filter,          path: "/sample-extraction", description: "Extraction batches — protein precipitation, LLE, SPE" },
  { key: "sample-injection",  title: "Sample Injection",               icon: Droplet,         path: "/sample-injection",  description: "Injection sequence and worklist for LC-MS/MS runs" },
  { key: "data-review",       title: "Data Review",                    icon: FileSearch,      path: "/data-review",       description: "Secondary QA review of analytical run data" },
  { key: "lcms",              title: "LC-MS/MS Auto Review & Repeat",  icon: Activity,        path: "/lcms",              description: "Calibration curve, QC acceptance, flags, and repeat analysis" },
  { key: "repeat-analysis",   title: "Repeat Analysis",                icon: Repeat,          path: "/repeat-analysis",   description: "Re-injection/re-analysis requests — ULOQ, IS failures, carryover, QC repeats" },
  { key: "isr",               title: "ISR",                            icon: RefreshCw,       path: "/isr",               description: "Incurred sample reanalysis — repeatability check" },
  { key: "analytics",         title: "Analytics",                      icon: BarChart3,       path: "/analytics",         description: "Study performance, run acceptance, and QC trends" },
  { key: "columns",           title: "Column Management",              icon: PackageSearch,   path: "/columns",           description: "HPLC column inventory, issuance, and utilisation" },
];

const ALERTS = [
  { level: "warn", text: "Column 260028 at 84% injection limit — consider reorder for SID-2026-001" },
  { level: "warn", text: "DS-2026-001-007 pending Project Leader approval since 09:41 today" },
  { level: "info", text: "RUN-2026-001-005: QC all pass (R² 0.9998), 2 subject samples flagged for review" },
  { level: "pass", text: "Mastersheet MS-2026-001-MET approved by QA — 18 Apr 2026" },
];

const RECENT = [
  { time: "09:41", user: "A. Liang",     action: "Distribution Sheet DS-2026-001-007 submitted for PL approval",  tag: "pending" },
  { time: "09:12", user: "R. Patel",     action: "Column 260034 returned in good condition — logged",             tag: "approved" },
  { time: "08:55", user: "S. Mehta",     action: "Mastersheet MS-2026-001-MET approved by QA",                   tag: "approved" },
  { time: "08:30", user: "J. Chen",      action: "48 tubes received from Freezer Room, pouch labels generated",   tag: "approved" },
  { time: "Yesterday", user: "A. Liang", action: "Run RUN-2026-001-005 accepted — all QC passed, 2 flags noted", tag: "warning" },
];

export default function BioanalyticalPage() {
  const router = useRouter();

  return (
    <AppLayout>
      <div className="page-container">

        {/* Header */}
        <div className="mb-8">
          <h1 className="section-title" style={{ marginBottom: 4 }}>Bioanalytical Dashboard</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Analytical method setup, sample workflow, distribution, and LC-MS/MS run management
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="stat-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: `${s.color}20`, color: s.color }}>
                    <Icon size={17} />
                  </div>
                  <BarChart2 size={13} style={{ color: "var(--text-muted)" }} />
                </div>
                <div style={{ fontSize: 28, fontWeight: 600, lineHeight: 1, fontFamily: "DM Serif Display, serif" }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Module grid */}
        <div className="mb-8">
          <div className="block-label" style={{ marginBottom: 10 }}>Bioanalytical Workflow</div>
          <div className="grid grid-cols-4 gap-4">
            {MODULE_LINKS.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.key}
                  onClick={() => router.push(m.path)}
                  className="text-left rounded-xl p-4 cursor-pointer transition-all duration-150 group"
                  style={{ background: "white", border: "1px solid var(--border)", fontFamily: "inherit" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                      <Icon size={16} />
                    </div>
                    <ArrowRight size={13} style={{ color: "var(--text-muted)" }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "DM Serif Display, serif", marginBottom: 4, lineHeight: 1.3 }}>
                    {m.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {m.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Alerts + activity */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="block-label" style={{ marginBottom: 10 }}>Alerts</div>
            <div className="flex flex-col gap-2">
              {ALERTS.map((a, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg px-3 py-3"
                  style={{
                    background: a.level === "warn" ? "var(--status-warn-bg)" : a.level === "info" ? "var(--status-info-bg)" : "var(--status-pass-bg)",
                    border: `1px solid ${a.level === "warn" ? "#e8c97c" : a.level === "info" ? "#9bc0e0" : "#a0cbb0"}`,
                  }}>
                  {a.level === "warn"
                    ? <AlertTriangle size={13} style={{ color: "var(--status-warn)", marginTop: 1, flexShrink: 0 }} />
                    : a.level === "pass"
                    ? <CheckCircle2 size={13} style={{ color: "var(--status-pass)", marginTop: 1, flexShrink: 0 }} />
                    : <Clock size={13} style={{ color: "var(--status-info)", marginTop: 1, flexShrink: 0 }} />}
                  <span style={{ fontSize: 12, lineHeight: 1.5 }}>{a.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="block-label" style={{ marginBottom: 10 }}>Recent Activity</div>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "white" }}>
              {RECENT.map((r, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3"
                  style={{ borderBottom: i < RECENT.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", paddingTop: 2, minWidth: 52, textAlign: "right", flexShrink: 0 }}>
                    {r.time}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 12, lineHeight: 1.5 }}>{r.action}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{r.user}</div>
                  </div>
                  <StatusTag status={r.tag} />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
