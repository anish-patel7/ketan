"use client";

import { useState } from "react";
import {
  Input, Select, InputNumber, Switch, Button, Tooltip, Divider,
} from "antd";
import { Trash2, Plus, X, ChevronRight } from "lucide-react";
import type {
  FormField, TableColumn, FormStep, StepInlineField, VisOperator,
} from "../../types";
import { evalFormula, VIS_OPERATOR_LABEL, INSTRUMENT_TYPE_LABEL } from "../../formUtils";
import { paletteInfo } from "./palette";

const { Option } = Select;
const { TextArea } = Input;

export const LABEL_S: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' };

export function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ ...LABEL_S, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   PROPERTIES PANEL (right panel)
════════════════════════════════════════════════════════════════════ */

export function PropertiesPanel({ field, allLabels, allFields, onChange, onDelete }:
  { field: FormField; allLabels: string[]; allFields: { id: string; label: string }[];
    onChange: (c: Partial<FormField>) => void; onDelete: () => void }) {
  const info = paletteInfo(field.type);
  const Icon = info.icon;

  return (
    <div style={{ padding: '16px 16px 32px' }}>
      {/* Field type header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
        paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: `${info.color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} style={{ color: info.color }} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{info.label}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Field properties</div>
        </div>
        <Tooltip title="Delete field">
          <button onClick={onDelete} style={{ marginLeft: 'auto', background: 'none', border: 'none',
            cursor: 'pointer', color: '#ef4444', padding: 4 }}>
            <Trash2 size={14} />
          </button>
        </Tooltip>
      </div>

      {/* Common: label */}
      {field.type !== 'divider' && (
        <PropRow label={field.type === 'step-section' ? 'Section Title' : 'Label'}>
          <Input size="small" value={field.type === 'section-header' || field.type === 'instruction'
            ? field.content ?? '' : field.label}
            onChange={e => onChange(
              field.type === 'section-header' || field.type === 'instruction'
                ? { content: e.target.value }
                : { label: e.target.value }
            )} />
        </PropRow>
      )}

      {/* Help text (most fields) */}
      {!['section-header','instruction','divider','e-signature','timestamp','step-section'].includes(field.type) && (
        <PropRow label="Help Text">
          <Input size="small" placeholder="Optional hint shown below field"
            value={field.helpText ?? ''}
            onChange={e => onChange({ helpText: e.target.value })} />
        </PropRow>
      )}

      {/* Required */}
      {!['section-header','instruction','divider','timestamp','step-section','qrcode'].includes(field.type) && (
        <PropRow label="Required">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Switch size="small" checked={field.required}
              onChange={v => onChange({ required: v })} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {field.required ? 'Required field' : 'Optional field'}
            </span>
          </div>
        </PropRow>
      )}

      <Divider style={{ margin: '14px 0', borderColor: 'var(--border)' }} />

      {/* ── Type-specific properties ── */}

      {(field.type === 'text' || field.type === 'barcode') && (
        <PropRow label="Placeholder">
          <Input size="small" value={field.placeholder ?? ''}
            onChange={e => onChange({ placeholder: e.target.value })} />
        </PropRow>
      )}

      {field.type === 'textarea' && (
        <PropRow label="Placeholder">
          <Input size="small" value={field.placeholder ?? ''}
            onChange={e => onChange({ placeholder: e.target.value })} />
        </PropRow>
      )}

      {field.type === 'number' && (
        <>
          <PropRow label="Unit">
            <Input size="small" placeholder="e.g. mg, mL, °C, RPM"
              value={field.unit ?? ''} onChange={e => onChange({ unit: e.target.value })} />
          </PropRow>
          <PropRow label="Decimal Places">
            <InputNumber size="small" min={0} max={6} style={{ width: '100%' }}
              value={field.decimals ?? 2} onChange={v => onChange({ decimals: v ?? 2 })} />
          </PropRow>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ ...LABEL_S, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Min</div>
              <InputNumber size="small" style={{ width: '100%' }} value={field.numMin}
                onChange={v => onChange({ numMin: v ?? undefined })} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ ...LABEL_S, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Max</div>
              <InputNumber size="small" style={{ width: '100%' }} value={field.numMax}
                onChange={v => onChange({ numMax: v ?? undefined })} />
            </div>
          </div>
        </>
      )}

      {(field.type === 'dropdown' || field.type === 'radio') && (
        <PropRow label="Options (comma-separated)">
          <TextArea rows={3} size="small"
            value={field.options ?? ''}
            onChange={e => onChange({ options: e.target.value })}
            placeholder="Option 1, Option 2, Option 3" />
        </PropRow>
      )}

      {field.type === 'weigh-slip' && (
        <>
          <PropRow label="Target Weight">
            <div style={{ display: 'flex', gap: 6 }}>
              <InputNumber size="small" style={{ flex: 1 }} value={field.targetWeight}
                onChange={v => onChange({ targetWeight: v ?? undefined })} />
              <Select size="small" style={{ width: 70 }} value={field.weightUnit ?? 'mg'}
                onChange={v => onChange({ weightUnit: v })}>
                {['µg','mg','g','kg'].map(u => <Option key={u} value={u}>{u}</Option>)}
              </Select>
            </div>
          </PropRow>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ ...LABEL_S, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Min %</div>
              <InputNumber size="small" style={{ width: '100%' }} min={0} max={100}
                value={field.toleranceMin ?? 98}
                onChange={v => onChange({ toleranceMin: v ?? 98 })} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ ...LABEL_S, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Max %</div>
              <InputNumber size="small" style={{ width: '100%' }} min={0} max={200}
                value={field.toleranceMax ?? 102}
                onChange={v => onChange({ toleranceMax: v ?? 102 })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Pass</div>
              <Input size="small" value={field.passLabel ?? 'Pass'}
                onChange={e => onChange({ passLabel: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Fail</div>
              <Input size="small" value={field.failLabel ?? 'Fail'}
                onChange={e => onChange({ failLabel: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Reweigh</div>
              <Input size="small" value={field.reweighLabel ?? 'Reweigh'}
                onChange={e => onChange({ reweighLabel: e.target.value })} />
            </div>
          </div>
        </>
      )}

      {field.type === 'ph-slip' && (
        <>
          <PropRow label="Target pH">
            <InputNumber size="small" style={{ width: '100%' }} step={0.1} min={0} max={14}
              value={field.targetPH ?? 7.0}
              onChange={v => onChange({ targetPH: v ?? 7.0 })} />
          </PropRow>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ ...LABEL_S, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Min</div>
              <InputNumber size="small" style={{ width: '100%' }} step={0.1} min={0} max={14}
                value={field.phMin ?? 6.5} onChange={v => onChange({ phMin: v ?? 6.5 })} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ ...LABEL_S, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Max</div>
              <InputNumber size="small" style={{ width: '100%' }} step={0.1} min={0} max={14}
                value={field.phMax ?? 7.5} onChange={v => onChange({ phMax: v ?? 7.5 })} />
            </div>
          </div>
        </>
      )}

      {field.type === 'calculation' && (
        <CalcProperties field={field} allLabels={allLabels} onChange={onChange} />
      )}

      {field.type === 'table' && (
        <TableProperties field={field} onChange={onChange} />
      )}

      {field.type === 'dynamic-table' && (
        <DynamicTableProperties field={field} onChange={onChange} />
      )}

      {(field.type === 'sample-id' || field.type === 'project-id'
        || field.type === 'instrument' || field.type === 'user-field') && (
        <SmartFieldProperties field={field} onChange={onChange} />
      )}

      {field.type === 'instrument-capture' && (
        <InstrumentCaptureProperties field={field} onChange={onChange} />
      )}

      {field.type === 'qrcode' && (
        <div style={{ padding: '8px 10px', background: 'var(--accent-light)', borderRadius: 6,
          fontSize: 11.5, color: 'var(--accent-hover)', marginBottom: 14, lineHeight: 1.5 }}>
          Renders a scannable QR code encoding the form / issued-instance reference number. No additional configuration needed.
        </div>
      )}

      {field.type === 'attachment' && (
        <div style={{ padding: '8px 10px', background: 'var(--accent-light)', borderRadius: 6,
          fontSize: 11.5, color: 'var(--accent-hover)', marginBottom: 14, lineHeight: 1.5 }}>
          Lets the user attach a supporting file (e.g. instrument printout, chromatogram, photo).
        </div>
      )}

      {field.type === 'e-signature' && (
        <>
          <PropRow label="Role Label">
            <Select size="small" style={{ width: '100%' }}
              value={field.signatureRole ?? 'Prepared By'}
              onChange={v => onChange({ signatureRole: v })}>
              {['Prepared By','Checked By','Approved By','Reviewed By','Witnessed By','Authorised By'].map(r => (
                <Option key={r} value={r}>{r}</Option>
              ))}
            </Select>
          </PropRow>
          <PropRow label="Password Required">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Switch size="small" checked={field.requirePassword ?? true}
                onChange={v => onChange({ requirePassword: v })} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {field.requirePassword ? 'Password confirmation required' : 'No password'}
              </span>
            </div>
          </PropRow>
        </>
      )}

      {field.type === 'section-header' && (
        <PropRow label="Instruction Text">
          <TextArea rows={2} size="small"
            value={field.helpText ?? ''}
            placeholder="Optional sub-text below header"
            onChange={e => onChange({ helpText: e.target.value })} />
        </PropRow>
      )}

      {field.type === 'step-section' && (
        <StepSectionProperties field={field} onChange={onChange} />
      )}

      {/* ── Conditional visibility (all field types) ── */}
      <Divider style={{ margin: '14px 0', borderColor: 'var(--border)' }} />
      <VisibilityRuleEditor field={field} allFields={allFields} onChange={onChange} />
    </div>
  );
}

/* ── Conditional visibility editor ── */

const VIS_OPERATORS: VisOperator[] = ['equals','not-equals','contains','gt','lt','is-checked','is-empty','not-empty'];
const NO_VALUE_OPERATORS = new Set<VisOperator>(['is-checked','is-empty','not-empty']);

function VisibilityRuleEditor({ field, allFields, onChange }:
  { field: FormField; allFields: { id: string; label: string }[]; onChange: (c: Partial<FormField>) => void }) {
  const rule = field.visibilityRule;
  const enabled = !!rule?.fieldId;
  const candidates = allFields.filter(f => f.id !== field.id);

  function setRule(changes: { fieldId?: string; operator?: VisOperator; value?: string }) {
    onChange({ visibilityRule: {
      fieldId: changes.fieldId ?? rule?.fieldId ?? candidates[0]?.id ?? '',
      operator: changes.operator ?? rule?.operator ?? 'equals',
      value: changes.value ?? rule?.value,
    } });
  }

  return (
    <PropRow label="Conditional Visibility">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: enabled ? 8 : 0 }}>
        <Switch size="small" checked={enabled} disabled={candidates.length === 0}
          onChange={v => onChange({ visibilityRule: v
            ? { fieldId: candidates[0]?.id ?? '', operator: 'equals', value: '' }
            : undefined })} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {candidates.length === 0 ? 'No other fields to depend on'
            : enabled ? 'Show only if…' : 'Always visible'}
        </span>
      </div>
      {enabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Select size="small" style={{ width: '100%' }} value={rule?.fieldId}
            onChange={v => setRule({ fieldId: v })}>
            {candidates.map(f => <Option key={f.id} value={f.id}>{f.label}</Option>)}
          </Select>
          <Select size="small" style={{ width: '100%' }} value={rule?.operator ?? 'equals'}
            onChange={v => setRule({ operator: v as VisOperator })}>
            {VIS_OPERATORS.map(op => <Option key={op} value={op}>{VIS_OPERATOR_LABEL[op]}</Option>)}
          </Select>
          {!NO_VALUE_OPERATORS.has(rule?.operator ?? 'equals') && (
            <Input size="small" placeholder="Value" value={rule?.value ?? ''}
              onChange={e => setRule({ value: e.target.value })} />
          )}
        </div>
      )}
    </PropRow>
  );
}

/* ── Step Section editor ── */

function StepSectionProperties({ field, onChange }:
  { field: FormField; onChange: (c: Partial<FormField>) => void }) {
  const steps = field.steps ?? [];
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(steps.map(s => s.id)));

  function updateStep(stepId: string, changes: Partial<FormStep>) {
    onChange({ steps: steps.map(s => s.id === stepId ? { ...s, ...changes } : s) });
  }

  function addStep() {
    const sid = `step-${Date.now()}`;
    const newStep: FormStep = {
      id: sid, title: `Step ${steps.length + 1}`, instruction: '',
      fields: [], hasSignDate: false, attachmentLabel: '',
    };
    onChange({ steps: [...steps, newStep] });
    setExpanded(prev => new Set([...prev, sid]));
  }

  function removeStep(stepId: string) {
    onChange({ steps: steps.filter(s => s.id !== stepId) });
  }

  function addStepField(stepId: string) {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    const newF: StepInlineField = { id: `sf-${Date.now()}`, label: 'Label', placeholder: '' };
    updateStep(stepId, { fields: [...step.fields, newF] });
  }

  function updateStepField(stepId: string, fId: string, changes: Partial<StepInlineField>) {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    updateStep(stepId, { fields: step.fields.map(f => f.id === fId ? { ...f, ...changes } : f) });
  }

  function removeStepField(stepId: string, fId: string) {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    updateStep(stepId, { fields: step.fields.filter(f => f.id !== fId) });
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ ...LABEL_S, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Steps ({steps.length})
        </span>
        <Button size="small" type="dashed" icon={<Plus size={11} />} onClick={addStep}>Add Step</Button>
      </div>

      {steps.length === 0 && (
        <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          No steps yet
        </div>
      )}

      {steps.map((step, idx) => {
        const isExpanded = expanded.has(step.id);
        return (
          <div key={step.id} style={{ border: '1px solid var(--border)', borderRadius: 7, marginBottom: 8, overflow: 'hidden' }}>
            {/* Step header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
              background: 'var(--bg-card)', cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setExpanded(prev => {
                const next = new Set(prev);
                if (isExpanded) next.delete(step.id);
                else next.add(step.id);
                return next;
              })}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', minWidth: 16 }}>{idx + 1}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flex: 1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {step.title || 'Untitled Step'}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{isExpanded ? '▲' : '▼'}</span>
              <button onClick={e => { e.stopPropagation(); removeStep(step.id); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}>
                <X size={12} />
              </button>
            </div>

            {isExpanded && (
              <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Title */}
                <div>
                  <div style={{ ...LABEL_S, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Step Title</div>
                  <Input size="small" value={step.title}
                    onChange={e => updateStep(step.id, { title: e.target.value })} />
                </div>

                {/* Instruction */}
                <div>
                  <div style={{ ...LABEL_S, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Instruction Text</div>
                  <TextArea rows={3} size="small" value={step.instruction ?? ''}
                    placeholder="Step description / procedure…"
                    onChange={e => updateStep(step.id, { instruction: e.target.value })} />
                </div>

                {/* Inline fields */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <div style={{ ...LABEL_S, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Inline Fields
                    </div>
                    <Button size="small" type="dashed" icon={<Plus size={10} />}
                      onClick={() => addStepField(step.id)}>Add</Button>
                  </div>
                  {step.fields.map(sf => (
                    <div key={sf.id} style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
                      <Input size="small" placeholder="e.g. Lot#, Vendor#, ID"
                        value={sf.label} style={{ flex: 1 }}
                        onChange={e => updateStepField(step.id, sf.id, { label: e.target.value })} />
                      <button onClick={() => removeStepField(step.id, sf.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}>
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                  {step.fields.length === 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>No inline fields</div>
                  )}
                </div>

                {/* Sign/Date toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Switch size="small" checked={step.hasSignDate}
                    onChange={v => updateStep(step.id, { hasSignDate: v })} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Require Sign / Date</span>
                </div>

                {/* Attachment box */}
                <div>
                  <div style={{ ...LABEL_S, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Attachment Box Label
                  </div>
                  <Input size="small"
                    placeholder="e.g. Weigh Slip, pH Slip (blank = hidden)"
                    value={step.attachmentLabel ?? ''}
                    onChange={e => updateStep(step.id, { attachmentLabel: e.target.value })} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

/* ── Calculation formula sub-panel ── */

function CalcProperties({ field, allLabels, onChange }:
  { field: FormField; allLabels: string[]; onChange: (c: Partial<FormField>) => void }) {
  const [testVals, setTestVals] = useState<Record<string, string>>({});
  const formula = field.formula ?? '';

  const refs = Array.from(formula.matchAll(/\{([^}]+)\}/g)).map(m => m[1]);
  const uniqueRefs = [...new Set(refs)];

  const testResult = (() => {
    const nums: Record<string, number> = {};
    for (const ref of uniqueRefs) {
      const v = parseFloat(testVals[ref] ?? '0');
      nums[ref] = isNaN(v) ? 0 : v;
    }
    return evalFormula(formula, nums);
  })();

  function insertRef(label: string) {
    onChange({ formula: formula + `{${label}}` });
  }
  function insertOp(op: string) {
    onChange({ formula: formula + op });
  }

  return (
    <>
      <PropRow label="Formula">
        <TextArea rows={3} size="small" value={formula} style={{ fontFamily: 'monospace', fontSize: 12 }}
          onChange={e => onChange({ formula: e.target.value })}
          placeholder="e.g. ({Actual Weight} / {Target Weight}) * 100" />
      </PropRow>

      {/* Insert field reference */}
      {allLabels.filter(l => l !== field.label).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6,
            textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Insert Field Reference
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {allLabels.filter(l => l !== field.label).map(l => (
              <button key={l} onClick={() => insertRef(l)}
                style={{ padding: '2px 7px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
                  background: 'var(--accent-light)', border: '1px solid var(--accent)',
                  color: 'var(--accent)', fontFamily: 'monospace' }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Operators */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6,
          textTransform: 'uppercase', letterSpacing: '0.06em' }}>Operators</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {['+','-','*','/','(',')','^','%'].map(op => (
            <button key={op} onClick={() => insertOp(` ${op} `)}
              style={{ padding: '2px 9px', fontSize: 13, borderRadius: 4, cursor: 'pointer',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', fontFamily: 'monospace', fontWeight: 700 }}>
              {op}
            </button>
          ))}
          <button onClick={() => insertOp(' round(')}
            style={{ padding: '2px 7px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
              background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            round()
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...LABEL_S, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Unit</div>
          <Input size="small" value={field.calcUnit ?? ''} placeholder="e.g. %, ng/mL"
            onChange={e => onChange({ calcUnit: e.target.value })} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ ...LABEL_S, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Decimals</div>
          <InputNumber size="small" style={{ width: '100%' }} min={0} max={8}
            value={field.calcDecimals ?? 2} onChange={v => onChange({ calcDecimals: v ?? 2 })} />
        </div>
      </div>

      {/* Test formula */}
      {uniqueRefs.length > 0 && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8,
            textTransform: 'uppercase', letterSpacing: '0.06em' }}>Test Formula</div>
          {uniqueRefs.map(ref => (
            <div key={ref} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1, fontFamily: 'monospace' }}>{ref}</span>
              <Input size="small" style={{ width: 80, fontFamily: 'monospace' }}
                value={testVals[ref] ?? ''}
                onChange={e => setTestVals(p => ({ ...p, [ref]: e.target.value }))} />
            </div>
          ))}
          <div style={{ marginTop: 8, padding: '6px 10px', background: 'white', borderRadius: 6,
            border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: 13,
            color: testResult !== null ? 'var(--status-pass)' : 'var(--status-fail)', fontWeight: 600 }}>
            = {testResult !== null
              ? `${testResult.toFixed(field.calcDecimals ?? 2)} ${field.calcUnit ?? ''}`
              : 'Invalid formula'}
          </div>
        </div>
      )}
    </>
  );
}

/* ── Table / Dynamic Table column editor ── */

function ColumnsEditor({ columns, onChange }:
  { columns: TableColumn[]; onChange: (cols: TableColumn[]) => void }) {

  function updateCol(id: string, changes: Partial<TableColumn>) {
    onChange(columns.map(c => c.id === id ? { ...c, ...changes } : c));
  }
  function addCol() {
    onChange([...columns, { id: `c-${Date.now()}`, header: `Column ${columns.length + 1}`, type: 'text' }]);
  }
  function removeCol(id: string) {
    onChange(columns.filter(c => c.id !== id));
  }
  function addSubCol(colId: string) {
    const col = columns.find(c => c.id === colId);
    if (!col) return;
    const subColumns = [...(col.subColumns ?? []), { id: `sc-${Date.now()}`, header: `Sub ${(col.subColumns?.length ?? 0) + 1}` }];
    updateCol(colId, { subColumns });
  }
  function updateSubCol(colId: string, subId: string, header: string) {
    const col = columns.find(c => c.id === colId);
    if (!col) return;
    updateCol(colId, { subColumns: (col.subColumns ?? []).map(sc => sc.id === subId ? { ...sc, header } : sc) });
  }
  function removeSubCol(colId: string, subId: string) {
    const col = columns.find(c => c.id === colId);
    if (!col) return;
    updateCol(colId, { subColumns: (col.subColumns ?? []).filter(sc => sc.id !== subId) });
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.06em' }}>Columns</span>
        <Button size="small" type="dashed" icon={<Plus size={11} />} onClick={addCol}>Add</Button>
      </div>
      {columns.map(col => (
        <div key={col.id} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Input size="small" value={col.header} style={{ flex: 1 }}
              onChange={e => updateCol(col.id, { header: e.target.value })} />
            <Select size="small" style={{ width: 96 }} value={col.type}
              onChange={v => updateCol(col.id, { type: v })}>
              <Option value="text">Text</Option>
              <Option value="number">Number</Option>
              <Option value="dropdown">Select</Option>
              <Option value="subtable">Sub-table</Option>
            </Select>
            <button onClick={() => removeCol(col.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}>
              <X size={12} />
            </button>
          </div>
          {col.type === 'dropdown' && (
            <Input size="small" placeholder="Option 1, Option 2" style={{ marginTop: 4 }}
              value={col.options ?? ''} onChange={e => updateCol(col.id, { options: e.target.value })} />
          )}
          {col.type === 'subtable' && (
            <div style={{ paddingLeft: 12, borderLeft: '2px solid var(--border)', marginTop: 4 }}>
              {(col.subColumns ?? []).map(sc => (
                <div key={sc.id} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}>
                  <Input size="small" value={sc.header} style={{ flex: 1 }}
                    onChange={e => updateSubCol(col.id, sc.id, e.target.value)} />
                  <button onClick={() => removeSubCol(col.id, sc.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}>
                    <X size={11} />
                  </button>
                </div>
              ))}
              <Button size="small" type="dashed" icon={<Plus size={10} />} onClick={() => addSubCol(col.id)}>
                Add Sub-column
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TableProperties({ field, onChange }:
  { field: FormField; onChange: (c: Partial<FormField>) => void }) {
  return (
    <>
      <ColumnsEditor columns={field.columns ?? []} onChange={columns => onChange({ columns })} />
      <PropRow label="Default Row Count">
        <InputNumber size="small" style={{ width: '100%' }} min={1} max={20}
          value={field.defaultRows ?? 3}
          onChange={v => onChange({ defaultRows: v ?? 3 })} />
      </PropRow>
      <PropRow label="Allow User to Add Rows">
        <Switch size="small" checked={field.allowAddRows ?? true}
          onChange={v => onChange({ allowAddRows: v })} />
      </PropRow>
    </>
  );
}

function DynamicTableProperties({ field, onChange }:
  { field: FormField; onChange: (c: Partial<FormField>) => void }) {
  return (
    <>
      <ColumnsEditor columns={field.columns ?? []} onChange={columns => onChange({ columns })} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...LABEL_S, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Min Rows</div>
          <InputNumber size="small" style={{ width: '100%' }} min={0} max={50}
            value={field.minRows ?? 1} onChange={v => onChange({ minRows: v ?? 1 })} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ ...LABEL_S, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Max Rows</div>
          <InputNumber size="small" style={{ width: '100%' }} min={1} max={100}
            value={field.maxRows ?? 10} onChange={v => onChange({ maxRows: v ?? 10 })} />
        </div>
      </div>
      <PropRow label="Initial Row Count">
        <InputNumber size="small" style={{ width: '100%' }} min={field.minRows ?? 1} max={field.maxRows ?? 10}
          value={field.defaultRows ?? field.minRows ?? 1}
          onChange={v => onChange({ defaultRows: v ?? 1 })} />
      </PropRow>
    </>
  );
}

/* ── Smart / master-data field properties ── */

const MASTER_LABEL: Record<string, string> = {
  project: 'Project Master', sample: 'Sample Master', instrument: 'Instrument Master', user: 'User Master',
};
const MASTER_AUTOFILL_HINT: Record<string, string> = {
  project: 'Selecting a project auto-fills Project Name, Study No. and Sponsor fields elsewhere on the form (matched by label).',
  sample: 'Selecting a sample auto-fills Project No., Matrix and Sample Status fields elsewhere on the form (matched by label).',
  instrument: 'Selecting an instrument auto-fills Instrument Name, Calibration Due and Location fields elsewhere on the form (matched by label).',
  user: 'Selecting a user auto-fills Role and Department fields elsewhere on the form (matched by label).',
};

function SmartFieldProperties({ field, onChange }:
  { field: FormField; onChange: (c: Partial<FormField>) => void }) {
  const binding = field.masterBinding;
  return (
    <>
      <div style={{ padding: '8px 10px', background: 'var(--accent-light)', borderRadius: 6,
        fontSize: 11.5, color: 'var(--accent-hover)', marginBottom: 14, lineHeight: 1.5 }}>
        Bound to <strong>{binding ? MASTER_LABEL[binding] : 'master data'}</strong>.{' '}
        {binding && MASTER_AUTOFILL_HINT[binding]}
      </div>
      {field.type === 'instrument' && (
        <PropRow label="Filter by Instrument Type">
          <Select size="small" style={{ width: '100%' }} allowClear placeholder="Any instrument"
            value={field.instrumentType} onChange={v => onChange({ instrumentType: v })}>
            {Object.entries(INSTRUMENT_TYPE_LABEL).map(([k, label]) => <Option key={k} value={k}>{label}</Option>)}
          </Select>
        </PropRow>
      )}
    </>
  );
}

/* ── Instrument capture properties ── */

function InstrumentCaptureProperties({ field, onChange }:
  { field: FormField; onChange: (c: Partial<FormField>) => void }) {
  return (
    <>
      <PropRow label="Instrument Type">
        <Select size="small" style={{ width: '100%' }} value={field.instrumentType ?? 'balance'}
          onChange={v => onChange({ instrumentType: v })}>
          {Object.entries(INSTRUMENT_TYPE_LABEL).map(([k, label]) => <Option key={k} value={k}>{label}</Option>)}
        </Select>
      </PropRow>
      <PropRow label="Capture Unit">
        <Input size="small" placeholder="e.g. mg, AU, %RH"
          value={field.captureUnit ?? ''} onChange={e => onChange({ captureUnit: e.target.value })} />
      </PropRow>
      <PropRow label="Target Value (optional)">
        <div style={{ display: 'flex', gap: 6 }}>
          <InputNumber size="small" style={{ flex: 1 }} value={field.targetWeight}
            onChange={v => onChange({ targetWeight: v ?? undefined })} />
          <Input size="small" style={{ width: 70 }} placeholder="unit" value={field.weightUnit ?? ''}
            onChange={e => onChange({ weightUnit: e.target.value })} />
        </div>
      </PropRow>
      {field.targetWeight !== undefined && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ ...LABEL_S, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tolerance Min %</div>
            <InputNumber size="small" style={{ width: '100%' }} min={0} max={100}
              value={field.toleranceMin ?? 98} onChange={v => onChange({ toleranceMin: v ?? 98 })} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...LABEL_S, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tolerance Max %</div>
            <InputNumber size="small" style={{ width: '100%' }} min={0} max={200}
              value={field.toleranceMax ?? 102} onChange={v => onChange({ toleranceMax: v ?? 102 })} />
          </div>
        </div>
      )}
    </>
  );
}

/* ── Empty state ── */

export function EmptyProperties() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', padding: 24, gap: 12 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-card)',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronRight size={20} style={{ color: 'var(--border-strong)' }} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
        Click a field to edit<br />its properties
      </div>
    </div>
  );
}
