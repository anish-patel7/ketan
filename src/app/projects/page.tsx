"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatusTag from "@/components/ui/StatusTag";
import { Button, Table, Input, Select, Modal, Form, DatePicker, InputNumber, Divider } from "antd";
import { Plus, Search, ClipboardList } from "lucide-react";

const { Option } = Select;

const PROJECTS = [
  { id: "SID-2026-001", projectNo: "PRJ-2026-001", name: "Metformin BE Study",    sponsor: "PharmaCo Ltd", analytes: "Metformin",              subjects: 24, periods: 2, status: "approved", phase: "BA Analysis", pm: "Dr. S. Mehta", type: "Internal" },
  { id: "SID-2026-003", projectNo: "PRJ-2026-003", name: "Combo BE Study",        sponsor: "BioGen Inc",   analytes: "Metformin, Sitagliptin", subjects: 30, periods: 2, status: "approved", phase: "Collection",  pm: "Dr. R. Patel", type: "External" },
  { id: "SID-2026-004", projectNo: "PRJ-2026-004", name: "Drug X Single Dose",    sponsor: "NovaMed",      analytes: "Compound X",             subjects: 18, periods: 1, status: "pending",  phase: "Setup",       pm: "Dr. A. Liang", type: "Internal" },
  { id: "SID-2025-012", projectNo: "PRJ-2025-012", name: "Amlodipine BE",         sponsor: "GenPharma",    analytes: "Amlodipine",             subjects: 24, periods: 2, status: "approved", phase: "Completed",   pm: "Dr. R. Patel", type: "Internal" },
];

const COLS = [
  { title: "Project ID",  dataIndex: "id",        key: "id",        render: (v: string) => <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--accent)", fontSize: 13 }}>{v}</span> },
  { title: "Project No",  dataIndex: "projectNo", key: "projectNo", render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-secondary)" }}>{v}</span> },
  { title: "Project Name", dataIndex: "name",     key: "name",      render: (v: string) => <span style={{ fontWeight: 500, fontSize: 13 }}>{v}</span> },
  { title: "Sponsor",     dataIndex: "sponsor",  key: "sponsor",  render: (v: string) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{v}</span> },
  { title: "Analytes",    dataIndex: "analytes", key: "analytes", render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span> },
  { title: "Subjects",    dataIndex: "subjects", key: "subjects", render: (v: number) => <span style={{ fontFamily: "monospace" }}>{v}</span> },
  { title: "Periods",     dataIndex: "periods",  key: "periods",  render: (v: number) => <span style={{ fontFamily: "monospace" }}>{v}</span> },
  { title: "Type",        dataIndex: "type",     key: "type",     render: (v: string) => <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>{v}</span> },
  { title: "Phase",       dataIndex: "phase",    key: "phase",    render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span> },
  { title: "Status",      dataIndex: "status",   key: "status",   render: (v: string) => <StatusTag status={v} /> },
  { title: "Project Mgr", dataIndex: "pm",       key: "pm",       render: (v: string) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{v}</span> },
];

