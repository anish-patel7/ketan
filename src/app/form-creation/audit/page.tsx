"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Input, Select, Table, Tag } from "antd";
import { Search, ScrollText, PenLine, Cpu, GitBranch, X } from "lucide-react";
import type { AuditEvent, AuditCategory } from "../types";
import { getAuditTrail } from "../formAudit";
import { loadForms } from "../store";
import { loadInstances } from "../instances";
import { AUDIT_CATEGORY_LABEL, AUDIT_CATEGORY_COLOR } from "../formUtils";

const { Option } = Select;

/* ════════════════════════════════════════════════════════════════════
   FORM-DOMAIN AUDIT TRAIL
════════════════════════════════════════════════════════════════════ */

export default function FormAuditTrailPage({ searchParams }: {
  searchParams: Promise<{ instanceId?: string; formId?: string; category?: string }>;
}) {
  const router = useRouter();
  const { instanceId, formId, category } = use(searchParams);

  const [events]    = useState<AuditEvent[]>(() => getAuditTrail());
  const [forms]     = useState(() => loadForms());
  const [instances] = useState(() => loadInstances());

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | undefined>(() => category);
  const [filterInstanceId, setFilterInstanceId] = useState<string | undefined>(() => instanceId);
  const [filterFormId, setFilterFormId] = useState<string | undefined>(() => formId);

  const focusedInstance = filterInstanceId ? instances.find(i => i.id === filterInstanceId) : undefined;
  const focusedForm = filterFormId ? forms.find(f => f.id === filterFormId) : undefined;

  const filtered = events.filter(e => {
    const q = search.toLowerCase();
    const matchQ = !search
      || e.detail.toLowerCase().includes(q)
      || e.actor.toLowerCase().includes(q)
      || (e.formNo ?? '').toLowerCase().includes(q)
      || (e.instanceNo ?? '').toLowerCase().includes(q);
    const matchCat  = !filterCategory  || e.category === filterCategory;
    const matchInst = !filterInstanceId || e.instanceId === filterInstanceId;
    const matchForm = !filterFormId     || e.formId === filterFormId;
    return matchQ && matchCat && matchInst && matchForm;
  });

  const total     = events.length;
  const signed    = events.filter(e => e.category === 'instance-signed').length;
  const captures  = events.filter(e => e.category === 'instrument-capture').length;
  const lifecycle = events.filter(e => e.category === 'form-status' || e.category === 'instance-status').length;

  const COLS = [
    {
      title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp', width: 160,
      render: (v: string) => <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(v).toLocaleString()}</span>,
    },
    {
      title: 'Category', dataIndex: 'category', key: 'category', width: 150,
      render: (v: AuditCategory) => (
        <Tag style={{
          fontSize: 10, fontWeight: 700, color: AUDIT_CATEGORY_COLOR[v],
          borderColor: AUDIT_CATEGORY_COLOR[v], background: `${AUDIT_CATEGORY_COLOR[v]}12`,
        }}>
          {AUDIT_CATEGORY_LABEL[v]}
        </Tag>
      ),
    },
    {
      title: 'Reference', key: 'reference', width: 180,
      render: (_: unknown, row: AuditEvent) => (
        <div className="flex flex-col gap-1">
          {row.instanceNo && (
            <button onClick={() => router.push(`/form-creation/execute/${row.instanceId}`)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
                fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>
              {row.instanceNo}
            </button>
          )}
          {row.formNo && (
            <button onClick={() => row.formId && router.push(`/form-creation/builder/${row.formId}`)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
                fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>
              {row.formNo}
            </button>
          )}
        </div>
      ),
    },
    {
      title: 'Actor', key: 'actor', width: 150,
      render: (_: unknown, row: AuditEvent) => (
        <div>
          <div style={{ fontSize: 12.5 }}>{row.actor}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.actorRole}</div>
        </div>
      ),
    },
    {
      title: 'Detail', key: 'detail',
      render: (_: unknown, row: AuditEvent) => (
        <div>
          <div style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>{row.detail}</div>
          {(row.oldValue || row.newValue) && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {row.oldValue && <span>{row.oldValue}</span>}
              {row.oldValue && row.newValue && <span> → </span>}
              {row.newValue && <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{row.newValue}</span>}
            </div>
          )}
          {row.field && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Field: {row.field}</div>
          )}
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
            <h1 className="section-title">Audit Trail</h1>
            <p className="section-subtitle">
              Immutable, append-only record of form lifecycle changes, issuances, e-signatures, instrument captures and value corrections
            </p>
          </div>
          <Button onClick={() => router.push('/form-creation/dashboard')}>Dashboard</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Events',        value: total,     icon: ScrollText, color: 'var(--text-primary)' },
            { label: 'E-Signatures',         value: signed,    icon: PenLine,    color: 'var(--status-pass)'  },
            { label: 'Instrument Captures',  value: captures,  icon: Cpu,        color: '#2A6B8F'              },
            { label: 'Lifecycle Changes',    value: lifecycle, icon: GitBranch,  color: 'var(--status-info)'  },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="flex items-center justify-between">
                <div style={{ fontSize: 26, fontFamily: 'DM Serif Display, serif', color: s.color, lineHeight: 1 }}>
                  {s.value}
                </div>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Reference filter banner */}
        {(focusedInstance || focusedForm) && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            padding: '10px 14px', borderRadius: 6, background: 'var(--accent-light)',
            color: 'var(--accent-hover)', fontSize: 12.5, marginBottom: 14,
          }}>
            <span>
              Filtered to {focusedInstance && <>instance <strong>{focusedInstance.instanceNo}</strong> ({focusedInstance.formName})</>}
              {focusedForm && <>form <strong>{focusedForm.formNo}</strong> — {focusedForm.name}</>}
            </span>
            <button onClick={() => { setFilterInstanceId(undefined); setFilterFormId(undefined); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-hover)',
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}>
              <X size={13} /> Clear
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-5" style={{ flexWrap: 'wrap' }}>
          <Input prefix={<Search size={13} style={{ color: 'var(--text-muted)' }} />}
            placeholder="Search detail, actor, form or instance no…"
            value={search} onChange={e => setSearch(e.target.value)} style={{ width: 320 }} />
          <Select placeholder="Category" style={{ width: 200 }} allowClear
            value={filterCategory} onChange={setFilterCategory}>
            {(Object.keys(AUDIT_CATEGORY_LABEL) as AuditCategory[]).map(c => (
              <Option key={c} value={c}>{AUDIT_CATEGORY_LABEL[c]}</Option>
            ))}
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'white' }}>
          <Table dataSource={filtered} columns={COLS} rowKey="id" size="small"
            pagination={{ pageSize: 15, showSizeChanger: false }}
            locale={{ emptyText: (
              <div className="flex flex-col items-center py-10 gap-2">
                <ScrollText size={28} style={{ color: 'var(--border-strong)' }} />
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No audit events recorded yet</div>
              </div>
            )}}
          />
        </div>

      </div>
    </AppLayout>
  );
}
