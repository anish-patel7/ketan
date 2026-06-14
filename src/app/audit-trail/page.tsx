"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatusTag from "@/components/ui/StatusTag";
import { Input, Select, Table, DatePicker, Tag } from "antd";
import { Search, ShieldCheck, UserPlus, Edit2, Lock, Unlock, KeyRound, Eye } from "lucide-react";

const { Option } = Select;

type AuditEntry = {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  category: "user_created" | "role_changed" | "rights_changed" | "login" | "locked" | "unlocked" | "password_reset";
  target: string;
  detail: string;
  ip: string;
  outcome: "success" | "failed" | "pending";
};

const AUDIT: AuditEntry[] = [
  {
    id: "AUD-0042", timestamp: "18 Apr 2026 · 09:41:12", actor: "J. Chen", actorRole: "Project Leader",
    action: "User Created", category: "user_created", target: "L. Park (USR-008)",
    detail: "New BA Analyst account created; role assigned: BA Analyst; department: BA-Lab. Pending activation email sent.",
    ip: "192.168.1.45", outcome: "success",
  },
  {
    id: "AUD-0041", timestamp: "18 Apr 2026 · 09:39:05", actor: "J. Chen", actorRole: "Project Leader",
    action: "Rights Modified", category: "rights_changed", target: "R. Patel (USR-005)",
    detail: "Added right: 'Distribution Sheet'. Removed right: none. Previous rights: Freezer Room, Project Setup, LC-MS/MS, Column Management.",
    ip: "192.168.1.45", outcome: "success",
  },
  {
    id: "AUD-0040", timestamp: "17 Apr 2026 · 16:22:48", actor: "S. Mehta", actorRole: "QA Officer",
    action: "Account Disabled", category: "locked", target: "K. Williams (USR-007)",
    detail: "Account deactivated — user on extended leave. Access to all modules suspended.",
    ip: "192.168.1.31", outcome: "success",
  },
  {
    id: "AUD-0039", timestamp: "17 Apr 2026 · 14:10:33", actor: "S. Mehta", actorRole: "QA Officer",
    action: "Role Changed", category: "role_changed", target: "T. Okafor (USR-002)",
    detail: "Role changed from 'Nurse' to 'Clinical Coordinator'. Rights updated accordingly. Previous rights archived.",
    ip: "192.168.1.31", outcome: "success",
  },
  {
    id: "AUD-0038", timestamp: "16 Apr 2026 · 11:05:19", actor: "System Admin", actorRole: "Admin",
    action: "Password Reset", category: "password_reset", target: "N. Sharma (USR-006)",
    detail: "Admin-initiated password reset. Temporary password issued. User required to change on next login.",
    ip: "10.0.0.1", outcome: "success",
  },
  {
    id: "AUD-0037", timestamp: "15 Apr 2026 · 08:30:04", actor: "S. Mehta", actorRole: "QA Officer",
    action: "User Created", category: "user_created", target: "N. Sharma (USR-006)",
    detail: "New Clinical Coordinator account created; department: Clinical. Rights: Sample Collection, CPMA Processing, Projects (view), Collection Reports.",
    ip: "192.168.1.31", outcome: "success",
  },
  {
    id: "AUD-0036", timestamp: "14 Apr 2026 · 17:44:52", actor: "S. Mehta", actorRole: "QA Officer",
    action: "Rights Modified", category: "rights_changed", target: "A. Liang (USR-001)",
    detail: "Added right: 'Distribution Sheet'. Rationale recorded: study SID-2026-001 phase transition — analyst now required to prepare distribution sheets.",
    ip: "192.168.1.31", outcome: "success",
  },
  {
    id: "AUD-0035", timestamp: "10 Apr 2026 · 09:11:00", actor: "J. Chen", actorRole: "Project Leader",
    action: "Account Re-enabled", category: "unlocked", target: "K. Williams (USR-007)",
    detail: "Account reinstated after leave. All previous rights restored.",
    ip: "192.168.1.45", outcome: "success",
  },
  {
    id: "AUD-0034", timestamp: "20 Jan 2026 · 14:00:00", actor: "J. Chen", actorRole: "Project Leader",
    action: "User Created", category: "user_created", target: "R. Patel (USR-005)",
    detail: "New BA Analyst created. Department: BA-Lab. Rights: Freezer Room, Project Setup, LC-MS/MS, Column Management.",
    ip: "192.168.1.45", outcome: "success",
  },
  {
    id: "AUD-0033", timestamp: "12 Jan 2026 · 09:00:00", actor: "J. Chen", actorRole: "Project Leader",
    action: "User Created", category: "user_created", target: "A. Liang (USR-001)",
    detail: "Initial system setup. BA Analyst account created. Department: BA-Lab.",
    ip: "192.168.1.45", outcome: "success",
  },
];

