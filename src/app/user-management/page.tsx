"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatusTag from "@/components/ui/StatusTag";
import { Input, Select, Table, Button, Modal, Tag } from "antd";
import { Search, UserPlus, ShieldCheck, Users, UserCheck, UserX, Edit2, Lock } from "lucide-react";

const { Option } = Select;

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: "Clinical" | "BA-Lab" | "QA" | "Admin";
  status: "active" | "inactive" | "pending";
  lastLogin: string;
  rights: string[];
  createdBy: string;
  createdAt: string;
};

const ROLE_RIGHTS: Record<string, string[]> = {
  "Clinical Coordinator": ["Sample Collection", "CPMA Processing", "Projects (view)", "Collection Reports"],
  "BA Analyst":           ["Freezer Room", "Project Setup", "Distribution Sheet", "LC-MS/MS", "Column Management"],
  "Project Leader":       ["All Modules (read/write)", "Run Acceptance", "Distribution Approval", "Reports"],
  "QA Officer":           ["Mastersheet Approval", "Distribution Approval", "Audit Trail", "User Management (view)", "Reports"],
  "System Admin":         ["All Modules", "User Management", "Audit Trail", "System Config", "Role Management"],
  "Instruments Officer":  ["Instruments", "Column Management", "Calibration Records"],
};

const USERS: User[] = [
  {
    id: "USR-001", name: "A. Liang",    email: "a.liang@pharma.com",    role: "BA Analyst",
    department: "BA-Lab",   status: "active",   lastLogin: "Today 09:41",
    rights: ROLE_RIGHTS["BA Analyst"], createdBy: "J. Chen", createdAt: "12 Jan 2026",
  },
  {
    id: "USR-002", name: "T. Okafor",   email: "t.okafor@pharma.com",   role: "Clinical Coordinator",
    department: "Clinical", status: "active",   lastLogin: "Today 10:04",
    rights: ROLE_RIGHTS["Clinical Coordinator"], createdBy: "J. Chen", createdAt: "12 Jan 2026",
  },
  {
    id: "USR-003", name: "J. Chen",     email: "j.chen@pharma.com",     role: "Project Leader",
    department: "BA-Lab",   status: "active",   lastLogin: "Today 08:30",
    rights: ROLE_RIGHTS["Project Leader"], createdBy: "S. Mehta", createdAt: "05 Oct 2025",
  },
  {
    id: "USR-004", name: "S. Mehta",    email: "s.mehta@pharma.com",    role: "QA Officer",
    department: "QA",       status: "active",   lastLogin: "Today 08:55",
    rights: ROLE_RIGHTS["QA Officer"], createdBy: "System Admin", createdAt: "01 Sep 2025",
  },
  {
    id: "USR-005", name: "R. Patel",    email: "r.patel@pharma.com",    role: "BA Analyst",
    department: "BA-Lab",   status: "active",   lastLogin: "Today 09:12",
    rights: ROLE_RIGHTS["BA Analyst"], createdBy: "J. Chen", createdAt: "20 Jan 2026",
  },
  {
    id: "USR-006", name: "N. Sharma",   email: "n.sharma@pharma.com",   role: "Clinical Coordinator",
    department: "Clinical", status: "active",   lastLogin: "Today 08:30",
    rights: ROLE_RIGHTS["Clinical Coordinator"], createdBy: "J. Chen", createdAt: "20 Jan 2026",
  },
  {
    id: "USR-007", name: "K. Williams", email: "k.williams@pharma.com", role: "Instruments Officer",
    department: "BA-Lab",   status: "inactive", lastLogin: "10 Apr 2026",
    rights: ROLE_RIGHTS["Instruments Officer"], createdBy: "S. Mehta", createdAt: "14 Feb 2026",
  },
  {
    id: "USR-008", name: "L. Park",     email: "l.park@pharma.com",     role: "BA Analyst",
    department: "BA-Lab",   status: "pending",  lastLogin: "Never",
    rights: ROLE_RIGHTS["BA Analyst"], createdBy: "J. Chen", createdAt: "17 Apr 2026",
  },
];

const DEPT_COLOR: Record<string, string> = {
  "Clinical": "var(--status-info)",
  "BA-Lab":   "var(--accent)",
  "QA":       "#7B5EA7",
  "Admin":    "var(--status-warn)",
};

