'use client';

import {
  Check, X, AlertTriangle, PenLine, Plus, Trash2, Clock, Info, Cpu, Paperclip,
} from 'lucide-react';
import type { FormField, FormPage, SignatureRecord, MasterBinding, TableColumn } from '../types';
import {
  evaluateVisibility, weighResult, phResult, calcResult,
  simulateInstrumentCapture, getMasterAutoFill, INSTRUMENT_TYPE_LABEL,
  type InstrumentCapture,
} from '../formUtils';
import { PROJECT_MASTER, SAMPLE_MASTER, INSTRUMENT_MASTER, USER_MASTER } from '../masterData';

/* ════════════════════════════════════════════════════════════════════
   PUBLIC TYPES
════════════════════════════════════════════════════════════════════ */

export type FieldRendererMode = 'edit' | 'print';

/** Raised when the user clicks "Sign" on an e-signature / step sign-off.
 *  The host screen owns the signing modal (username/password/meaning/
 *  reason) and writes the resulting SignatureRecord back into `signatures`. */
export type SignRequest = {
  signKey: string;
  fieldLabel: string;
  role?: string;
  requirePassword?: boolean;
};

export type FieldRendererProps = {
  field: FormField;
  /** All pages of the form/instance — used for calculation formulas and
   *  smart-field auto-population (matches fields by label). */
  pages: FormPage[];
  values: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
  mode?: FieldRendererMode;
  signatures?: Record<string, SignatureRecord>;
  onRequestSign?: (req: SignRequest) => void;
  /** Called in addition to the built-in simulation when an
   *  instrument-capture field is captured (e.g. to log an audit event). */
  onCapture?: (field: FormField, capture: InstrumentCapture) => void;
  /** Reference text encoded by `qrcode` fields (e.g. instance/form number). */
  contextRef?: string;
};

/* ════════════════════════════════════════════════════════════════════
   SHARED STYLES
════════════════════════════════════════════════════════════════════ */

const wrapperStyle = { marginBottom: 18 } as const;

const labelStyle = {
  fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
  marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4,
} as const;

const helpStyle = { fontSize: 11, color: 'var(--text-muted)', marginTop: 4 } as const;

const hintStyle = { fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 } as const;

const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: 6,
  border: '1px solid var(--border)', background: '#fff',
  fontSize: 13, color: 'var(--text-primary)', fontFamily: 'inherit', boxSizing: 'border-box',
} as const;

const printBoxStyle = {
  width: '100%', minHeight: 28, padding: '5px 6px', boxSizing: 'border-box',
  borderBottom: '1px solid var(--border-strong)',
  fontSize: 13, color: 'var(--text-primary)',
} as const;

const signButtonStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px',
  borderRadius: 6, border: '1px solid var(--border-strong)', background: '#fff',
  fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer',
} as const;

const smallBtnStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
  borderRadius: 5, border: '1px solid var(--border-strong)', background: '#fff',
  fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer',
} as const;

const fileLabelStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px',
  borderRadius: 6, border: '1px dashed var(--border-strong)', background: '#fff',
  fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer',
} as const;

const sectionHeaderStyle = {
  fontFamily: "'DM Serif Display', serif", fontSize: 19, fontWeight: 400,
  color: 'var(--text-primary)', borderBottom: '2px solid var(--accent)',
  paddingBottom: 6, marginBottom: 14, marginTop: 6,
} as const;

const instructionBoxStyle = {
  display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px',
  borderRadius: 6, background: 'var(--accent-light)', color: 'var(--accent-hover)',
  fontSize: 12.5, marginBottom: 14, lineHeight: 1.5,
} as const;

const dividerStyle = { border: 'none', borderTop: '1px solid var(--border)', margin: '18px 0' } as const;

