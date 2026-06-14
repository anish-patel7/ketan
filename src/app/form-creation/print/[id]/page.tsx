"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "antd";
import { ArrowLeft, Printer, ScrollText } from "lucide-react";
import type {
  FormPage, FormTemplate, FormIssuedInstance, FormHeaderConfig, FormFooterConfig,
} from "../../types";
import { getForm } from "../../store";
import { getInstance } from "../../instances";
import { STATUS_LABEL, INSTANCE_STATUS_LABEL } from "../../formUtils";
import FieldRenderer, { QrPattern, BarcodePattern } from "../../shared/FieldRenderer";

/* ════════════════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════════════ */

type SigRow = { signKey: string; label: string; role?: string };

/** Walks every page and collects e-signature fields and step-section
 *  sign-offs, in document order, for the signatures summary page. */
function collectSignatureSlots(pages: FormPage[]): SigRow[] {
  const rows: SigRow[] = [];
  for (const pg of pages) {
    for (const f of pg.fields) {
      if (f.type === 'e-signature') {
        rows.push({ signKey: f.id, label: f.label, role: f.signatureRole });
      } else if (f.type === 'step-section') {
        for (const step of f.steps ?? []) {
          if (step.hasSignDate) {
            rows.push({ signKey: `${f.id}_${step.id}__sign`, label: step.title, role: 'Analyst' });
          }
        }
      }
    }
  }
  return rows;
}

function getWatermark(form: FormTemplate | null, instance: FormIssuedInstance | null, header: FormHeaderConfig): string | undefined {
  if (header.watermarkText) return header.watermarkText;
  if (instance) return (instance.status === 'completed' || instance.status === 'approved') ? undefined : 'DRAFT — NOT FINAL';
  if (!form) return undefined;
  if (form.status === 'obsolete') return 'OBSOLETE';
  if (form.status === 'archived') return 'ARCHIVED';
  if (form.status !== 'live') return 'DRAFT';
  return undefined;
}

function noop() {}

/* ════════════════════════════════════════════════════════════════════
   HEADER / FOOTER
════════════════════════════════════════════════════════════════════ */

function PrintHeader({ header, formName, formNo, version, form, instance }: {
  header: FormHeaderConfig; formName: string; formNo: string; version: string;
  form: FormTemplate | null; instance: FormIssuedInstance | null;
}) {
  return (
    <div className="print-header">
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {header.showLogo && <div className="print-logo">{header.companyName.charAt(0)}</div>}
        <div>
          <div className="print-company">{header.companyName}</div>
          <div className="print-form-title">{formName}</div>
        </div>
      </div>
      <div className="print-meta">
        <div>Form No: {formNo}</div>
        <div>Version: {version}</div>
        {instance ? (
          <>
            <div>Instance: {instance.instanceNo}</div>
            <div>Project: {instance.projectNo}{instance.studyNo ? ` / ${instance.studyNo}` : ''}</div>
            <div>Status: {INSTANCE_STATUS_LABEL[instance.status]}</div>
          </>
        ) : form ? (
          <div>Status: {STATUS_LABEL[form.status]}</div>
        ) : null}
      </div>
    </div>
  );
}

