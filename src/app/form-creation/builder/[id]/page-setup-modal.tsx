"use client";

import { useState } from "react";
import { Modal, Input, Switch, Radio, Table, Button, Tag } from "antd";
import { GitBranch } from "lucide-react";
import type { FormTemplate, RevisionEntry } from "../../types";
import { PropRow } from "./properties-panel";

const { TextArea } = Input;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase',
      letterSpacing: '0.08em', margin: '20px 0 12px', paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   PAGE SETUP MODAL — header/footer/orientation + revision history
════════════════════════════════════════════════════════════════════ */

export function PageSetupModal({ open, form, onClose, onChange, onCreateVersion }:
  { open: boolean; form: FormTemplate; onClose: () => void;
    onChange: (changes: Partial<FormTemplate>) => void;
    onCreateVersion: (info: { version: string; change: string; changeControlRef?: string }) => void }) {

  const [newVerOpen, setNewVerOpen] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [newChange, setNewChange] = useState('');
  const [newCCRef, setNewCCRef] = useState('');

  function suggestNextVersion(v: string): string {
    const m = v.match(/^(\d+)\.(\d+)$/);
    if (!m) return v;
    return `${m[1]}.${parseInt(m[2], 10) + 1}`;
  }

  function openNewVersion() {
    setNewVersion(suggestNextVersion(form.version));
    setNewChange('');
    setNewCCRef('');
    setNewVerOpen(true);
  }

  const revCols = [
    {
      title: 'Version', dataIndex: 'version', key: 'version', width: 70,
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>v{v}</span>,
    },
    {
      title: 'Date', dataIndex: 'date', key: 'date', width: 100,
      render: (v: string) => <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{v}</span>,
    },
    {
      title: 'Author', dataIndex: 'author', key: 'author', width: 130,
      render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span>,
    },
    {
      title: 'Change Description', dataIndex: 'change', key: 'change',
      render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span>,
    },
    {
      title: 'Change Control', dataIndex: 'changeControlRef', key: 'changeControlRef', width: 120,
      render: (v?: string) => v
        ? <Tag style={{ fontSize: 11, fontFamily: 'monospace' }}>{v}</Tag>
        : <span style={{ color: 'var(--text-muted)' }}>—</span>,
    },
  ];

  return (
    <Modal
      title={<span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 17 }}>Page Setup &amp; Versioning</span>}
      open={open}
      onCancel={onClose}
      width={680}
      styles={{ body: { maxHeight: '72vh', overflowY: 'auto' } }}
      footer={<Button type="primary" onClick={onClose}>Done</Button>}
    >
      <SectionTitle>Page Layout</SectionTitle>
      <PropRow label="Orientation">
        <Radio.Group value={form.orientation} optionType="button" buttonStyle="solid"
          onChange={e => onChange({ orientation: e.target.value })}>
          <Radio.Button value="portrait">Portrait</Radio.Button>
          <Radio.Button value="landscape">Landscape</Radio.Button>
        </Radio.Group>
      </PropRow>

      <SectionTitle>Header</SectionTitle>
      <div className="grid grid-cols-2 gap-x-4">
        <PropRow label="Company Name">
          <Input size="small" value={form.header.companyName}
            onChange={e => onChange({ header: { ...form.header, companyName: e.target.value } })} />
        </PropRow>
        <PropRow label="Show Company Logo">
          <Switch checked={form.header.showLogo}
            onChange={v => onChange({ header: { ...form.header, showLogo: v } })} />
        </PropRow>
      </div>
      <PropRow label="Watermark Text (optional — overrides the automatic Draft/Obsolete watermark on print)">
        <Input size="small" placeholder="e.g. CONFIDENTIAL — leave blank for status-based watermark"
          value={form.header.watermarkText ?? ''}
          onChange={e => onChange({ header: { ...form.header, watermarkText: e.target.value || undefined } })} />
      </PropRow>

      <SectionTitle>Footer</SectionTitle>
      <div className="grid grid-cols-3 gap-x-4">
        <PropRow label="Page Numbers">
          <Switch checked={form.footer.showPageNumbers}
            onChange={v => onChange({ footer: { ...form.footer, showPageNumbers: v } })} />
        </PropRow>
        <PropRow label="QR Code">
          <Switch checked={form.footer.showQrCode}
            onChange={v => onChange({ footer: { ...form.footer, showQrCode: v } })} />
        </PropRow>
        <PropRow label="Audit Reference">
          <Switch checked={form.footer.showAuditRef}
            onChange={v => onChange({ footer: { ...form.footer, showAuditRef: v } })} />
        </PropRow>
      </div>

      <SectionTitle>Revision History</SectionTitle>
      <Table dataSource={form.revisionHistory} columns={revCols}
        rowKey={(r: RevisionEntry) => `${r.version}-${r.date}`}
        size="small" pagination={false}
        locale={{ emptyText: 'No revisions recorded yet.' }}
        style={{ marginBottom: 14 }} />

      {form.nextVersionId ? (
        <div style={{ padding: '10px 12px', background: 'var(--accent-light)', borderRadius: 6,
          fontSize: 12, color: 'var(--accent-hover)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <GitBranch size={14} />
          A newer version of this form is already in draft — open it from the Form Library to continue that revision.
        </div>
      ) : (
        <Button icon={<GitBranch size={13} />} onClick={openNewVersion}>
          Create New Version
        </Button>
      )}

      {/* ── Create new version sub-modal ── */}
      <Modal
        title="Create New Version"
        open={newVerOpen}
        onCancel={() => setNewVerOpen(false)}
        onOk={() => {
          onCreateVersion({ version: newVersion.trim(), change: newChange.trim(), changeControlRef: newCCRef.trim() || undefined });
          setNewVerOpen(false);
        }}
        okText="Create Draft"
        okButtonProps={{ disabled: !newVersion.trim() || !newChange.trim() }}
        destroyOnHidden
        width={440}
        zIndex={1100}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            This creates a new draft copy of <strong style={{ color: 'var(--text-primary)' }}>{form.formNo}</strong> for revision.
            The current v{form.version} remains {form.status === 'live' ? 'live' : 'in place'} until the new version completes its own approval cycle.
          </div>
          <PropRow label="New Version Number">
            <Input value={newVersion} onChange={e => setNewVersion(e.target.value)} style={{ fontFamily: 'monospace' }} />
          </PropRow>
          <PropRow label="Change Description">
            <TextArea rows={3} value={newChange} onChange={e => setNewChange(e.target.value)}
              placeholder="Describe what is changing in this revision…" />
          </PropRow>
          <PropRow label="Change Control Reference (optional)">
            <Input value={newCCRef} onChange={e => setNewCCRef(e.target.value)}
              placeholder="e.g. CC-2026-0xx" style={{ fontFamily: 'monospace' }} />
          </PropRow>
        </div>
      </Modal>
    </Modal>
  );
}
