"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatusTag from "@/components/ui/StatusTag";
import UtilBar from "@/components/ui/UtilBar";
import { Button, Input, Select, Table, Tabs, Modal, Form, DatePicker } from "antd";
import { Plus, Search, Download, Filter, ScanLine, RotateCcw, BookmarkPlus, FileText } from "lucide-react";

const { Option } = Select;

const COLUMNS_DATA = [
  { id: "260001", name: "Kinetex C18 100A",    part: "00B-4462-AN", type: "C18",   dims: "50×2.1mm 1.7µm", brand: "Phenomenex",  lot: "L-2024-001", received: "2026-01-10", maxInj: 500, usedInj: 420, status: "Issued",    project: "SID-2026-001", location: "CAB-01/S1/P3" },
  { id: "260002", name: "Kinetex C18 100A",    part: "00B-4462-AN", type: "C18",   dims: "50×2.1mm 1.7µm", brand: "Phenomenex",  lot: "L-2024-001", received: "2026-01-10", maxInj: 500, usedInj: 120, status: "Available",  project: "—",            location: "CAB-01/S1/P4" },
  { id: "260003", name: "Acquity HSS T3",      part: "186003539",   type: "C18",   dims: "50×2.1mm 1.8µm", brand: "Waters",      lot: "W-2025-041", received: "2026-02-03", maxInj: 400, usedInj: 400, status: "Retired",   project: "—",            location: "—" },
  { id: "260004", name: "Zorbax RRHD Eclipse", part: "959759-902",  type: "C18",   dims: "50×2.1mm 1.8µm", brand: "Agilent",     lot: "A-2025-112", received: "2026-02-14", maxInj: 600, usedInj: 60,  status: "Reserved",  project: "SID-2026-003", location: "CAB-01/S2/P1" },
  { id: "260005", name: "Hypersil GOLD",       part: "25002-052130", type: "C18",  dims: "50×2.1mm 1.9µm", brand: "Thermo",      lot: "T-2024-078", received: "2026-03-01", maxInj: 500, usedInj: 0,   status: "Available",  project: "—",            location: "CAB-01/S2/P2" },
  { id: "260006", name: "Kinetex Phenyl-Hexyl",part: "00B-4287-AN", type: "Phenyl",dims: "100×2.1mm 2.6µm",brand: "Phenomenex",  lot: "L-2025-088", received: "2026-03-15", maxInj: 300, usedInj: 240, status: "Issued",    project: "SID-2026-002", location: "CAB-02/S1/P1" },
];

const STAT_CARDS = [
  { label: "Total",     value: "6",  color: "var(--text-secondary)" },
  { label: "Available", value: "2",  color: "var(--status-pass)" },
  { label: "Reserved",  value: "1",  color: "var(--status-info)" },
  { label: "Issued",    value: "2",  color: "var(--status-warn)" },
  { label: "Retired",   value: "1",  color: "var(--status-fail)" },
];

const tableColumns = [
  {
    title: "Column ID", dataIndex: "id", key: "id",
    render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>{v}</span>
  },
  { title: "Name", dataIndex: "name", key: "name", render: (v: string) => <span style={{ fontSize: 13 }}>{v}</span> },
  { title: "Part Number", dataIndex: "part", key: "part", render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-secondary)" }}>{v}</span> },
  { title: "Type", dataIndex: "type", key: "type" },
  { title: "Dimensions", dataIndex: "dims", key: "dims", render: (v: string) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{v}</span> },
  { title: "Brand", dataIndex: "brand", key: "brand" },
  {
    title: "Utilisation", key: "util",
    render: (_: unknown, r: typeof COLUMNS_DATA[0]) => (
      <div style={{ minWidth: 120 }}>
        <UtilBar pct={Math.round((r.usedInj / r.maxInj) * 100)} />
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{r.usedInj} / {r.maxInj} inj</div>
      </div>
    )
  },
  {
    title: "Status", dataIndex: "status", key: "status",
    render: (v: string) => <StatusTag status={v.toLowerCase()} />
  },
  {
    title: "Project", dataIndex: "project", key: "project",
    render: (v: string) => <span style={{ fontSize: 12, color: v === "—" ? "var(--text-muted)" : "var(--text-primary)" }}>{v}</span>
  },
  { title: "Location", dataIndex: "location", key: "location", render: (v: string) => <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-secondary)" }}>{v}</span> },
  {
    title: "", key: "actions",
    render: (_: unknown, r: typeof COLUMNS_DATA[0]) => (
      <div className="flex gap-1">
        {r.status === "Available" && (
          <button className="text-xs px-2 py-1 rounded" style={{ background: "var(--accent-light)", color: "var(--accent)", fontWeight: 600 }}>Issue</button>
        )}
        {r.status === "Available" && (
          <button className="text-xs px-2 py-1 rounded" style={{ background: "var(--status-info-bg)", color: "var(--status-info)", fontWeight: 600 }}>Reserve</button>
        )}
        {r.status === "Issued" && (
          <button className="text-xs px-2 py-1 rounded" style={{ background: "var(--status-warn-bg)", color: "var(--status-warn)", fontWeight: 600 }}>Return</button>
        )}
      </div>
    )
  },
];

