"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Tabs, Modal, Input, Select, message } from "antd";
import {
  ArrowLeft, Lock, Printer, ScrollText, Send, RotateCcw, CheckCircle2, Save, Info,
} from "lucide-react";
import type { FormIssuedInstance, SignatureRecord, InstanceStatus, FormField } from "../../types";
import { getInstance, upsertInstance } from "../../instances";
import { logAuditEvent } from "../../formAudit";
import { INSTANCE_STATUS_LABEL, INSTANCE_STATUS_STYLE, evaluateVisibility, type InstrumentCapture } from "../../formUtils";
import { CURRENT_USER, SIGNATURE_MEANINGS } from "../../masterData";
import FieldRenderer, { type SignRequest } from "../../shared/FieldRenderer";

const { Option } = Select;
const { TextArea } = Input;

const DEMO_PASSWORD = 'demo';

const NON_VALUE_TYPES = new Set<FormField['type']>(['section-header', 'instruction', 'divider', 'step-section']);

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
   FORM EXECUTION
════════════════════════════════════════════════════════════════════ */

export default function ExecuteFormPage({ params }: { params: Promise<{ instanceId: string }> }) {
  const router = useRouter();
  const { instanceId } = use(params);

  const [instanceState, setInstanceState] = useState<FormIssuedInstance | null>(() => getInstance(instanceId));
  const [values, setValues] = useState<Record<string, string>>(() => instanceState?.values ?? {});
  const [signatures, setSignatures] = useState<Record<string, SignatureRecord>>(() => instanceState?.signatures ?? {});
  const [activePage, setActivePage] = useState(0);

  const [signRequest, setSignRequest] = useState<SignRequest | null>(null);
  const [meaningVal, setMeaningVal] = useState('');
  const [reasonVal, setReasonVal] = useState('');
  const [passwordVal, setPasswordVal] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  if (!instanceState) {
    return (
      <AppLayout>
        <div className="page-container">
          <div className="flex flex-col items-center py-20 gap-3">
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Instance not found.</div>
            <Button onClick={() => router.push('/form-creation/instances')}>Back to Issued Instances</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const inst = instanceState;
  const isReadOnly = inst.status === 'completed' || inst.status === 'approved';
  const mode = isReadOnly ? 'print' : 'edit';
  const page = inst.pages[activePage] ?? inst.pages[0];

  function persist(changes: Partial<FormIssuedInstance>): FormIssuedInstance {
    const updated = { ...inst, ...changes };
    setInstanceState(updated);
    upsertInstance(updated);
    return updated;
  }

  function handleChange(fieldId: string, v: string) {
    setValues(prev => ({ ...prev, [fieldId]: v }));
  }

  function handleCapture(field: FormField, capture: InstrumentCapture) {
    const updatedValues = {
      ...values,
      [field.id]: capture.value,
      [`${field.id}__unit`]: capture.unit,
      [`${field.id}__instrument`]: capture.instrumentId,
      [`${field.id}__instrumentName`]: capture.instrumentName,
      [`${field.id}__timestamp`]: capture.timestamp,
      [`${field.id}__operator`]: CURRENT_USER.name,
    };
    setValues(updatedValues);
    persist({ values: updatedValues, signatures });
    logAuditEvent({
      actor: CURRENT_USER.name, actorRole: CURRENT_USER.role, category: 'instrument-capture',
      instanceId: inst.id, instanceNo: inst.instanceNo, formNo: inst.formNo,
      field: field.label, newValue: `${capture.value} ${capture.unit}`,
      detail: `Captured ${capture.value} ${capture.unit} for "${field.label}" from ${capture.instrumentName} (${capture.instrumentId}) — ${capture.timestamp}.`,
    });
  }

  function handleRequestSign(req: SignRequest) {
    setSignRequest(req);
    setMeaningVal(req.role || 'Approved By');
    setReasonVal('');
    setPasswordVal('');
    setPasswordError(false);
  }

  function confirmSign() {
    if (!signRequest) return;
    if (signRequest.requirePassword && passwordVal !== DEMO_PASSWORD) {
      setPasswordError(true);
      return;
    }
    const record: SignatureRecord = {
      userId: CURRENT_USER.userId, userName: CURRENT_USER.name, role: CURRENT_USER.role,
      meaning: meaningVal, reason: reasonVal, timestamp: new Date().toISOString(),
    };
    const updatedSignatures = { ...signatures, [signRequest.signKey]: record };
    setSignatures(updatedSignatures);
    persist({ values, signatures: updatedSignatures });
    logAuditEvent({
      actor: CURRENT_USER.name, actorRole: CURRENT_USER.role, category: 'instance-signed',
      instanceId: inst.id, instanceNo: inst.instanceNo, formNo: inst.formNo,
      field: signRequest.fieldLabel,
      detail: `"${signRequest.fieldLabel}" signed by ${CURRENT_USER.name} (${meaningVal})${reasonVal ? ` — ${reasonVal}` : ''}.`,
    });
    message.success('Signed.');
    setSignRequest(null);
  }

  function getMissingRequiredFields(): string[] {
    const missing: string[] = [];
    for (const pg of inst.pages) {
      for (const f of pg.fields) {
        if (!f.required || NON_VALUE_TYPES.has(f.type)) continue;
        if (!evaluateVisibility(f.visibilityRule, values)) continue;
        if (f.type === 'e-signature') {
          if (!signatures[f.id]) missing.push(f.label);
        } else if (!values[f.id]) {
          missing.push(f.label);
        }
      }
    }
    return missing;
  }

  function logStatusChange(oldStatus: InstanceStatus, newStatus: InstanceStatus, detail: string) {
    logAuditEvent({
      actor: CURRENT_USER.name, actorRole: CURRENT_USER.role, category: 'instance-status',
      instanceId: inst.id, instanceNo: inst.instanceNo, formNo: inst.formNo,
      oldValue: INSTANCE_STATUS_LABEL[oldStatus], newValue: INSTANCE_STATUS_LABEL[newStatus],
      detail,
    });
  }

  function handleSave() {
    const oldStatus = inst.status;
    const newStatus: InstanceStatus = oldStatus === 'issued' ? 'in-progress' : oldStatus;
    persist({ values, signatures, status: newStatus });
    if (newStatus !== oldStatus) {
      logStatusChange(oldStatus, newStatus, `${inst.instanceNo} status changed from ${INSTANCE_STATUS_LABEL[oldStatus]} to ${INSTANCE_STATUS_LABEL[newStatus]}.`);
    }
    message.success('Progress saved.');
  }

  function handleSubmitForReview() {
    const missing = getMissingRequiredFields();
    if (missing.length > 0) {
      Modal.warning({
        title: 'Cannot submit for review',
        content: `Please complete the following required field(s) first: ${missing.join(', ')}`,
      });
      return;
    }
    const oldStatus = inst.status;
    persist({ values, signatures, status: 'under-review' });
    logStatusChange(oldStatus, 'under-review', `${inst.instanceNo} submitted for review by ${CURRENT_USER.name}.`);
    message.success('Submitted for review.');
  }

  function handleReturnToProgress() {
    const oldStatus = inst.status;
    persist({ values, signatures, status: 'in-progress' });
    logStatusChange(oldStatus, 'in-progress', `${inst.instanceNo} returned to In Progress by ${CURRENT_USER.name}.`);
    message.success('Returned to In Progress.');
  }

  function handleApprove() {
    const oldStatus = inst.status;
    const now = new Date().toISOString();
    persist({ values, signatures, status: 'completed', completedAt: now });
    logStatusChange(oldStatus, 'completed', `${inst.instanceNo} marked Completed by ${CURRENT_USER.name}.`);
    message.success('Instance marked as Completed.');
  }

  return (
    <AppLayout>
      <div className="page-container">

        {/* Header */}
        <Button type="text" icon={<ArrowLeft size={14} />}
          onClick={() => router.push('/form-creation/instances')}
          style={{ marginBottom: 8, paddingLeft: 0, color: 'var(--text-muted)' }}>
          Back to Issued Instances
        </Button>

        <div className="flex items-start justify-between mb-4" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="section-title">{inst.formName}</h1>
            <p className="section-subtitle">
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>{inst.instanceNo}</span>
              {' '}· {inst.formNo} v{inst.version} · {inst.projectName} ({inst.projectNo}{inst.studyNo ? ` / ${inst.studyNo}` : ''})
            </p>
          </div>
          <InstanceStatusBadge status={inst.status} />
        </div>

        {/* Meta / actions bar */}
        <div className="flex items-center justify-between mb-4" style={{ flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Issued by {inst.issuedBy} on {new Date(inst.issuedAt).toLocaleString()}
            {inst.completedAt && <> · Completed {new Date(inst.completedAt).toLocaleString()}</>}
          </div>
          <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
            <Button icon={<Printer size={14} />}
              onClick={() => router.push(`/form-creation/print/${inst.formId}?instance=${inst.id}`)}>
              Print
            </Button>
            <Button icon={<ScrollText size={14} />}
              onClick={() => router.push(`/form-creation/audit?instanceId=${inst.id}`)}>
              Audit Trail
            </Button>
            {!isReadOnly && inst.status !== 'under-review' && (
              <>
                <Button icon={<Save size={14} />} onClick={handleSave}>Save Progress</Button>
                <Button type="primary" icon={<Send size={14} />} onClick={handleSubmitForReview}>Submit for Review</Button>
              </>
            )}
            {inst.status === 'under-review' && (
              <>
                <Button icon={<RotateCcw size={14} />} onClick={handleReturnToProgress}>Return to In Progress</Button>
                <Button type="primary" icon={<CheckCircle2 size={14} />} onClick={handleApprove}>Approve</Button>
              </>
            )}
          </div>
        </div>

        {isReadOnly && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px',
            borderRadius: 6, background: 'var(--accent-light)', color: 'var(--accent-hover)',
            fontSize: 12.5, marginBottom: 14, lineHeight: 1.5,
          }}>
            <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              This instance is <strong>{INSTANCE_STATUS_LABEL[inst.status]}</strong> and is shown read-only.
            </span>
          </div>
        )}

        {/* Page tabs */}
        {inst.pages.length > 1 && (
          <Tabs
            activeKey={String(activePage)}
            onChange={k => setActivePage(Number(k))}
            items={inst.pages.map((p, i) => ({ key: String(i), label: p.title }))}
            size="small"
            style={{ marginBottom: 12 }}
          />
        )}

        {/* Form body */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '24px 28px' }}>
          {(!page || page.fields.length === 0) && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              This page has no fields.
            </div>
          )}
          {page?.fields.map(f => (
            <FieldRenderer key={f.id} field={f} pages={inst.pages} values={values} onChange={handleChange}
              mode={mode} signatures={signatures} onRequestSign={handleRequestSign} onCapture={handleCapture}
              contextRef={inst.instanceNo} />
          ))}
        </div>

        {/* E-signature confirmation modal */}
        <Modal
          title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={16} /> Electronic Signature
          </span>}
          open={!!signRequest}
          onCancel={() => setSignRequest(null)}
          onOk={confirmSign}
          okText="Sign"
          width={420}
          zIndex={1100}
          destroyOnHidden
        >
          {signRequest && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Signing: <strong style={{ color: 'var(--text-primary)' }}>{signRequest.fieldLabel}</strong>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>User</div>
                <Input value={`${CURRENT_USER.name} (${CURRENT_USER.userId})`} disabled />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Meaning of Signature
                </div>
                <Select style={{ width: '100%' }} value={meaningVal} onChange={setMeaningVal}>
                  {SIGNATURE_MEANINGS.map(m => <Option key={m} value={m}>{m}</Option>)}
                </Select>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Reason / Comment
                </div>
                <TextArea rows={2} value={reasonVal} onChange={e => setReasonVal(e.target.value)}
                  placeholder="Optional reason for this signature…" />
              </div>
              {signRequest.requirePassword && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Password
                  </div>
                  <Input.Password value={passwordVal}
                    onChange={e => { setPasswordVal(e.target.value); setPasswordError(false); }}
                    placeholder="Enter password to confirm"
                    status={passwordError ? 'error' : undefined} />
                  {passwordError && (
                    <div style={{ fontSize: 11, color: '#C0504D', marginTop: 4 }}>
                      Incorrect password. (Demo password: &quot;{DEMO_PASSWORD}&quot;)
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal>

      </div>
    </AppLayout>
  );
}
