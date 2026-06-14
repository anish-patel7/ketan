"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatusTag from "@/components/ui/StatusTag";
import { Input, Select, Table, Tabs, Button, Badge } from "antd";
import { Search, Thermometer, ScanLine, AlertTriangle, Snowflake } from "lucide-react";

const { Option } = Select;

const FREEZERS = [
  { id: "FRZ-01", name: "Freezer 1 (−70°C)", temp: "−71.2°C", status: "Normal",  capacity: 480, used: 312 },
  { id: "FRZ-02", name: "Freezer 2 (−70°C)", temp: "−69.8°C", status: "Normal",  capacity: 480, used: 198 },
  { id: "FRZ-03", name: "Freezer 3 (−20°C)", temp: "−19.4°C", status: "Normal",  capacity: 320, used: 87  },
  { id: "FRZ-04", name: "Fridge 1 (2–8°C)",  temp: "4.1°C",   status: "Warning", capacity: 200, used: 44  },
];

const SAMPLES = [
  { id: "SID-2026-001-007-P1-0H-MET-1",   project: "SID-2026-001", analyte: "Metformin",   subject: "007", period: "P1", tp: "0H",   freezer: "FRZ-01", location: "R2-B4-P12", status: "available", ft: 0, extId: "" },
  { id: "SID-2026-001-007-P1-0.5H-MET-1", project: "SID-2026-001", analyte: "Metformin",   subject: "007", period: "P1", tp: "0.5H", freezer: "FRZ-01", location: "R2-B4-P13", status: "available", ft: 0, extId: "" },
  { id: "SID-2026-001-007-P1-1H-MET-1",   project: "SID-2026-001", analyte: "Metformin",   subject: "007", period: "P1", tp: "1H",   freezer: "FRZ-01", location: "R2-B4-P14", status: "reserved",  ft: 1, extId: "" },
  { id: "SID-2026-001-007-P1-2H-MET-1",   project: "SID-2026-001", analyte: "Metformin",   subject: "007", period: "P1", tp: "2H",   freezer: "FRZ-01", location: "R2-B4-P15", status: "retrieved", ft: 2, extId: "" },
  { id: "SID-2026-001-008-P1-0H-MET-1",   project: "SID-2026-001", analyte: "Metformin",   subject: "008", period: "P1", tp: "0H",   freezer: "FRZ-01", location: "R2-B5-P01", status: "available", ft: 0, extId: "" },
  { id: "SID-2026-001-007-P1-0H-SIT-1",   project: "SID-2026-001", analyte: "Sitagliptin", subject: "007", period: "P1", tp: "0H",   freezer: "FRZ-02", location: "R1-B2-P04", status: "available", ft: 0, extId: "" },
  { id: "EXT-001-S01-P1-1H-MET-1",        project: "SID-2026-002", analyte: "Metformin",   subject: "S01", period: "P1", tp: "1H",   freezer: "FRZ-01", location: "R3-B1-P01", status: "available", ft: 0, extId: "EXT-CRO-2026-001-S01-T3" },
  { id: "EXT-001-S01-P1-2H-MET-1",        project: "SID-2026-002", analyte: "Metformin",   subject: "S01", period: "P1", tp: "2H",   freezer: "FRZ-01", location: "R3-B1-P02", status: "excluded",  ft: 0, extId: "EXT-CRO-2026-001-S01-T4" },
];

const sampleColumns = [
  { title: "Sample ID",  dataIndex: "id",      key: "id",      render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--accent)" }}>{v}</span> },
  { title: "Project",    dataIndex: "project",  key: "project", render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span> },
  { title: "Analyte",    dataIndex: "analyte",  key: "analyte" },
  { title: "Subject",    dataIndex: "subject",  key: "subject", render: (v: string) => <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{v}</span> },
  { title: "Period",     dataIndex: "period",   key: "period" },
  { title: "Time Point", dataIndex: "tp",       key: "tp",      render: (v: string) => <span style={{ fontFamily: "monospace" }}>{v}</span> },
  { title: "Freezer",    dataIndex: "freezer",  key: "freezer", render: (v: string) => <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--status-info)" }}>{v}</span> },
  { title: "Location",   dataIndex: "location", key: "location", render: (v: string) => <span style={{ fontSize: 11, fontFamily: "monospace" }}>{v}</span> },
  {
    title: "F/T Cycles", dataIndex: "ft", key: "ft",
    render: (v: number) => (
      <span style={{ fontSize: 12, color: v >= 3 ? "var(--status-fail)" : v >= 2 ? "var(--status-warn)" : "var(--text-secondary)", fontWeight: v >= 2 ? 600 : 400 }}>
        {v} {v >= 3 ? "⚠" : ""}
      </span>
    )
  },
  {
    title: "Ext. CRO ID", dataIndex: "extId", key: "extId",
    render: (v: string) => v ? <span style={{ fontFamily: "monospace", fontSize: 10, color: "var(--text-muted)" }}>{v}</span> : <span style={{ color: "var(--text-muted)", fontSize: 11 }}>—</span>
  },
  {
    title: "Status", dataIndex: "status", key: "status",
    render: (v: string) => <StatusTag status={v} />
  },
];

