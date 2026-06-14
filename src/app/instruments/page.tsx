"use client";

import AppLayout from "@/components/layout/AppLayout";
import StatusTag from "@/components/ui/StatusTag";
import { Button, Table, Input, Select } from "antd";
import { Plus, Search, AlertTriangle } from "lucide-react";

const { Option } = Select;

const INSTRUMENTS = [
  { id: "LCMS-01", name: "Sciex Triple Quad 6500+", type: "LC-MS/MS",   serial: "BD47821", cal: "2026-05-15", status: "calibrated",   location: "BA-Lab Room 1" },
  { id: "LCMS-02", name: "Shimadzu LCMS-8060",      type: "LC-MS/MS",   serial: "SH29014", cal: "2026-04-01", status: "calibrated",   location: "BA-Lab Room 2" },
  { id: "BAL-01",  name: "Mettler XPE205",          type: "Balance",    serial: "MT11234", cal: "2026-03-10", status: "calibrated",   location: "Weighing Room" },
  { id: "BAL-02",  name: "Sartorius ME5",           type: "Balance",    serial: "SA45612", cal: "2026-01-20", status: "overdue",      location: "Weighing Room" },
  { id: "CEN-01",  name: "Eppendorf 5810R",         type: "Centrifuge", serial: "EP78912", cal: "2026-06-01", status: "calibrated",   location: "CPMA" },
  { id: "PIP-01",  name: "Eppendorf Research 200µL", type: "Pipette",   serial: "EP22341", cal: "2026-04-30", status: "calibrated",   location: "BA-Lab Room 1" },
  { id: "PIP-02",  name: "Eppendorf Research 1000µL", type: "Pipette",  serial: "EP22342", cal: "2026-02-28", status: "overdue",      location: "BA-Lab Room 1" },
];

const cols = [
  { title: "Instrument ID", dataIndex: "id",       key: "id",       render: (v: string) => <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--accent)", fontSize: 13 }}>{v}</span> },
  { title: "Name",          dataIndex: "name",     key: "name",     render: (v: string) => <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span> },
  { title: "Type",          dataIndex: "type",     key: "type" },
  { title: "Serial No.",    dataIndex: "serial",   key: "serial",   render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-secondary)" }}>{v}</span> },
  { title: "Cal. Due",      dataIndex: "cal",      key: "cal",
    render: (v: string, r: typeof INSTRUMENTS[0]) => (
      <span style={{ fontFamily: "monospace", fontSize: 12, color: r.status === "overdue" ? "var(--status-fail)" : "var(--text-primary)", fontWeight: r.status === "overdue" ? 700 : 400 }}>
        {v} {r.status === "overdue" && "⚠"}
      </span>
    )
  },
  { title: "Status",     dataIndex: "status",   key: "status",   render: (v: string) => <StatusTag status={v} /> },
  { title: "Location",   dataIndex: "location", key: "location", render: (v: string) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{v}</span> },
];

export default function InstrumentsPage() {
  const overdueCount = INSTRUMENTS.filter(i => i.status === "overdue").length;
  return (
    <AppLayout>
      <div className="page-container">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="section-title">Instrument & Equipment Management</h1>
            <p className="section-subtitle">Calibration tracking, qualification status, and usage logs for all lab equipment</p>
          </div>
          <Button type="primary" icon={<Plus size={14} />}>Register Instrument</Button>
        </div>

        {overdueCount > 0 && (
          <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-5"
            style={{ background: "var(--status-fail-bg)", border: "1px solid #d4a0a0" }}>
            <AlertTriangle size={14} style={{ color: "var(--status-fail)" }} />
            <span style={{ fontSize: 13, color: "var(--status-fail)", fontWeight: 600 }}>
              {overdueCount} instrument(s) have overdue calibration — blocked from use until updated
            </span>
          </div>
        )}

        <div className="flex gap-3 mb-5">
          <Input prefix={<Search size={13} style={{ color: "var(--text-muted)" }} />} placeholder="Search instruments…" style={{ width: 280 }} />
          <Select placeholder="Type" style={{ width: 150 }} allowClear>
            <Option value="lcms">LC-MS/MS</Option>
            <Option value="balance">Balance</Option>
            <Option value="centrifuge">Centrifuge</Option>
            <Option value="pipette">Pipette</Option>
          </Select>
          <Select placeholder="Status" style={{ width: 140 }} allowClear>
            <Option value="calibrated">Calibrated</Option>
            <Option value="overdue">Overdue</Option>
          </Select>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "white" }}>
          <Table
            dataSource={INSTRUMENTS} columns={cols} rowKey="id" size="small"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            onRow={(r) => ({ style: { background: r.status === "overdue" ? "var(--status-fail-bg)" : "transparent" } })}
          />
        </div>
      </div>
    </AppLayout>
  );
}