const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: 12 } as const;
const thStyle = {
  border: '1px solid var(--border-strong)', background: 'var(--bg-card)',
  padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)',
} as const;
const tdStyle = { border: '1px solid var(--border)', padding: '4px 6px', verticalAlign: 'top' } as const;
const cellInputStyle = {
  width: '100%', border: 'none', background: 'transparent', fontSize: 12,
  padding: '2px 4px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
} as const;
const subTableStyle = { width: '100%', borderCollapse: 'collapse' } as const;
const subTdStyle = { border: '1px solid var(--border)', padding: 2 } as const;

/* ════════════════════════════════════════════════════════════════════
   SMALL HELPERS
════════════════════════════════════════════════════════════════════ */

function ValueBox({ mode, value, type = 'text', placeholder, onChange }: {
  mode: FieldRendererMode; value?: string; type?: string; placeholder?: string;
  onChange: (v: string) => void;
}) {
  if (mode === 'print') return <div style={printBoxStyle}>{value || ' '}</div>;
  return (
    <input type={type} style={inputStyle} value={value ?? ''} placeholder={placeholder}
      onChange={e => onChange(e.target.value)} />
  );
}

const OUTCOME_STYLE: Record<'pass' | 'fail' | 'reweigh', { bg: string; color: string; icon: typeof Check }> = {
  pass:    { bg: 'var(--status-pass-bg)', color: 'var(--status-pass)', icon: Check },
  fail:    { bg: 'var(--status-fail-bg)', color: 'var(--status-fail)', icon: X },
  reweigh: { bg: 'var(--status-warn-bg)', color: 'var(--status-warn)', icon: AlertTriangle },
};

function ResultBadge({ outcome, passLabel, failLabel, reweighLabel }: {
  outcome: 'pass' | 'fail' | 'reweigh' | null;
  passLabel?: string; failLabel?: string; reweighLabel?: string;
}) {
  if (!outcome) return null;
  const s = OUTCOME_STYLE[outcome];
  const Icon = s.icon;
  const label = outcome === 'pass' ? (passLabel || 'Pass')
    : outcome === 'fail' ? (failLabel || 'Fail')
    : (reweighLabel || 'Reweigh');
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px',
      borderRadius: 999, background: s.bg, color: s.color, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      <Icon size={12} />{label}
    </span>
  );
}

/** Deterministic CSS-grid "QR code" placeholder — same fake-rendering
 *  approach as the user-barcode pattern in AppLayout. */
export function QrPattern({ seed, size = 84 }: { seed: string; size?: number }) {
  const cells = 8;
  const hash = (s: string, i: number) => {
    let h = i * 2654435761;
    for (let c = 0; c < s.length; c++) h = (h * 31 + s.charCodeAt(c)) >>> 0;
    return h;
  };
  return (
    <div style={{
      width: size, height: size, display: 'grid',
      gridTemplateColumns: `repeat(${cells}, 1fr)`, gridTemplateRows: `repeat(${cells}, 1fr)`,
      border: '5px solid #1C1B18', background: '#fff', padding: 4, gap: 1, flexShrink: 0,
    }}>
      {Array.from({ length: cells * cells }).map((_, i) => {
        const row = Math.floor(i / cells), col = i % cells;
        const isCorner = (row < 2 && col < 2) || (row < 2 && col > cells - 3) || (row > cells - 3 && col < 2);
        const on = isCorner || (hash(seed, i) % 5) < 2;
        return <div key={i} style={{ background: on ? '#1C1B18' : '#fff' }} />;
      })}
    </div>
  );
}