function PrintFooter({ footer, contextRef, pageNo, totalPages }: {
  footer: FormFooterConfig; contextRef: string; pageNo: number; totalPages: number;
}) {
  return (
    <div className="print-footer">
      <div>{footer.showAuditRef ? `Ref: ${contextRef}` : ''}</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {footer.showPageNumbers && <span>Page {pageNo} of {totalPages}</span>}
        {footer.showQrCode && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <BarcodePattern value={contextRef} />
            <QrPattern seed={contextRef} size={40} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   PRINT / PDF ENGINE
════════════════════════════════════════════════════════════════════ */

export default function PrintFormPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ instance?: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { instance: instanceId } = use(searchParams);

  const form = getForm(id);
  const instance = instanceId ? getInstance(instanceId) : null;

  if (!form && !instance) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>Form not found.</div>
        <Button onClick={() => router.push('/form-creation')}>Back to Form Library</Button>
      </div>
    );
  }

  const pages       = instance?.pages ?? form?.pages ?? [];
  const header      = instance?.header ?? form?.header ?? { companyName: 'Aurora CRO Laboratories', showLogo: true };
  const footer      = instance?.footer ?? form?.footer ?? { showPageNumbers: true, showQrCode: true, showAuditRef: true };
  const orientation = instance?.orientation ?? form?.orientation ?? 'portrait';
  const values      = instance?.values ?? {};
  const signatures  = instance?.signatures ?? {};
  const formNo      = instance?.formNo ?? form?.formNo ?? '';
  const formName    = instance?.formName ?? form?.name ?? '';
  const version     = instance?.version ?? form?.version ?? '';
  const contextRef  = instance?.instanceNo ?? `${formNo} Rev ${version}`;

  const watermark  = getWatermark(form, instance, header);
  const sigRows    = collectSignatureSlots(pages);
  const totalPages = pages.length + (sigRows.length > 0 ? 1 : 0);
  const sheetClass = orientation === 'landscape' ? 'print-sheet-landscape' : 'print-sheet-portrait';

  return (
    <>
      <style>{`@page { size: A4 ${orientation}; margin: 10mm; }`}</style>

      <div className="no-print print-toolbar">
        <Button icon={<ArrowLeft size={14} />} onClick={() => router.back()}>Back</Button>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          Print Preview — {formName} {instance ? `(${instance.instanceNo})` : `(${formNo} v${version})`}
        </div>
        <div className="flex items-center gap-2">
          {instance && (
            <Button icon={<ScrollText size={14} />} onClick={() => router.push(`/form-creation/audit?instanceId=${instance.id}`)}>
              Audit Trail
            </Button>
          )}
          <Button type="primary" icon={<Printer size={14} />} onClick={() => window.print()}>
            Print / Save as PDF
          </Button>
        </div>
      </div>

      <div className="print-scroll">
        <div className={`print-sheet ${sheetClass}`}>
          {pages.map((p, i) => (
            <div className="print-page" key={p.id}>
              {watermark && <div className="print-watermark">{watermark}</div>}
              <PrintHeader header={header} formName={formName} formNo={formNo} version={version} form={form} instance={instance} />
              <div className="print-page-title">{p.title}</div>
              <div className="print-body">
                {p.fields.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>This page has no fields.</div>
                ) : (
                  p.fields.map(f => (
                    <FieldRenderer key={f.id} field={f} pages={pages} values={values} onChange={noop}
                      mode="print" signatures={signatures} contextRef={contextRef} />
                  ))
                )}
              </div>
              <PrintFooter footer={footer} contextRef={contextRef} pageNo={i + 1} totalPages={totalPages} />
            </div>
          ))}

          {sigRows.length > 0 && (
            <div className="print-page">
              {watermark && <div className="print-watermark">{watermark}</div>}
              <PrintHeader header={header} formName={formName} formNo={formNo} version={version} form={form} instance={instance} />
              <div className="print-page-title">Signatures &amp; Approvals</div>
              <div className="print-body">
                <table className="print-sig-table">
                  <thead>
                    <tr>
                      <th>Signature For</th>
                      <th>Role</th>
                      <th>Name</th>
                      <th>Meaning</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sigRows.map(row => {
                      const sig = signatures[row.signKey];
                      return (
                        <tr key={row.signKey}>
                          <td>{row.label}</td>
                          <td>{row.role || '—'}</td>
                          <td>{sig?.userName ?? '— Not signed —'}</td>
                          <td>{sig?.meaning ?? '—'}</td>
                          <td>{sig ? new Date(sig.timestamp).toLocaleString() : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <PrintFooter footer={footer} contextRef={contextRef} pageNo={totalPages} totalPages={totalPages} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