export default function ColumnsPage() {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = COLUMNS_DATA.filter(c =>
    c.id.includes(search) || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.part.includes(search) || c.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="page-container">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="section-title">Column Management</h1>
            <p className="section-subtitle">Track inventory, issuance, reservations, and returns for all HPLC columns</p>
          </div>
          <div className="flex gap-2">
            <Button icon={<Download size={14} />} style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              Export
            </Button>
            <Button type="primary" icon={<Plus size={14} />} onClick={() => setRegisterOpen(true)}>
              Register Column
            </Button>
          </div>
        </div>

        {/* Stat chips */}
        <div className="flex gap-3 mb-6">
          {STAT_CARDS.map(s => (
            <div key={s.label} className="flex items-center gap-2 rounded-lg px-4 py-2.5"
              style={{ background: "white", border: "1px solid var(--border)" }}>
              <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "DM Serif Display, serif", color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <Input
            prefix={<Search size={13} style={{ color: "var(--text-muted)" }} />}
            placeholder="Search by Column ID, part number, name or status…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 360 }}
          />
          <Select placeholder="Column Type" style={{ width: 140 }} allowClear>
            <Option value="C18">C18</Option>
            <Option value="Phenyl">Phenyl</Option>
            <Option value="HILIC">HILIC</Option>
            <Option value="C8">C8</Option>
          </Select>
          <Select placeholder="Status" style={{ width: 130 }} allowClear>
            <Option value="available">Available</Option>
            <Option value="reserved">Reserved</Option>
            <Option value="issued">Issued</Option>
            <Option value="retired">Retired</Option>
          </Select>
          <Select placeholder="Brand" style={{ width: 150 }} allowClear>
            <Option value="phenomenex">Phenomenex</Option>
            <Option value="waters">Waters</Option>
            <Option value="agilent">Agilent</Option>
            <Option value="thermo">Thermo</Option>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "white" }}>
          <Table
            dataSource={filtered}
            columns={tableColumns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: false }}
          />
        </div>

        {/* Register Modal */}
        <Modal
          title={<span style={{ fontFamily: "DM Serif Display, serif", fontSize: 18 }}>Register New Column</span>}
          open={registerOpen}
          onCancel={() => setRegisterOpen(false)}
          footer={null}
          width={580}
        >
          <Form layout="vertical" style={{ marginTop: 16 }}>
            <div className="grid grid-cols-2 gap-x-4">
              <Form.Item label="Part Number (APS Reference)" required>
                <Input placeholder="e.g. 00B-4462-AN" />
              </Form.Item>
              <Form.Item label="Brand / Manufacturer" required>
                <Select placeholder="Select brand">
                  <Option value="phenomenex">Phenomenex</Option>
                  <Option value="waters">Waters</Option>
                  <Option value="agilent">Agilent</Option>
                  <Option value="thermo">Thermo Fisher</Option>
                  <Option value="merck">Merck</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Column Name / Description" required style={{ gridColumn: "span 2" }}>
                <Input placeholder="e.g. Kinetex C18 100A" />
              </Form.Item>
              <Form.Item label="Column Type" required>
                <Select placeholder="Select type">
                  <Option value="C18">C18</Option>
                  <Option value="C8">C8</Option>
                  <Option value="Phenyl">Phenyl</Option>
                  <Option value="HILIC">HILIC</Option>
                  <Option value="Mixed-Mode">Mixed-Mode</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Lot / Batch Number" required>
                <Input placeholder="From column packaging" />
              </Form.Item>
              <Form.Item label="Length (mm)">
                <Input placeholder="e.g. 50" type="number" />
              </Form.Item>
              <Form.Item label="Internal Diameter (mm)">
                <Input placeholder="e.g. 2.1" type="number" />
              </Form.Item>
              <Form.Item label="Particle Size (µm)">
                <Input placeholder="e.g. 1.7" type="number" />
              </Form.Item>
              <Form.Item label="Pore Size (Å)">
                <Input placeholder="e.g. 100" type="number" />
              </Form.Item>
              <Form.Item label="Max Injection Limit" required>
                <Input placeholder="e.g. 500" type="number" suffix="injections" />
              </Form.Item>
              <Form.Item label="Received Date" required>
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="Storage Location" style={{ gridColumn: "span 2" }}>
                <Input placeholder="e.g. COL-CAB-01 / Shelf-2 / Slot-04" />
              </Form.Item>
            </div>

            {/* Document upload zone */}
            <div style={{ border: "1.5px dashed var(--border-strong)", borderRadius: 8, padding: "16px 20px", background: "var(--bg-card)", marginBottom: 16 }}>
              <div className="block-label">Documents (Required)</div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium"
                  style={{ border: "1px solid var(--border)", background: "white", color: "var(--text-secondary)" }}>
                  <FileText size={13} /> Upload CoA
                </button>
                <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium"
                  style={{ border: "1px solid var(--border)", background: "white", color: "var(--text-secondary)" }}>
                  <FileText size={13} /> Upload Invoice
                </button>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
                CoA and Invoice are mandatory. Column ID will be auto-generated on save: <strong>260007</strong>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={() => setRegisterOpen(false)}>Cancel</Button>
              <Button type="primary" icon={<Plus size={13} />}>Register Column</Button>
            </div>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
}