export default function UserManagementPage() {
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filtered = USERS.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !search || u.name.toLowerCase().includes(q) || u.email.includes(q) || u.role.toLowerCase().includes(q);
    const matchDept   = !filterDept   || u.department === filterDept;
    const matchStatus = !filterStatus || u.status === filterStatus;
    return matchSearch && matchDept && matchStatus;
  });

  const counts = {
    total:    USERS.length,
    active:   USERS.filter(u => u.status === "active").length,
    inactive: USERS.filter(u => u.status === "inactive").length,
    pending:  USERS.filter(u => u.status === "pending").length,
  };

  const columns = [
    {
      title: "User",
      key: "user",
      render: (_: unknown, u: User) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: `${DEPT_COLOR[u.department]}20`, color: DEPT_COLOR[u.department], fontSize: 11, fontWeight: 700 }}>
            {u.name.split(" ").map(p => p[0]).join("").slice(0, 2)}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (v: string) => <span style={{ fontSize: 12, fontWeight: 500 }}>{v}</span>,
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (v: string) => (
        <span style={{ fontSize: 11, fontWeight: 600, color: DEPT_COLOR[v], background: `${DEPT_COLOR[v]}18`,
          padding: "2px 8px", borderRadius: 4 }}>
          {v}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v: string) => <StatusTag status={v} />,
    },
    {
      title: "Last Login",
      dataIndex: "lastLogin",
      key: "lastLogin",
      render: (v: string) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{v}</span>,
    },
    {
      title: "Created By",
      key: "created",
      render: (_: unknown, u: User) => (
        <div>
          <div style={{ fontSize: 12 }}>{u.createdBy}</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{u.createdAt}</div>
        </div>
      ),
    },
    {
      title: "",
      key: "actions",
      render: (_: unknown, u: User) => (
        <div className="flex gap-2">
          <Button size="small" icon={<Edit2 size={12} />}
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)", fontSize: 11 }}
            onClick={() => setSelectedUser(u)}>
            Rights
          </Button>
          <Button size="small" icon={<Lock size={12} />}
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)", fontSize: 11 }}>
            {u.status === "active" ? "Disable" : "Enable"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="page-container">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="section-title">User Management</h1>
            <p className="section-subtitle">Role assignment, module access rights, and user account control</p>
          </div>
          <Button type="primary" icon={<UserPlus size={14} />}>
            Add User
          </Button>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Users",    value: counts.total,    icon: Users,      color: "var(--accent)" },
            { label: "Active",         value: counts.active,   icon: UserCheck,  color: "var(--status-pass)" },
            { label: "Inactive",       value: counts.inactive, icon: UserX,      color: "var(--text-muted)" },
            { label: "Pending Activation", value: counts.pending, icon: ShieldCheck, color: "var(--status-warn)" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="stat-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: `${s.color}20`, color: s.color }}>
                    <Icon size={17} />
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 600, fontFamily: "DM Serif Display, serif" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <Input
            prefix={<Search size={13} style={{ color: "var(--text-muted)" }} />}
            placeholder="Search by name, email, or role…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 300 }}
          />
          <Select placeholder="Department" style={{ width: 160 }} allowClear onChange={setFilterDept}>
            <Option value="Clinical">Clinical</Option>
            <Option value="BA-Lab">BA-Lab</Option>
            <Option value="QA">QA</Option>
            <Option value="Admin">Admin</Option>
          </Select>
          <Select placeholder="Status" style={{ width: 140 }} allowClear onChange={setFilterStatus}>
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
            <Option value="pending">Pending</Option>
          </Select>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "white" }}>
          <Table
            dataSource={filtered}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: false }}
          />
        </div>

        {/* Rights detail modal */}
        <Modal
          title={
            <span style={{ fontFamily: "DM Serif Display, serif", fontSize: 18 }}>
              Access Rights — {selectedUser?.name}
            </span>
          }
          open={!!selectedUser}
          onCancel={() => setSelectedUser(null)}
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setSelectedUser(null)}>Cancel</Button>
              <Button type="primary" icon={<ShieldCheck size={13} />}>Save Rights</Button>
            </div>
          }
          width={520}
        >
          {selectedUser && (
            <div style={{ padding: "12px 0" }}>
              <div className="flex items-center gap-3 mb-5 p-3 rounded-lg"
                style={{ background: "var(--bg-card)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: `${DEPT_COLOR[selectedUser.department]}20`, color: DEPT_COLOR[selectedUser.department], fontWeight: 700 }}>
                  {selectedUser.name.split(" ").map(p => p[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{selectedUser.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{selectedUser.role} · {selectedUser.department}</div>
                </div>
                <StatusTag status={selectedUser.status} />
              </div>

              <div className="block-label" style={{ marginBottom: 8 }}>Assigned Rights</div>
              <div className="flex flex-wrap gap-2 mb-5">
                {selectedUser.rights.map(r => (
                  <Tag key={r} style={{ background: "var(--accent-light)", color: "var(--accent)", border: "none", fontSize: 11, fontWeight: 500 }}>
                    {r}
                  </Tag>
                ))}
              </div>

              <div className="block-label" style={{ marginBottom: 8 }}>Account Info</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 2 }}>
                <div><span style={{ color: "var(--text-muted)" }}>User ID:</span> {selectedUser.id}</div>
                <div><span style={{ color: "var(--text-muted)" }}>Created by:</span> {selectedUser.createdBy} on {selectedUser.createdAt}</div>
                <div><span style={{ color: "var(--text-muted)" }}>Last login:</span> {selectedUser.lastLogin}</div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
}
