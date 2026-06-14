"use client";

import { useState } from "react";
import { Modal, Button, Input, Select, Tabs } from "antd";
import { Lock } from "lucide-react";
import type { FormTemplate, SignatureRecord } from "../../types";
import FieldRenderer, { type SignRequest } from "../../shared/FieldRenderer";

const { Option } = Select;
const { TextArea } = Input;

const SIGN_MEANINGS = [
  'Performed By', 'Reviewed By', 'Approved By', 'Witnessed By', 'Prepared By', 'Checked By', 'Authorised By',
];

const DEMO_PASSWORD = 'demo';

/* ════════════════════════════════════════════════════════════════════
   PREVIEW MODAL — fill & sign the form exactly as an analyst would
════════════════════════════════════════════════════════════════════ */

export function PreviewModal({ open, form, onClose }:
  { open: boolean; form: FormTemplate; onClose: () => void }) {
  const [activePage, setActivePage] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [signatures, setSignatures] = useState<Record<string, SignatureRecord>>({});
  const [signRequest, setSignRequest] = useState<SignRequest | null>(null);
  const [meaningVal, setMeaningVal] = useState('');
  const [reasonVal, setReasonVal] = useState('');
  const [passwordVal, setPasswordVal] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  /* Reset fill state whenever the modal (re)opens for a form */
  const [resetKey, setResetKey] = useState<string | null>(null);
  const openKey = open ? form.id : null;
  if (openKey !== resetKey) {
    setResetKey(openKey);
    if (openKey !== null) {
      setActivePage(0);
      setValues({});
      setSignatures({});
    }
  }

  function handleChange(fieldId: string, v: string) {
    setValues(prev => ({ ...prev, [fieldId]: v }));
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
      userId: 'LIMS-USR-0042',
      userName: 'A. Liang',
      role: signRequest.role || 'Analyst',
      meaning: meaningVal,
      reason: reasonVal,
      timestamp: new Date().toISOString(),
    };
    setSignatures(prev => ({ ...prev, [signRequest.signKey]: record }));
    setSignRequest(null);
  }

  const page = form.pages[activePage];
  if (!page) return null;

  return (
    <Modal
      title={<span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 17 }}>
        Preview &amp; Fill — {form.name}
      </span>}
      open={open}
      onCancel={onClose}
      width={840}
      styles={{ body: { maxHeight: '72vh', overflowY: 'auto' } }}
      footer={[
        <Button key="reset" onClick={() => { setValues({}); setSignatures({}); }}>Reset</Button>,
        <Button key="close" type="primary" onClick={onClose}>Close</Button>,
      ]}
    >
      {form.pages.length > 1 && (
        <Tabs
          activeKey={String(activePage)}
          onChange={k => setActivePage(Number(k))}
          items={form.pages.map((p, i) => ({ key: String(i), label: p.title }))}
          size="small"
          style={{ marginBottom: 12 }}
        />
      )}

      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '24px 28px' }}>
        {page.fields.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            This page has no fields yet.
          </div>
        )}
        {page.fields.map(f => (
          <FieldRenderer key={f.id} field={f} pages={form.pages} values={values} onChange={handleChange}
            mode="edit" signatures={signatures} onRequestSign={handleRequestSign}
            contextRef={`${form.formNo} Rev ${form.version}`} />
        ))}
      </div>

      {/* ── E-signature confirmation modal ── */}
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
      >
        {signRequest && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Signing: <strong style={{ color: 'var(--text-primary)' }}>{signRequest.fieldLabel}</strong>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>User</div>
              <Input value="A. Liang (LIMS-USR-0042)" disabled />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Meaning of Signature
              </div>
              <Select style={{ width: '100%' }} value={meaningVal} onChange={setMeaningVal}>
                {SIGN_MEANINGS.map(m => <Option key={m} value={m}>{m}</Option>)}
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
    </Modal>
  );
}
