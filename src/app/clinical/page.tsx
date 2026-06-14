"use client";

import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import StatusTag from "@/components/ui/StatusTag";
import {
  ClipboardList, TestTube2, FlaskConical,
  AlertTriangle, CheckCircle2, Clock, ArrowRight,
  Users, Syringe, Timer, MapPin,
} from "lucide-react";

const STATS = [
  { label: "Active Studies",    value: "4",  sub: "2 in dosing phase",         icon: ClipboardList, color: "var(--accent)" },
  { label: "Subjects Enrolled", value: "72", sub: "across all periods",         icon: Users,         color: "var(--status-info)" },
  { label: "Collections Today", value: "18", sub: "14 complete, 4 in progress", icon: Syringe,       color: "var(--status-pass)" },
  { label: "CPMA Pending",      value: "6",  sub: "awaiting centrifugation",    icon: Timer,         color: "var(--status-warn)" },
];

const SECTIONS = [
  {
    key: "timepoints",
    title: "Time Point Mapping",
    icon: Clock,
    path: "/timepoints",
    accent: "#B05E2A",
    accentBg: "#FDF2EA",
    description: "Map collection schedules to approved projects — available after folder request approval.",
    stats: [
      { label: "Mapped",   value: "2" },
      { label: "Pending",  value: "1" },
      { label: "Draft",    value: "0" },
    ],
    badges: [
      { text: "PRJ-2026-001 · METFORMIN BE STUDY · approved", tag: "approved" },
      { text: "PRJ-2026-003 · COMBO BE STUDY · pending",      tag: "pending" },
    ],
  },
  {
    key: "projects",
    title: "Projects",
    icon: ClipboardList,
    path: "/projects",
    accent: "var(--accent)",
    accentBg: "var(--accent-light)",
    description: "Manage study protocols, subject enrolment, and study timelines.",
    stats: [
      { label: "Active",    value: "4" },
      { label: "Completed", value: "3" },
      { label: "On Hold",   value: "1" },
    ],
    badges: [
      { text: "SID-2026-001 · Dosing Day 2", tag: "in use" },
      { text: "SID-2026-003 · Screening",    tag: "pending" },
    ],
  },
  {
    key: "collection",
    title: "Sample Collection",
    icon: Syringe,
    path: "/collection",
    accent: "var(--status-info)",
    accentBg: "var(--status-info-bg)",
    description: "Real-time sample collection tracking, deviation logging, and subject schedules.",
    stats: [
      { label: "Today",    value: "18" },
      { label: "Complete", value: "14" },
      { label: "Missed",   value: "0" },
    ],
    badges: [
      { text: "007 · Period 1 · 4H due 11:30", tag: "pending" },
      { text: "012 · Period 2 · 2H — collected", tag: "approved" },
    ],
  },
  {
    key: "cpma",
    title: "CPMA Processing",
    icon: FlaskConical,
    path: "/cpma",
    accent: "#7B5EA7",
    accentBg: "#F3EEF9",
    description: "Centrifugation, plasma aliquoting, labelling, and transfer to Freezer Room.",
    stats: [
      { label: "Queued",  value: "6" },
      { label: "Done",    value: "42" },
      { label: "Issues",  value: "1" },
    ],
    badges: [
      { text: "Batch CPM-007-P1 · awaiting spin", tag: "pending" },
      { text: "Batch CPM-006-P2 · transferred",   tag: "approved" },
    ],
  },
];

const ALERTS = [
  { level: "warn", text: "Subject 007: 4H collection window closes at 11:30 — 22 minutes remaining" },
  { level: "warn", text: "CPMA batch CPM-005-P2: centrifuge temp deviation logged — review required" },
  { level: "info", text: "SID-2026-003 screening visit confirmed — 8 subjects scheduled for Monday" },
  { level: "pass", text: "All Period 1 Day 1 collections complete for SID-2026-001" },
];

const RECENT = [
  { time: "10:04", user: "T. Okafor", action: "Subject 014 / P2 / 2H collected — haemolysis grade 1 noted",    tag: "pending" },
  { time: "09:48", user: "R. Patel",  action: "CPMA batch CPM-007-P1 received — 6 tubes, centrifuge started",  tag: "in use" },
  { time: "09:12", user: "T. Okafor", action: "Subject 012 / P2 / 2H collected and sent to CPMA",              tag: "approved" },
  { time: "08:55", user: "N. Sharma", action: "SID-2026-001 dosing confirmed — all 18 subjects dosed",          tag: "approved" },
  { time: "08:30", user: "R. Patel",  action: "Pre-dose samples (0H) collected for all Period 1 subjects",       tag: "approved" },
];

export default function ClinicalPage() {
  const router = useRouter();

  return (
    <AppLayout>
      <div className="page-container">

        {/* Header */}
        <div className="mb-8">
          <h1 className="section-title" style={{ marginBottom: 4 }}>Clinical</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Study management, subject sample collection, and CPMA processing · SID-2026-001 active
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

        {/* Section cards */}
        <div className="grid grid-cols-2 gap-5 mb-8">
          {SECTIONS.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.key}
                onClick={() => router.push(m.path)}
                className="rounded-xl cursor-pointer transition-all duration-150"
                style={{ background: "white", border: "1px solid var(--border)", overflow: "hidden" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
              >
                <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: m.accentBg, color: m.accent }}>
                      <Icon size={20} />
                    </div>
                    <ArrowRight size={15} style={{ color: "var(--text-muted)" }} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, fontFamily: "DM Serif Display, serif", marginBottom: 4 }}>
                    {m.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {m.description}
                  </div>
                </div>

                <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
                  {m.stats.map((st, i) => (
                    <div key={st.label} className="flex-1 px-4 py-3 text-center"
                      style={{ borderRight: i < m.stats.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "DM Serif Display, serif", color: m.accent }}>
                        {st.value}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>
                        {st.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-5 py-3">
                  {m.badges.map((b, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5"
                      style={{ borderBottom: i < m.badges.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{b.text}</span>
                      <StatusTag status={b.tag} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
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
                  <div style={{ fontSize: 10, color: "var(--text-muted)", paddingTop: 2, minWidth: 40, textAlign: "right", flexShrink: 0 }}>
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