const LABEL_STYLE = { fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" };

export default function ProjectsPage() {
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState("");
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [form] = Form.useForm();

  const filtered = PROJECTS.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.sponsor.toLowerCase().includes(q);
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function handleCreate() {
    form.validateFields().then(() => {
      form.resetFields();
      setOpen(false);
    });
  }

  return (
    <AppLayout>
      <div className="page-container">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="section-title">Projects</h1>
            <p className="section-subtitle">Clinical studies — create, configure, and track study status</p>
          </div>
          <Button type="primary" icon={<Plus size={14} />} onClick={() => setOpen(true)}>
            New Project
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5">
          <Input
            prefix={<Search size={13} style={{ color: "var(--text-muted)" }} />}
            placeholder="Search by name, ID, or sponsor…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 300 }}
          />
          <Select placeholder="Status" style={{ width: 130 }} allowClear onChange={setFilterStatus}>
            <Option value="approved">Approved</Option>
            <Option value="pending">Pending</Option>
          </Select>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "white" }}>
          <Table
            dataSource={filtered}
            columns={COLS}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: false }}
          />
        </div>

        {/* Project creation modal */}
        <Modal
          title={
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                <ClipboardList size={15} />
              </div>
              <span style={{ fontFamily: "DM Serif Display, serif", fontSize: 19 }}>
                New Project
              </span>
            </div>
          }
          open={open}
          onCancel={() => { setOpen(false); form.resetFields(); }}
          width={620}
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => { setOpen(false); form.resetFields(); }}>Cancel</Button>
              <Button type="primary" icon={<Plus size={13} />} onClick={handleCreate}>
                Create Project
              </Button>
            </div>
          }
        >
          <Form form={form} layout="vertical" style={{ padding: "12px 0" }}>

            {/* Study identity */}
            <div className="grid grid-cols-2 gap-x-4">
              <Form.Item
                name="studyId"
                label={<span style={LABEL_STYLE}>Study ID</span>}
                rules={[{ required: true, message: "Required" }]}
              >
                <Input placeholder="e.g. SID-2026-005" />
              </Form.Item>
              <Form.Item
                name="protocolNo"
                label={<span style={LABEL_STYLE}>Protocol Number</span>}
              >
                <Input placeholder="e.g. PROT-2026-005" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-x-4">
              <Form.Item
                name="projectNo"
                label={<span style={LABEL_STYLE}>Project No</span>}
                rules={[{ required: true, message: "Required" }]}
              >
                <Input placeholder="e.g. PRJ-2026-005" />
              </Form.Item>
              <Form.Item
                name="projectName"
                label={<span style={LABEL_STYLE}>Project Name</span>}
                rules={[{ required: true, message: "Required" }]}
              >
                <Input placeholder="e.g. Rosuvastatin 10 mg BE Study" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-x-4">
              <Form.Item
                name="sponsor"
                label={<span style={LABEL_STYLE}>Sponsor</span>}
                rules={[{ required: true, message: "Required" }]}
              >
                <Input placeholder="Sponsor / client name" />
              </Form.Item>
            </div>

            <Divider style={{ margin: "8px 0 16px", borderColor: "var(--border)" }} />

            {/* Study design */}
            <Form.Item
              name="analytes"
              label={<span style={LABEL_STYLE}>Analyte(s)</span>}
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="e.g. Rosuvastatin, Ezetimibe" />
            </Form.Item>

            <div className="grid grid-cols-3 gap-x-4">
              <Form.Item
                name="design"
                label={<span style={LABEL_STYLE}>Study Design</span>}
                rules={[{ required: true, message: "Required" }]}
              >
                <Select placeholder="Select">
                  <Option value="crossover">Crossover</Option>
                  <Option value="parallel">Parallel</Option>
                  <Option value="single-dose">Single Dose</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="subjects"
                label={<span style={LABEL_STYLE}>No. of Subjects</span>}
                rules={[{ required: true, message: "Required" }]}
              >
                <InputNumber style={{ width: "100%" }} min={1} max={200} placeholder="e.g. 24" />
              </Form.Item>
              <Form.Item
                name="periods"
                label={<span style={LABEL_STYLE}>No. of Periods</span>}
                rules={[{ required: true, message: "Required" }]}
              >
                <InputNumber style={{ width: "100%" }} min={1} max={6} placeholder="e.g. 2" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-x-4">
              <Form.Item
                name="route"
                label={<span style={LABEL_STYLE}>Route of Administration</span>}
              >
                <Select placeholder="Select">
                  <Option value="oral">Oral</Option>
                  <Option value="iv">IV</Option>
                  <Option value="im">IM</Option>
                  <Option value="sc">Subcutaneous</Option>
                  <Option value="topical">Topical</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="studyType"
                label={<span style={LABEL_STYLE}>Study Type</span>}
              >
                <Select placeholder="Select">
                  <Option value="pilot">Pilot</Option>
                  <Option value="pivotal">Pivotal</Option>
                </Select>
              </Form.Item>
            </div>

            <Divider style={{ margin: "8px 0 16px", borderColor: "var(--border)" }} />

            {/* People & dates */}
            <div className="grid grid-cols-2 gap-x-4">
              <Form.Item
                name="pm"
                label={<span style={LABEL_STYLE}>Project Manager</span>}
                rules={[{ required: true, message: "Required" }]}
              >
                <Select placeholder="Assign PM">
                  <Option value="dr-mehta">Dr. S. Mehta</Option>
                  <Option value="dr-patel">Dr. R. Patel</Option>
                  <Option value="dr-liang">Dr. A. Liang</Option>
                  <Option value="dr-chen">Dr. J. Chen</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="coordinator"
                label={<span style={LABEL_STYLE}>Clinical Coordinator</span>}
              >
                <Select placeholder="Assign coordinator">
                  <Option value="t-okafor">T. Okafor</Option>
                  <Option value="n-sharma">N. Sharma</Option>
                </Select>
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-x-4">
              <Form.Item
                name="startDate"
                label={<span style={LABEL_STYLE}>Planned Start Date</span>}
                rules={[{ required: true, message: "Required" }]}
              >
                <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
              </Form.Item>
              <Form.Item
                name="endDate"
                label={<span style={LABEL_STYLE}>Planned End Date</span>}
              >
                <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
              </Form.Item>
            </div>

            <Form.Item
              name="notes"
              label={<span style={LABEL_STYLE}>Notes</span>}
              style={{ marginBottom: 0 }}
            >
              <Input.TextArea rows={2} placeholder="Any special requirements or remarks…" />
            </Form.Item>

          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
}