export default function FreezerPage() {
  const [search, setSearch] = useState("");
  const [filterAnalyte, setFilterAnalyte] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  const filtered = SAMPLES.filter(s => {
    const matchSearch = !search || s.id.toLowerCase().includes(search.toLowerCase()) || s.subject.includes(search);
    const matchAnalyte = !filterAnalyte || s.analyte === filterAnalyte;
    const matchStatus = !filterStatus || s.status === filterStatus;
    return matchSearch && matchAnalyte && matchStatus;
  });

  const statusCounts = {
    available: SAMPLES.filter(s => s.status === "available").length,
    reserved:  SAMPLES.filter(s => s.status === "reserved").length,
    retrieved: SAMPLES.filter(s => s.status === "retrieved").length,
    excluded:  SAMPLES.filter(s => s.status === "excluded").length,
  };

  return (
    <AppLayout>
      <div className="page-container">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="section-title">Freezer Room</h1>
            <p className="section-subtitle">Subject sample inventory, receipt, Mastersheet, and retrieval management</p>
          </div>
          <div className="flex gap-2">
            <Button icon={<ScanLine size={14} />} style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              Scan Receipt
            </Button>
            <Button type="primary" icon={<Snowflake size={14} />}>
              New Receipt
            </Button>
          </div>
        </div>

        {/* Freezer status strip */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {FREEZERS.map(f => (
            <div key={f.id} className="rounded-xl p-4"
              style={{ background: "white", border: `1px solid ${f.status === "Warning" ? "#e8c97c" : "var(--border)"}` }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{f.id}</span>
                {f.status === "Warning"
                  ? <AlertTriangle size={13} style={{ color: "var(--status-warn)" }} />
                  : <div className="w-2 h-2 rounded-full" style={{ background: "var(--status-pass)" }} />}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>{f.name}</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "DM Serif Display, serif", color: f.status === "Warning" ? "var(--status-warn)" : "var(--status-info)" }}>
                {f.temp}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>{f.used} / {f.capacity} positions used</div>
              <div className="utilisation-bar mt-2">
                <div className="utilisation-fill" style={{ width: `${Math.round((f.used / f.capacity) * 100)}%`, background: f.status === "Warning" ? "var(--status-warn)" : "var(--status-pass)" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Status summary */}
        <div className="flex gap-3 mb-5">
          {Object.entries(statusCounts).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 px-4 py-2.5 rounded-lg"
              style={{ background: "white", border: "1px solid var(--border)" }}>
              <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "DM Serif Display, serif" }}>{v}</span>
              <StatusTag status={k} />
            </div>
          ))}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg ml-auto"
            style={{ background: "var(--status-warn-bg)", border: "1px solid #e8c97c" }}>
            <AlertTriangle size={13} style={{ color: "var(--status-warn)" }} />
            <span style={{ fontSize: 12, color: "var(--status-warn)", fontWeight: 600 }}>1 sample at F/T limit</span>
          </div>
        </div>

        <Tabs
          defaultActiveKey="inventory"
          items={[
            { key: "inventory", label: "Sample Inventory" },
            { key: "receipt",   label: "Pending Receipts" },
            { key: "mastersheet", label: "Mastersheet" },
            { key: "retrieval", label: "Retrieval Requests" },
          ]}
          style={{ marginBottom: 12 }}
        />

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <Input
            prefix={<Search size={13} style={{ color: "var(--text-muted)" }} />}
            placeholder="Search by Sample ID or Subject…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 320 }}
          />
          <Select placeholder="Analyte" style={{ width: 150 }} allowClear onChange={setFilterAnalyte}>
            <Option value="Metformin">Metformin</Option>
            <Option value="Sitagliptin">Sitagliptin</Option>
          </Select>
          <Select placeholder="Project" style={{ width: 170 }} allowClear>
            <Option value="SID-2026-001">SID-2026-001</Option>
            <Option value="SID-2026-002">SID-2026-002</Option>
          </Select>
          <Select placeholder="Status" style={{ width: 130 }} allowClear onChange={setFilterStatus}>
            <Option value="available">Available</Option>
            <Option value="reserved">Reserved</Option>
            <Option value="retrieved">Retrieved</Option>
            <Option value="excluded">Excluded</Option>
          </Select>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "white" }}>
          <Table
            dataSource={filtered}
            columns={sampleColumns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 8, showSizeChanger: false }}
            rowClassName={(r) => r.status === "excluded" ? "opacity-50" : ""}
          />
        </div>
      </div>
    </AppLayout>
  );
}
