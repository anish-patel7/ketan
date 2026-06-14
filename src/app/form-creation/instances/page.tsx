"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Input, Select, Table, Tooltip } from "antd";
import { Search, PlayCircle, Printer, ScrollText, FileStack, Plus } from "lucide-react";
import type { FormIssuedInstance, InstanceStatus } from "../types";
import { loadInstances } from "../instances";
import { INSTANCE_STATUS_LABEL, INSTANCE_STATUS_STYLE } from "../formUtils";

const { Option } = Select;

function InstanceStatusBadge({ status }: { status: InstanceStatus }) {
  const s = INSTANCE_STATUS_STYLE[status];
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: '2px 9px', borderRadius: 4, fontSize: 11, fontWeight: 700,
      letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {INSTANCE_STATUS_LABEL[status]}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════════
   ISSUED INSTANCES
════════════════════════════════════════════════════════════════════ */

export default function IssuedInstancesPage() {
  const router = useRouter();
  const [instances] = useState<FormIssuedInstance[]>(() => loadInstances());
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  const filtered = instances.filter(i => {
    const q = search.toLowerCase();
    const matchQ = !search
      || i.instanceNo.toLowerCase().includes(q)
      || i.formNo.toLowerCase().includes(q)
      || i.formName.toLowerCase().includes(q)
      || i.projectNo.toLowerCase().includes(q)
      || i.projectName.toLowerCase().includes(q);
    const matchS = !filterStatus || i.status === filterStatus;
    return matchQ && matchS;
  });

  const total      = instances.length;
  const open       = instances.filter(i => i.status === 'issued' || i.status === 'in-progress').length;
  const inReview   = instances.filter(i => i.status === 'under-review').length;
  const completed  = instances.filter(i => i.status === 'completed' || i.status === 'approved').length;

  const COLS = [
    {
      title: 'Instance No.', dataIndex: 'instanceNo', key: 'instanceNo', width: 200,
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)', fontSize: 12 }}>{v}</span>,
    },
    {
      title: 'Form', key: 'form',
      render: (_: unknown, row: FormIssuedInstance) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{row.formName}</div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{row.formNo} · v{row.version}</div>
        </div>
      ),
    },
    {
      title: 'Project', key: 'project',
      render: (_: unknown, row: FormIssuedInstance) => (
        <div>
          <div style={{ fontSize: 12.5 }}>{row.projectName}</div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>
            {row.projectNo}{row.studyNo ? ` · ${row.studyNo}` : ''}
          </div>
        </div>
      ),
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 130,
      render: (v: InstanceStatus) => <InstanceStatusBadge status={v} />,
    },
    {
      title: 'Issued By', dataIndex: 'issuedBy', key: 'issuedBy', width: 130,
      render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span>,
    },
    {
      title: 'Issued At', dataIndex: 'issuedAt', key: 'issuedAt', width: 150,
      render: (v: string) => <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(v).toLocaleString()}</span>,
    },
    {
      title: 'Actions', key: 'actions', width: 160,
      render: (_: unknown, row: FormIssuedInstance) => (
        <div className="flex items-center gap-1" style={{ flexWrap: 'wrap' }}>
          <Tooltip title={row.status === 'completed' || row.status === 'approved' ? 'View completed record' : 'Execute / continue filling'}>
            <button onClick={() => router.push(`/form-creation/execute/${row.id}`)}
              style={{ background: 'var(--accent-light)', border: '1px solid var(--accent)',
                borderRadius: 5, padding: '2px 8px', cursor: 'pointer', color: 'var(--accent)',
                fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
              <PlayCircle size={11} /> {row.status === 'completed' || row.status === 'approved' ? 'View' : 'Execute'}
            </button>
          </Tooltip>
          <Tooltip title="Print / PDF">
            <button onClick={() => router.push(`/form-creation/print/${row.formId}?instance=${row.id}`)}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 8px',
                cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 3 }}>
              <Printer size={11} /> Print
            </button>
          </Tooltip>
          <Tooltip title="Audit trail for this instance">
            <button onClick={() => router.push(`/form-creation/audit?instanceId=${row.id}`)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
              <ScrollText size={13} />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="page-container">

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="section-title">Issued Instances</h1>
            <p className="section-subtitle">Forms issued to projects for execution — track progress, completion and signatures</p>
          </div>
          <Button icon={<Plus size={14} />} onClick={() => router.push('/form-creation?status=live')}>
            Issue a Form
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Issued',  value: total,     color: 'var(--text-primary)' },
            { label: 'Open',          value: open,      color: 'var(--status-info)'  },
            { label: 'Under Review',  value: inReview,  color: 'var(--status-warn)'  },
            { label: 'Completed',     value: completed, color: 'var(--status-pass)'  },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ fontSize: 26, fontFamily: 'DM Serif Display, serif', color: s.color, lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5" style={{ flexWrap: 'wrap' }}>
          <Input prefix={<Search size={13} style={{ color: 'var(--text-muted)' }} />}
            placeholder="Search by instance no., form or project…"
            value={search} onChange={e => setSearch(e.target.value)} style={{ width: 320 }} />
          <Select placeholder="Status" style={{ width: 160 }} allowClear onChange={setFilterStatus}>
            {(Object.keys(INSTANCE_STATUS_LABEL) as InstanceStatus[]).map(s => (
              <Option key={s} value={s}>{INSTANCE_STATUS_LABEL[s]}</Option>
            ))}
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'white' }}>
          <Table dataSource={filtered} columns={COLS} rowKey="id" size="small"
            pagination={{ pageSize: 12, showSizeChanger: false }}
            locale={{ emptyText: (
              <div className="flex flex-col items-center py-10 gap-3">
                <FileStack size={32} style={{ color: 'var(--border-strong)' }} />
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No instances issued yet</div>
                <Button type="primary" size="small" icon={<Plus size={12} />}
                  onClick={() => router.push('/form-creation?status=live')}>
                  Go to Form Library to issue a form
                </Button>
              </div>
            )}}
          />
        </div>

      </div>
    </AppLayout>
  );
}