const CATEGORY_META: Record<AuditEntry["category"], { icon: typeof UserPlus; color: string; label: string }> = {
  user_created:   { icon: UserPlus,    color: "var(--status-pass)",  label: "User Created" },
  role_changed:   { icon: KeyRound,    color: "#7B5EA7",             label: "Role Changed" },
  rights_changed: { icon: ShieldCheck, color: "var(--status-info)",  label: "Rights Modified" },
  login:          { icon: Eye,         color: "var(--text-muted)",   label: "Login" },
  locked:         { icon: Lock,        color: "var(--status-fail)",  label: "Account Disabled" },
  unlocked:       { icon: Unlock,      color: "var(--status-pass)",  label: "Account Enabled" },
  password_reset: { icon: Edit2,       color: "var(--status-warn)",  label: "Password Reset" },
};

export default function AuditTrailPage() {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string | undefined>();

  const filtered = AUDIT.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !search || a.actor.toLowerCase().includes(q) || a.target.toLowerCase().includes(q) || a.action.toLowerCase().includes(q);
    const matchCat = !filterCat || a.category === filterCat;
    return matchSearch && matchCat;
  });

  const columns = [
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 190,
      render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-secondary)" }}>{v}</span>,
    },
    {
      title: "Event",
      key: "event",
      width: 160,
      render: (_: unknown, a: AuditEntry) => {
        const meta = CATEGORY_META[a.category];
        const Icon = meta.icon;
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: `${meta.color}18`, color: meta.color }}>
              <Icon size={12} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: meta.color }}>{a.action}</span>
          </div>
        );
      },
    },
    {
      title: "Actor",
      key: "actor",
      width: 160,
      render: (_: unknown, a: AuditEntry) => (
        <div>
          <div style={{ fontSize: 12, fontWeight: 500 }}>{a.actor}</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{a.actorRole}</div>
        </div>
      ),
    },
    {
      title: "Target",
      dataIndex: "target",
      key: "target",
      width: 180,
      render: (v: string) => <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--accent)" }}>{v}</span>,
    },
    {
      title: "Detail",
      dataIndex: "detail",
      key: "detail",
      render: (v: string) => <span style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5 }}>{v}</span>,
    },
    {
      title: "IP",
      dataIndex: "ip",
      key: "ip",
      width: 110,
      render: (v: string) => <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-muted)" }}>{v}</span>,
    },
    {
      title: "Outcome",
      dataIndex: "outcome",
      key: "outcome",
      width: 90,
      render: (v: string) => <StatusTag status={v} />,
    },
  ];

  const categoryCounts = Object.fromEntries(
    (Object.keys(CATEGORY_META) as AuditEntry["category"][]).map(k => [
      k,
      AUDIT.filter(a => a.category === k).length,
    ])
  );

  return (
    <AppLayout>
      <div className="page-container">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="section-title">Audit Trail</h1>
            <p className="section-subtitle">
              Immutable log of all user creation events, role assignments, and access right modifications
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", fontSize: 12, color: "var(--text-secondary)" }}>
            <ShieldCheck size={14} style={{ color: "var(--status-pass)" }} />
            {AUDIT.length} events recorded
          </div>
        </div>

        {/* Category summary strip */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {(["user_created", "role_changed", "rights_changed", "locked", "unlocked", "password_reset"] as AuditEntry["category"][]).map(cat => {
            const meta = CATEGORY_META[cat];
            const Icon = meta.icon;
            return (
              <div key={cat}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer"
                style={{
                  background: filterCat === cat ? `${meta.color}18` : "white",
                  border: `1px solid ${filterCat === cat ? meta.color : "var(--border)"}`,
                }}
                onClick={() => setFilterCat(filterCat === cat ? undefined : cat)}>
                <Icon size={13} style={{ color: meta.color }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: meta.color }}>{meta.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "DM Serif Display, serif", color: "var(--text-primary)", marginLeft: 2 }}>
                  {categoryCounts[cat]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <Input
            prefix={<Search size={13} style={{ color: "var(--text-muted)" }} />}
            placeholder="Search by actor, target, or event…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 320 }}
          />
          <Select placeholder="Event type" style={{ width: 180 }} allowClear
            value={filterCat} onChange={setFilterCat}>
            <Option value="user_created">User Created</Option>
            <Option value="role_changed">Role Changed</Option>
            <Option value="rights_changed">Rights Modified</Option>
            <Option value="locked">Account Disabled</Option>
            <Option value="unlocked">Account Enabled</Option>
            <Option value="password_reset">Password Reset</Option>
          </Select>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "white" }}>
          <Table
            dataSource={filtered}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            expandable={{
              expandedRowRender: (a: AuditEntry) => (
                <div className="px-4 py-3" style={{ background: "var(--bg-card)", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                  <strong>Full detail:</strong> {a.detail}
                  <span style={{ marginLeft: 16, fontSize: 11, color: "var(--text-muted)" }}>
                    Event ID: {a.id} · IP: {a.ip}
                  </span>
                </div>
              ),
            }}
          />
        </div>
      </div>
    </AppLayout>
  );
}
