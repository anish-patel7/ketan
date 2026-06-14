"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Tag } from "antd";
import {
  ArrowRight, Activity,
} from "lucide-react";
import type { FormStatus } from "../types";
import { loadForms } from "../store";
import { loadInstances } from "../instances";
import { getAuditTrail } from "../formAudit";
import { STATUS_LABEL, STATUS_STYLE, AUDIT_CATEGORY_LABEL, AUDIT_CATEGORY_COLOR } from "../formUtils";

/* ════════════════════════════════════════════════════════════════════
   FORM BUILDER DASHBOARD
════════════════════════════════════════════════════════════════════ */

export default function FormDashboardPage() {
  const router = useRouter();
  const [forms]       = useState(() => loadForms());
  const [instances]   = useState(() => loadInstances());
  const [auditEvents] = useState(() => getAuditTrail());

  /* ── lifecycle counts ── */
  const counts: Record<FormStatus, number> = {
    'draft': 0, 'under-review': 0, 'qa-review': 0, 'approved': 0,
    'effective': 0, 'live': 0, 'obsolete': 0, 'archived': 0,
  };
  forms.forEach(f => { counts[f.status] = (counts[f.status] ?? 0) + 1; });

  const totalForms     = forms.length;
  const totalInstances = instances.length;

  const KPI_CARDS = [
    { label: 'Draft',                value: counts.draft,                          style: STATUS_STYLE.draft,        href: '/form-creation?status=draft' },
    { label: 'Pending Review',       value: counts['under-review'],                style: STATUS_STYLE['under-review'], href: '/form-creation?status=under-review' },
    { label: 'Pending QA Approval',  value: counts['qa-review'],                   style: STATUS_STYLE['qa-review'], href: '/form-creation?status=qa-review' },
    { label: 'Effective / Live',     value: counts.effective + counts.live,        style: STATUS_STYLE.live,          href: '/form-creation?status=live' },
    { label: 'Issued Instances',     value: totalInstances,                        style: STATUS_STYLE.approved,      href: '/form-creation/instances' },
    { label: 'Obsolete / Archived',  value: counts.obsolete + counts.archived,     style: STATUS_STYLE.obsolete,      href: '/form-creation?status=obsolete' },
  ];

  const recentEvents = auditEvents.slice(0, 8);

  return (
    <AppLayout>
      <div className="page-container">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="section-title">Form Builder Dashboard</h1>
            <p className="section-subtitle">
              {totalForms} form template{totalForms !== 1 ? 's' : ''} · {totalInstances} issued instance{totalInstances !== 1 ? 's' : ''} · {auditEvents.length} audit event{auditEvents.length !== 1 ? 's' : ''} logged
            </p>
          </div>
          <Button onClick={() => router.push('/form-creation')}>Form Library</Button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {KPI_CARDS.map(c => (
            <button key={c.label} onClick={() => router.push(c.href)}
              className="stat-card text-left"
              style={{ width: '100%', cursor: 'pointer', fontFamily: 'inherit', borderColor: c.style.border }}>
              <div style={{ fontSize: 28, fontFamily: 'DM Serif Display, serif', color: c.style.color, lineHeight: 1 }}>
                {c.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between' }}>
                {c.label}
                <ArrowRight size={12} />
              </div>
            </button>
          ))}
        </div>

        {/* Full lifecycle breakdown */}
        <div className="mb-6">
          <div className="block-label">Full Lifecycle Breakdown</div>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            {(Object.keys(STATUS_LABEL) as FormStatus[]).map(s => {
              const style = STATUS_STYLE[s];
              return (
                <button key={s} onClick={() => router.push(`/form-creation?status=${s}`)}
                  style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.color,
                    borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6 }}>
                  {STATUS_LABEL[s]}
                  <span style={{ fontFamily: 'monospace' }}>{counts[s]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity size={18} style={{ color: 'var(--accent)' }} />
              <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: 'var(--text-primary)' }}>
                Recent Activity
              </h2>
            </div>
            <Button size="small" onClick={() => router.push('/form-creation/audit')}>View Full Audit Trail</Button>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'white' }}>
            {recentEvents.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2">
                <Activity size={28} style={{ color: 'var(--border-strong)' }} />
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No activity recorded yet</div>
              </div>
            ) : (
              recentEvents.map((e, idx) => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 16px',
                  borderBottom: idx === recentEvents.length - 1 ? 'none' : '1px solid var(--border)' }}>
                  <Tag style={{ fontSize: 10, fontWeight: 700, color: AUDIT_CATEGORY_COLOR[e.category],
                    borderColor: AUDIT_CATEGORY_COLOR[e.category], background: `${AUDIT_CATEGORY_COLOR[e.category]}12`,
                    flexShrink: 0, marginTop: 1 }}>
                    {AUDIT_CATEGORY_LABEL[e.category]}
                  </Tag>
                  <div style={{ flex: 1, fontSize: 12.5, color: 'var(--text-primary)' }}>{e.detail}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {e.actor} · {new Date(e.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