/** Deterministic vertical-bar "barcode" placeholder. */
export function BarcodePattern({ value }: { value: string }) {
  const seed = value || 'NO-CODE';
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', height: 38, gap: 1,
      background: '#fff', padding: '4px 8px', border: '1px solid var(--border)', width: 'fit-content',
    }}>
      {Array.from({ length: 40 }).map((_, i) => {
        const code = seed.charCodeAt(i % seed.length) || 1;
        const w = (code % 3) + 1;
        const dark = (code + i) % 2 === 0;
        return <div key={i} style={{ width: w, background: dark ? '#1C1B18' : 'transparent' }} />;
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   E-SIGNATURE / SIGN-OFF BLOCK
════════════════════════════════════════════════════════════════════ */

function SignatureBlock({ signKey, label, role, requirePassword, signatures, onRequestSign, mode }: {
  signKey: string; label: string; role?: string; requirePassword?: boolean;
  signatures?: Record<string, SignatureRecord>; mode: FieldRendererMode;
  onRequestSign?: (req: SignRequest) => void;
}) {
  const sig = signatures?.[signKey];
  if (sig) {
    return (
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px',
        borderRadius: 6, background: 'var(--status-pass-bg)', border: '1px solid var(--status-pass)',
      }}>
        <PenLine size={14} color="var(--status-pass)" style={{ marginTop: 2, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {sig.userName} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({sig.role})</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {sig.meaning} — {new Date(sig.timestamp).toLocaleString()}
          </div>
          {sig.reason && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Reason: {sig.reason}</div>}
        </div>
      </div>
    );
  }
  if (mode === 'print') return <div style={printBoxStyle}>&nbsp;</div>;
  return (
    <button type="button" style={signButtonStyle}
      onClick={() => onRequestSign?.({ signKey, fieldLabel: label, role, requirePassword })}>
      <PenLine size={14} /> Click to Sign
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TABLE / DYNAMIC TABLE
════════════════════════════════════════════════════════════════════ */

function TableCell({ field, col, rowIdx, values, onChange, mode }: {
  field: FormField; col: TableColumn; rowIdx: number;
  values: Record<string, string>; onChange: (id: string, v: string) => void; mode: FieldRendererMode;
}) {
  const key = `${field.id}_${rowIdx}_${col.id}`;

  if (col.type === 'subtable') {
    const subCols = col.subColumns ?? [];
    return (
      <table style={subTableStyle}><tbody>
        {Array.from({ length: 2 }).map((_, sri) => (
          <tr key={sri}>
            {subCols.map(sc => {
              const subKey = `${key}_${sri}_${sc.id}`;
              return (
                <td key={sc.id} style={subTdStyle}>
                  {mode === 'print'
                    ? <span style={{ fontSize: 11 }}>{values[subKey] || ' '}</span>
                    : <input style={cellInputStyle} value={values[subKey] ?? ''} placeholder={sc.header}
                        onChange={e => onChange(subKey, e.target.value)} />}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody></table>
    );
  }

  if (col.type === 'dropdown') {
    const opts = (col.options ?? '').split(',').map(s => s.trim()).filter(Boolean);
    if (mode === 'print') return <span>{values[key] || ' '}</span>;
    return (
      <select style={cellInputStyle} value={values[key] ?? ''} onChange={e => onChange(key, e.target.value)}>
        <option value="">—</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  if (mode === 'print') return <span>{values[key] || ' '}</span>;
  return (
    <input type={col.type === 'number' ? 'number' : 'text'} style={cellInputStyle}
      value={values[key] ?? ''} onChange={e => onChange(key, e.target.value)} />
  );
}

function FieldTable({ field, values, onChange, mode, dynamic }: {
  field: FormField; values: Record<string, string>; onChange: (id: string, v: string) => void;
  mode: FieldRendererMode; dynamic: boolean;
}) {
  const cols = field.columns ?? [];
  const rowKey = `${field.id}__rows`;
  const minRows = field.minRows ?? 1;
  const maxRows = field.maxRows ?? 50;
  const fallback = field.defaultRows ?? (dynamic ? minRows : 3);
  const rowCount = Math.max(1, parseInt(values[rowKey] ?? '', 10) || fallback);

  const setRows = (n: number) => onChange(rowKey, String(Math.max(minRows, Math.min(maxRows, n))));
  const canAdd = mode === 'edit' && (dynamic || field.allowAddRows) && rowCount < maxRows;
  const canRemove = mode === 'edit' && dynamic && rowCount > minRows;

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead><tr>{cols.map(c => <th key={c.id} style={thStyle}>{c.header}</th>)}</tr></thead>
          <tbody>
            {Array.from({ length: rowCount }).map((_, ri) => (
              <tr key={ri}>
                {cols.map(c => (
                  <td key={c.id} style={tdStyle}>
                    <TableCell field={field} col={c} rowIdx={ri} values={values} onChange={onChange} mode={mode} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(canAdd || canRemove) && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {canAdd && (
            <button type="button" style={smallBtnStyle} onClick={() => setRows(rowCount + 1)}>
              <Plus size={12} /> Add Row
            </button>
          )}
          {canRemove && (
            <button type="button" style={smallBtnStyle} onClick={() => setRows(rowCount - 1)}>
              <Trash2 size={12} /> Remove Row
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   SMART / MASTER-DATA-BOUND FIELDS
════════════════════════════════════════════════════════════════════ */

function smartFieldOptions(field: FormField): { value: string; label: string }[] {
  const binding = field.masterBinding;
  switch (binding) {
    case 'project':
      return PROJECT_MASTER.map(p => ({ value: p.projectNo, label: `${p.projectNo} — ${p.name}` }));
    case 'sample':
      return SAMPLE_MASTER.map(s => ({ value: s.sampleId, label: `${s.sampleId} (${s.matrix}, ${s.status})` }));
    case 'instrument':
      return INSTRUMENT_MASTER
        .filter(i => !field.instrumentType || i.type === field.instrumentType)
        .map(i => ({ value: i.instrumentId, label: `${i.instrumentId} — ${i.name}` }));
    case 'user':
      return USER_MASTER.map(u => ({ value: u.userId, label: `${u.name} — ${u.role}` }));
    default:
      return [];
  }
}

function SmartSelect({ field, values, onChange, pages, mode }: {
  field: FormField; values: Record<string, string>; onChange: (id: string, v: string) => void;
  pages: FormPage[]; mode: FieldRendererMode;
}) {
  const options = smartFieldOptions(field);
  const current = values[field.id] ?? '';

  if (mode === 'print') {
    const found = options.find(o => o.value === current);
    return <div style={printBoxStyle}>{found?.label ?? current ?? ' '}</div>;
  }

  return (
    <select style={inputStyle} value={current} onChange={e => {
      const v = e.target.value;
      onChange(field.id, v);
      const binding = field.masterBinding as MasterBinding;
      const fills = getMasterAutoFill(binding, v, pages);
      Object.entries(fills).forEach(([fid, val]) => onChange(fid, val));
    }}>
      <option value="">— Select —</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* ════════════════════════════════════════════════════════════════════
   ATTACHMENT
════════════════════════════════════════════════════════════════════ */

function AttachmentField({ fieldId, values, onChange, mode, label }: {
  fieldId: string; values: Record<string, string>; onChange: (id: string, v: string) => void;
  mode: FieldRendererMode; label?: string;
}) {
  const filename = values[fieldId];
  if (mode === 'print') return <div style={printBoxStyle}>{filename ? `Attached: ${filename}` : '(no attachment)'}</div>;
  return (
    <label style={fileLabelStyle}>
      <Paperclip size={14} />
      <span>{filename || label || 'Choose file…'}</span>
      <input type="file" style={{ display: 'none' }}
        onChange={e => onChange(fieldId, e.target.files?.[0]?.name ?? '')} />
    </label>
  );
}

/* ════════════════════════════════════════════════════════════════════
   INSTRUMENT CAPTURE
════════════════════════════════════════════════════════════════════ */

function InstrumentCaptureField({ field, values, onChange, mode, onCapture }: {
  field: FormField; values: Record<string, string>; onChange: (id: string, v: string) => void;
  mode: FieldRendererMode; onCapture?: (field: FormField, capture: InstrumentCapture) => void;
}) {
  const value = values[field.id];
  const instrumentId = values[`${field.id}__instrument`];
  const instrumentName = values[`${field.id}__instrumentName`];
  const timestamp = values[`${field.id}__timestamp`];
  const unit = values[`${field.id}__unit`] || field.captureUnit || '';

  const capture = () => {
    const result = simulateInstrumentCapture(field, INSTRUMENT_MASTER);
    onChange(field.id, result.value);
    onChange(`${field.id}__unit`, result.unit);
    onChange(`${field.id}__instrument`, result.instrumentId);
    onChange(`${field.id}__instrumentName`, result.instrumentName);
    onChange(`${field.id}__timestamp`, result.timestamp);
    onCapture?.(field, result);
  };

  if (mode === 'print') {
    return (
      <div style={printBoxStyle}>
        {value ? `${value} ${unit} — ${instrumentId} @ ${timestamp}` : ' '}
      </div>
    );
  }

  return (
    <div>
      {field.targetWeight !== undefined && (
        <div style={hintStyle}>
          Target: {field.targetWeight} {field.weightUnit} (±{(field.toleranceMax ?? 102) - 100}%)
        </div>
      )}
      {value ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
          borderRadius: 6, background: 'var(--accent-light)', border: '1px solid var(--accent)',
        }}>
          <Cpu size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{value} {unit}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{instrumentName} ({instrumentId}) — {timestamp}</div>
          </div>
          <button type="button" style={smallBtnStyle} onClick={capture}>Re-capture</button>
        </div>
      ) : (
        <button type="button" style={signButtonStyle} onClick={capture}>
          <Cpu size={14} /> Capture from {INSTRUMENT_TYPE_LABEL[field.instrumentType ?? 'balance']}
        </button>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   STEP SECTION
════════════════════════════════════════════════════════════════════ */

function StepSection(props: FieldRendererProps) {
  const { field: f, values, onChange, mode = 'edit', signatures, onRequestSign } = props;
  return (
    <div style={{ marginBottom: 18 }}>
      {(f.steps ?? []).map((step, i) => (
        <div key={step.id} style={{
          border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 12, background: '#fff',
        }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: step.instruction ? 4 : 8 }}>
            Step {i + 1}: {step.title}
          </div>
          {step.instruction && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>{step.instruction}</div>
          )}
          {step.fields.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: step.attachmentLabel || step.hasSignDate ? 10 : 0 }}>
              {step.fields.map(sf => {
                const key = `${f.id}_${step.id}_${sf.id}`;
                return (
                  <div key={sf.id} style={{ flex: '1 1 160px', minWidth: 140 }}>
                    <div style={labelStyle}>{sf.label}</div>
                    <ValueBox mode={mode} value={values[key]} placeholder={sf.placeholder}
                      onChange={v => onChange(key, v)} />
                  </div>
                );
              })}
            </div>
          )}
          {step.attachmentLabel && (
            <div style={{ marginBottom: step.hasSignDate ? 10 : 0 }}>
              <div style={labelStyle}>{step.attachmentLabel}</div>
              <AttachmentField fieldId={`${f.id}_${step.id}__att`} values={values} onChange={onChange} mode={mode} />
            </div>
          )}
          {step.hasSignDate && (
            <SignatureBlock signKey={`${f.id}_${step.id}__sign`} label={step.title} role="Analyst"
              requirePassword={false} signatures={signatures} onRequestSign={onRequestSign} mode={mode} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   FIELD BODY DISPATCH
════════════════════════════════════════════════════════════════════ */

function renderBody(props: FieldRendererProps) {
  const { field: f, pages, values, onChange, mode = 'edit', signatures, onRequestSign, onCapture, contextRef } = props;

  switch (f.type) {
    case 'text':
      return <ValueBox mode={mode} value={values[f.id]} placeholder={f.placeholder} onChange={v => onChange(f.id, v)} />;

    case 'textarea':
      if (mode === 'print') return <div style={{ ...printBoxStyle, minHeight: 60, whiteSpace: 'pre-wrap' }}>{values[f.id] || ' '}</div>;
      return (
        <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={values[f.id] ?? ''}
          placeholder={f.placeholder} onChange={e => onChange(f.id, e.target.value)} />
      );

    case 'number': {
      const v = values[f.id] ?? '';
      if (mode === 'print') return <div style={printBoxStyle}>{v ? `${v}${f.unit ? ' ' + f.unit : ''}` : ' '}</div>;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="number" style={inputStyle} value={v} placeholder={f.placeholder}
            min={f.numMin} max={f.numMax} onChange={e => onChange(f.id, e.target.value)} />
          {f.unit && <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{f.unit}</span>}
        </div>
      );
    }

    case 'date':
      return <ValueBox mode={mode} type="date" value={values[f.id]} onChange={v => onChange(f.id, v)} />;

    case 'datetime':
      return <ValueBox mode={mode} type="datetime-local" value={values[f.id]} onChange={v => onChange(f.id, v)} />;

    case 'dropdown': {
      const opts = (f.options ?? '').split(',').map(s => s.trim()).filter(Boolean);
      if (mode === 'print') return <div style={printBoxStyle}>{values[f.id] || ' '}</div>;
      return (
        <select style={inputStyle} value={values[f.id] ?? ''} onChange={e => onChange(f.id, e.target.value)}>
          <option value="">— Select —</option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }

    case 'radio': {
      const opts = (f.options ?? '').split(',').map(s => s.trim()).filter(Boolean);
      if (mode === 'print') {
        return (
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13, padding: '4px 0' }}>
            {opts.map(o => <span key={o}>{values[f.id] === o ? '●' : '○'} {o}</span>)}
          </div>
        );
      }
      return (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {opts.map(o => (
            <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }}>
              <input type="radio" name={f.id} checked={values[f.id] === o} onChange={() => onChange(f.id, o)} />
              {o}
            </label>
          ))}
        </div>
      );
    }

    case 'checkbox': {
      const checked = values[f.id] === 'yes';
      if (mode === 'print') {
        return <div style={{ fontSize: 16, padding: '4px 0' }}>{checked ? '☑' : '☐'}</div>;
      }
      return (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={checked} onChange={e => onChange(f.id, e.target.checked ? 'yes' : 'no')}
            style={{ width: 16, height: 16 }} />
          <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Yes</span>
        </label>
      );
    }

    case 'weigh-slip': {
      const outcome = weighResult(f, values);
      return (
        <div>
          <div style={hintStyle}>
            Target: {f.targetWeight} {f.weightUnit} (Range {f.toleranceMin}%–{f.toleranceMax}% of target)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {mode === 'print'
              ? <div style={{ ...printBoxStyle, width: 140 }}>{values[f.id] ? `${values[f.id]} ${f.weightUnit}` : ' '}</div>
              : <input type="number" style={{ ...inputStyle, width: 140 }} value={values[f.id] ?? ''}
                  placeholder={`Actual (${f.weightUnit})`} onChange={e => onChange(f.id, e.target.value)} />}
            <ResultBadge outcome={outcome} passLabel={f.passLabel} failLabel={f.failLabel} reweighLabel={f.reweighLabel} />
          </div>
        </div>
      );
    }

    case 'ph-slip': {
      const outcome = phResult(f, values);
      return (
        <div>
          <div style={hintStyle}>Target pH: {f.targetPH} (Acceptable Range {f.phMin}–{f.phMax})</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {mode === 'print'
              ? <div style={{ ...printBoxStyle, width: 100 }}>{values[f.id] || ' '}</div>
              : <input type="number" step="0.01" style={{ ...inputStyle, width: 100 }} value={values[f.id] ?? ''}
                  onChange={e => onChange(f.id, e.target.value)} />}
            <ResultBadge outcome={outcome} passLabel="Pass" failLabel="Fail" />
          </div>
        </div>
      );
    }

    case 'calculation':
      return (
        <div style={{
          ...printBoxStyle, fontWeight: 600,
          background: mode === 'edit' ? 'var(--accent-light)' : undefined,
          border: mode === 'edit' ? '1px solid var(--border)' : undefined,
          borderRadius: mode === 'edit' ? 6 : undefined,
        }}>
          {calcResult(f, pages, values)}
        </div>
      );

    case 'barcode': {
      const val = values[f.id] ?? '';
      return (
        <div>
          {mode === 'edit' && (
            <input style={inputStyle} value={val} placeholder={f.placeholder || 'Scan or enter code'}
              onChange={e => onChange(f.id, e.target.value)} />
          )}
          <div style={{ marginTop: mode === 'edit' ? 8 : 0 }}>
            <BarcodePattern value={val || f.label} />
            {val && <div style={{ fontSize: 11, fontFamily: 'monospace', marginTop: 4, color: 'var(--text-muted)' }}>{val}</div>}
          </div>
        </div>
      );
    }

    case 'table':
      return <FieldTable field={f} values={values} onChange={onChange} mode={mode} dynamic={false} />;

    case 'dynamic-table':
      return <FieldTable field={f} values={values} onChange={onChange} mode={mode} dynamic />;

    case 'e-signature':
      return (
        <SignatureBlock signKey={f.id} label={f.label} role={f.signatureRole} requirePassword={f.requirePassword}
          signatures={signatures} onRequestSign={onRequestSign} mode={mode} />
      );

    case 'timestamp': {
      const value = values[f.id];
      if (mode === 'print') return <div style={printBoxStyle}>{value || ' '}</div>;
      if (value) {
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ ...printBoxStyle, flex: 1 }}>{value}</div>
            <button type="button" style={smallBtnStyle} onClick={() => onChange(f.id, '')}>Clear</button>
          </div>
        );
      }
      return (
        <button type="button" style={signButtonStyle} onClick={() => onChange(f.id, new Date().toLocaleString())}>
          <Clock size={14} /> Stamp Current Time
        </button>
      );
    }

    case 'initials':
      return mode === 'print'
        ? <div style={printBoxStyle}>{values[f.id] || ' '}</div>
        : <input style={{ ...inputStyle, width: 90, textTransform: 'uppercase' }} maxLength={4}
            value={values[f.id] ?? ''} placeholder="XX" onChange={e => onChange(f.id, e.target.value.toUpperCase())} />;

    case 'qrcode': {
      const seed = contextRef || f.label;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
          <QrPattern seed={seed} />
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{seed}</div>
        </div>
      );
    }

    case 'sample-id':
    case 'project-id':
    case 'instrument':
    case 'user-field':
      return <SmartSelect field={f} values={values} onChange={onChange} pages={pages} mode={mode} />;

    case 'attachment':
      return <AttachmentField fieldId={f.id} values={values} onChange={onChange} mode={mode} />;

    case 'instrument-capture':
      return <InstrumentCaptureField field={f} values={values} onChange={onChange} mode={mode} onCapture={onCapture} />;

    default:
      return null;
  }
}

/* ════════════════════════════════════════════════════════════════════
   ROOT COMPONENT
════════════════════════════════════════════════════════════════════ */

const LAYOUT_TYPES = new Set(['section-header', 'instruction', 'divider', 'step-section']);

export default function FieldRenderer(props: FieldRendererProps) {
  const { field: f, values, mode = 'edit' } = props;

  if (!evaluateVisibility(f.visibilityRule, values)) return null;

  if (LAYOUT_TYPES.has(f.type)) {
    switch (f.type) {
      case 'section-header':
        return <div style={sectionHeaderStyle}>{f.content || f.label}</div>;
      case 'instruction':
        return <div style={instructionBoxStyle}><Info size={15} style={{ flexShrink: 0, marginTop: 1 }} /><span>{f.content}</span></div>;
      case 'divider':
        return <hr style={dividerStyle} />;
      case 'step-section':
        return <StepSection {...props} />;
      default:
        return null;
    }
  }

  return (
    <div style={wrapperStyle}>
      <div style={labelStyle}>
        <span>{f.label}</span>
        {f.required && <span style={{ color: '#C0504D' }}>*</span>}
      </div>
      {renderBody(props)}
      {f.helpText && mode === 'edit' && <div style={helpStyle}>{f.helpText}</div>}
    </div>
  );
}
