"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Input, Select, Table, Tag, Tooltip, Modal, message } from "antd";
import {
  Plus, Search, Edit2, Copy, Trash2, ScrollText,
  CheckCircle2, Send, RotateCcw, XCircle, FileOutput,
  LayoutDashboard, FileStack, UploadCloud,
} from "lucide-react";
import type { FormTemplate, FormStatus } from "./types";
import { loadForms, persistForms, removeForm } from "./store";
import { STATUS_LABEL, STATUS_STYLE, STATUS_FLOW, TONE_STYLE, CATEGORIES, DEPARTMENTS, type StatusTone } from "./formUtils";
import { PROJECT_MASTER, CURRENT_USER } from "./masterData";
import { issueForm } from "./instances";
import { logAuditEvent } from "./formAudit";

const { Option } = Select;

const TONE_ICON: Record<StatusTone, React.ElementType> = {
  info: Send, success: CheckCircle2, warning: RotateCcw, danger: XCircle,
};

function StatusBadge({ status }: { status: FormStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: '2px 9px', borderRadius: 4, fontSize: 11, fontWeight: 700,
      letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export default function FormLibraryPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const router = useRouter();
  const { status: statusParam } = use(searchParams);
  const [forms, setForms]           = useState<FormTemplate[]>(() => loadForms());
  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState<string | undefined>();
  const [filterDept, setFilterDept] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>(() => statusParam);
  const [deleteTarget, setDeleteTarget] = useState<FormTemplate | null>(null);
  const [issueTarget, setIssueTarget] = useState<FormTemplate | null>(null);
  const [issueProjectNo, setIssueProjectNo] = useState<string | undefined>();

  const filtered = forms.filter(f => {
    const q = search.toLowerCase();
    const matchQ = !search || f.name.toLowerCase().includes(q) || f.formNo.toLowerCase().includes(q);
    const matchC = !filterCat    || f.category === filterCat;
    const matchD = !filterDept   || f.department === filterDept;
    const matchS = !filterStatus || f.status === filterStatus;
    return matchQ && matchC && matchD && matchS;
  });

  function updateStatus(id: string, status: FormStatus) {
    const target = forms.find(f => f.id === id);
    if (!target) return;
    const oldStatus = target.status;
    const now = new Date().toISOString().slice(0, 10);
    const updated = forms.map(f => f.id === id
      ? {
          ...f, status, updatedAt: now,
          ...(status === 'effective' ? { effectiveDate: now } : {}),
          ...(status === 'obsolete' ? { obsoleteDate: now } : {}),
        }
      : f
    );
    setForms(updated);
    persistForms(updated);
    logAuditEvent({
      actor: CURRENT_USER.name, actorRole: CURRENT_USER.role, category: 'form-status',
      formId: id, formNo: target.formNo,
      oldValue: STATUS_LABEL[oldStatus], newValue: STATUS_LABEL[status],
      detail: `${target.formNo} status changed from ${STATUS_LABEL[oldStatus]} to ${STATUS_LABEL[status]}.`,
    });
    message.success(`Status updated to ${STATUS_LABEL[status]}`);
  }

  function handleDuplicate(f: FormTemplate) {
    const now = new Date().toISOString().slice(0, 10);
    const id  = `form-${Date.now()}`;
    const no  = `${f.formNo}-COPY`;
    const dup: FormTemplate = {
      ...f, id, formNo: no, name: `${f.name} (Copy)`,
      status: 'draft', version: '1.0', createdAt: now, updatedAt: now,
      effectiveDate: undefined, obsoleteDate: undefined,
      previousVersionId: undefined, nextVersionId: undefined,
      revisionHistory: [{ version: '1.0', date: now, author: CURRENT_USER.name, change: `Copied from ${f.formNo} (${f.name}).` }],
    };
    const updated = [dup, ...forms];
    setForms(updated);
    persistForms(updated);
    message.success(`Duplicated as ${no}`);
  }

  function handleDelete(id: string) {
    removeForm(id);
    setForms(prev => prev.filter(f => f.id !== id));
    setDeleteTarget(null);
    message.success('Form deleted');
  }

  function handleIssue() {
    if (!issueTarget || !issueProjectNo) return;
    const project = PROJECT_MASTER.find(p => p.projectNo === issueProjectNo);
    if (!project) return;
    const instance = issueForm(issueTarget, project, CURRENT_USER.name);
    logAuditEvent({
      actor: CURRENT_USER.name, actorRole: CURRENT_USER.role, category: 'form-issued',
      formId: issueTarget.id, formNo: issueTarget.formNo,
      instanceId: instance.id, instanceNo: instance.instanceNo,
      detail: `Issued ${instance.instanceNo} for project ${project.projectNo} — ${project.name}.`,
    });
    message.success({
      content: (
        <span>
          Issued as <strong>{instance.instanceNo}</strong>.{' '}
          <a onClick={() => router.push('/form-creation/instances')}>View Issued Instances</a>
        </span>
      ),
      duration: 5,
    });
    setIssueTarget(null);
    setIssueProjectNo(undefined);
  }

  const total    = forms.length;
  const live     = forms.filter(f => f.status === 'live').length;
  const draft    = forms.filter(f => f.status === 'draft').length;
  const inReview = forms.filter(f => ['under-review','qa-review','approved','effective'].includes(f.status)).length;

  const COLS = [
    {
      title: 'Form No.', dataIndex: 'formNo', key: 'formNo', width: 120,
      render: (v: string) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)', fontSize: 12 }}>{v}</span>
      ),
    },
    {
      title: 'Form Name', dataIndex: 'name', key: 'name',
      render: (v: string) => <span style={{ fontWeight: 500, fontSize: 13 }}>{v}</span>,
    },
    {
      title: 'Category', dataIndex: 'category', key: 'category',
      render: (v: string) => <Tag style={{ fontSize: 11 }}>{v}</Tag>,
    },
    {
      title: 'Dept.', dataIndex: 'department', key: 'department',
      render: (v: string) => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v}</span>,
    },
    {
      title: 'Pages', dataIndex: 'pages', key: 'pages', width: 70,
      render: (p: unknown[]) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{p.length}</span>,
    },
    {
      title: 'Ver.', dataIndex: 'version', key: 'version', width: 60,
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>v{v}</span>,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 130,
      render: (v: FormStatus) => <StatusBadge status={v} />,
    },
    {
      title: 'Updated', dataIndex: 'updatedAt', key: 'updatedAt', width: 100,
      render: (v: string) => <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v}</span>,
    },
    {
      title: 'Actions', key: 'actions', width: 300,
      render: (_: unknown, row: FormTemplate) => (
        <div className="flex items-center gap-1" style={{ flexWrap: 'wrap' }}>
          <Tooltip title="Open in Builder">
            <button onClick={() => router.push(`/form-creation/builder/${row.id}`)}
              style={{ background: 'var(--accent-light)', border: '1px solid var(--accent)',
                borderRadius: 5, padding: '2px 8px', cursor: 'pointer', color: 'var(--accent)',
                fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Edit2 size={11} /> Design
            </button>
          </Tooltip>

          {STATUS_FLOW[row.status].map(t => {
            const style = TONE_STYLE[t.tone];
            const Icon = TONE_ICON[t.tone];
            return (
              <Tooltip key={t.next} title={t.label}>
                <button onClick={() => updateStatus(row.id, t.next)}
                  style={{ background: style.bg, border: `1px solid ${style.border}`,
                    borderRadius: 5, padding: '2px 8px', cursor: 'pointer', color: style.color,
                    fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
                  <Icon size={11} /> {t.label}
                </button>
              </Tooltip>
            );
          })}

          {row.status === 'live' && (
            <Tooltip title="Issue this form to a project">
              <button onClick={() => { setIssueTarget(row); setIssueProjectNo(undefined); }}
                style={{ background: 'var(--accent-light)', border: '1px solid var(--accent)',
                  borderRadius: 5, padding: '2px 8px', cursor: 'pointer', color: 'var(--accent)',
                  fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                <FileOutput size={11} /> Issue
              </button>
            </Tooltip>
          )}

          <Tooltip title="Duplicate">
            <button onClick={() => handleDuplicate(row)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
              <Copy size={13} />
            </button>
          </Tooltip>
          <Tooltip title="Delete">
            <button onClick={() => setDeleteTarget(row)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}>
              <Trash2 size={13} />
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
            <h1 className="section-title">Form Creation</h1>
            <p className="section-subtitle">Design GxP-compliant data capture forms — worksheets, logs, batch records, SOPs</p>
          </div>
          <Button type="primary" icon={<Plus size={14} />}
            onClick={() => router.push('/form-creation/builder/new')}>
            New Form
          </Button>
        </div>

        {/* Quick links */}
        <div className="flex items-center gap-2 mb-6" style={{ flexWrap: 'wrap' }}>
          <Button icon={<LayoutDashboard size={14} />} onClick={() => router.push('/form-creation/dashboard')}>
            Dashboard
          </Button>
          <Button icon={<FileStack size={14} />} onClick={() => router.push('/form-creation/instances')}>
            Issued Instances
          </Button>
          <Button icon={<ScrollText size={14} />} onClick={() => router.push('/form-creation/audit')}>
            Audit Trail
          </Button>
          <Button icon={<UploadCloud size={14} />} onClick={() => router.push('/form-creation/upload')}>
            New from Document
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Forms',  value: total,    color: 'var(--text-primary)' },
            { label: 'Live',         value: live,     color: 'var(--status-pass)'  },
            { label: 'In Review',    value: inReview, color: '#1565c0'             },
            { label: 'Draft',        value: draft,    color: 'var(--status-info)'  },
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
            placeholder="Search by name or form number…"
            value={search} onChange={e => setSearch(e.target.value)} style={{ width: 280 }} />
          <Select placeholder="Category" style={{ width: 160 }} allowClear onChange={setFilterCat}>
            {CATEGORIES.map(c => <Option key={c} value={c}>{c}</Option>)}
          </Select>
          <Select placeholder="Department" style={{ width: 150 }} allowClear onChange={setFilterDept}>
            {DEPARTMENTS.map(d => <Option key={d} value={d}>{d}</Option>)}
          </Select>
          <Select placeholder="Status" style={{ width: 160 }} allowClear
            value={filterStatus} onChange={setFilterStatus}>
            {(Object.keys(STATUS_LABEL) as FormStatus[]).map(s => (
              <Option key={s} value={s}>{STATUS_LABEL[s]}</Option>
            ))}
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'white' }}>
          <Table dataSource={filtered} columns={COLS} rowKey="id" size="small"
            pagination={{ pageSize: 12, showSizeChanger: false }}
            locale={{ emptyText: (
              <div className="flex flex-col items-center py-10 gap-3">
                <ScrollText size={32} style={{ color: 'var(--border-strong)' }} />
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No forms found</div>
                <Button type="primary" size="small" icon={<Plus size={12} />}
                  onClick={() => router.push('/form-creation/builder/new')}>
                  Create your first form
                </Button>
              </div>
            )}}
          />
        </div>

        {/* Delete confirm */}
        <Modal
          title="Delete Form"
          open={!!deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onOk={() => deleteTarget && handleDelete(deleteTarget.id)}
          okText="Delete"
          okButtonProps={{ danger: true }}
          width={400}
        >
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Are you sure you want to permanently delete{' '}
            <strong>{deleteTarget?.name}</strong> ({deleteTarget?.formNo})?
            This cannot be undone.
          </p>
        </Modal>

        {/* Issue form to project */}
        <Modal
          title="Issue Form to Project"
          open={!!issueTarget}
          onCancel={() => setIssueTarget(null)}
          onOk={handleIssue}
          okText="Issue"
          okButtonProps={{ disabled: !issueProjectNo }}
          width={440}
        >
          {issueTarget && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Issuing <strong style={{ color: 'var(--text-primary)' }}>{issueTarget.formNo}</strong> — {issueTarget.name} (v{issueTarget.version})
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Project</div>
                <Select style={{ width: '100%' }} placeholder="Select project"
                  value={issueProjectNo} onChange={setIssueProjectNo}>
                  {PROJECT_MASTER.map(p => (
                    <Option key={p.projectNo} value={p.projectNo}>{p.projectNo} — {p.name} ({p.sponsor})</Option>
                  ))}
                </Select>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                A unique instance number will be generated and the form will appear in Issued Instances, ready for execution.
              </div>
            </div>
          )}
        </Modal>

      </div>
    </AppLayout>
  );
}
