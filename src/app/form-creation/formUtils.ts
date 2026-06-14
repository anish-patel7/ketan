import type {
  FormField, FormPage, FormStatus, InstanceStatus, AuditCategory, VisibilityRule, InstrumentMasterEntry, MasterBinding,
} from './types';
import { PROJECT_MASTER, SAMPLE_MASTER, INSTRUMENT_MASTER, USER_MASTER } from './masterData';

/* ════════════════════════════════════════════════════════════════════
   FORM TAXONOMY — shared by the Form Library filters and the
   Create-from-Document wizard
════════════════════════════════════════════════════════════════════ */

export const CATEGORIES = [
  "Worksheet", "Log Sheet", "Checklist", "Batch Record", "SOP",
  "Protocol", "Method", "Method Validation", "General",
];

export const DEPARTMENTS = ["Clinical", "Bioanalytical", "Freezer Room", "General"];

/* ════════════════════════════════════════════════════════════════════
   LIFECYCLE — single source of truth for status labels/colors/flow
════════════════════════════════════════════════════════════════════ */

export const STATUS_LABEL: Record<FormStatus, string> = {
  'draft': 'Draft',
  'under-review': 'Under Review',
  'qa-review': 'QA Review',
  'approved': 'Approved',
  'effective': 'Effective',
  'live': 'Live',
  'obsolete': 'Obsolete',
  'archived': 'Archived',
};

export const STATUS_STYLE: Record<FormStatus, { bg: string; color: string; border: string }> = {
  'draft':        { bg: '#F2F0EB', color: '#6B6560', border: '#C8C2B8' },
  'under-review': { bg: '#EAF2FA', color: '#3A6B9B', border: '#9bc0e0' },
  'qa-review':    { bg: '#FDF3E7', color: '#B8860B', border: '#f0c040' },
  'approved':     { bg: '#e3f2fd', color: '#1565c0', border: '#90caf9' },
  'effective':    { bg: '#EAF4EE', color: '#4A7C59', border: '#81c784' },
  'live':         { bg: '#E8F5E9', color: '#2E7D32', border: '#66BB6A' },
  'obsolete':     { bg: '#F5EDE3', color: '#9B6B3A', border: '#d8b48a' },
  'archived':     { bg: '#FAEAEA', color: '#9B3A3A', border: '#e57373' },
};

export type StatusTone = 'info' | 'success' | 'warning' | 'danger';
export type StatusTransition = { label: string; next: FormStatus; tone: StatusTone };

/** Available forward/backward lifecycle transitions per status. */
export const STATUS_FLOW: Record<FormStatus, StatusTransition[]> = {
  'draft':         [{ label: 'Submit for Review', next: 'under-review', tone: 'info' }],
  'under-review':  [{ label: 'Send to QA',  next: 'qa-review', tone: 'info' },
                     { label: 'Return to Draft', next: 'draft', tone: 'warning' }],
  'qa-review':     [{ label: 'QA Approve', next: 'approved', tone: 'success' },
                     { label: 'Reject to Draft', next: 'draft', tone: 'danger' }],
  'approved':      [{ label: 'Make Effective', next: 'effective', tone: 'success' }],
  'effective':     [{ label: 'Activate (Go Live)', next: 'live', tone: 'success' }],
  'live':          [{ label: 'Mark Obsolete', next: 'obsolete', tone: 'warning' }],
  'obsolete':      [{ label: 'Archive', next: 'archived', tone: 'danger' }],
  'archived':      [],
};

export const TONE_STYLE: Record<StatusTone, { bg: string; color: string; border: string }> = {
  info:    { bg: '#EAF2FA', color: '#3A6B9B', border: '#9bc0e0' },
  success: { bg: '#EAF4EE', color: '#4A7C59', border: '#81c784' },
  warning: { bg: '#FDF3E7', color: '#B8860B', border: '#f0c040' },
  danger:  { bg: '#FAEAEA', color: '#9B3A3A', border: '#e57373' },
};

/* ════════════════════════════════════════════════════════════════════
   ISSUED INSTANCE LIFECYCLE
════════════════════════════════════════════════════════════════════ */

export const INSTANCE_STATUS_LABEL: Record<InstanceStatus, string> = {
  'issued':       'Issued',
  'in-progress':  'In Progress',
  'under-review': 'Under Review',
  'completed':    'Completed',
  'approved':     'Approved',
};

export const INSTANCE_STATUS_STYLE: Record<InstanceStatus, { bg: string; color: string; border: string }> = {
  'issued':       { bg: '#F2F0EB', color: '#6B6560', border: '#C8C2B8' },
  'in-progress':  { bg: '#EAF2FA', color: '#3A6B9B', border: '#9bc0e0' },
  'under-review': { bg: '#FDF3E7', color: '#B8860B', border: '#f0c040' },
  'completed':    { bg: '#EAF4EE', color: '#4A7C59', border: '#81c784' },
  'approved':     { bg: '#E8F5E9', color: '#2E7D32', border: '#66BB6A' },
};

/* ════════════════════════════════════════════════════════════════════
   AUDIT TRAIL — category labels/colors (single source of truth, shared
   by the dashboard's recent-activity feed and the full audit trail page)
════════════════════════════════════════════════════════════════════ */

export const AUDIT_CATEGORY_LABEL: Record<AuditCategory, string> = {
  'form-status': 'Status Change',
  'form-version': 'New Version',
  'form-issued': 'Form Issued',
  'instance-status': 'Instance Status',
  'instance-value': 'Value Corrected',
  'instance-signed': 'E-Signature',
  'instrument-capture': 'Instrument Capture',
};

export const AUDIT_CATEGORY_COLOR: Record<AuditCategory, string> = {
  'form-status': '#3A6B9B',
  'form-version': '#7B5EA7',
  'form-issued': '#B05E2A',
  'instance-status': '#2E7D32',
  'instance-value': '#B8860B',
  'instance-signed': '#5C6E4E',
  'instrument-capture': '#2A6B8F',
};

/* ════════════════════════════════════════════════════════════════════
   SAFE FORMULA EVALUATOR (shared with builder/preview/execute/print)
════════════════════════════════════════════════════════════════════ */

export function evalFormula(formula: string, values: Record<string, number>): number | null {
  try {
    let expr = formula;
    for (const [name, val] of Object.entries(values))
      expr = expr.replace(new RegExp(`\\{${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`, 'g'), String(val));
    expr = expr.replace(/\{[^}]+\}/g, '0');
    expr = expr.replace(/\^/g, '**');
    if (!/^[0-9+\-*/().\s%]+$/.test(expr)) return null;
    return Function('"use strict"; return (' + expr + ')')() as number;
  } catch { return null; }
}

export type WeighOutcome = 'pass' | 'fail' | 'reweigh' | null;
export type PHOutcome = 'pass' | 'fail' | null;

export function weighResult(f: FormField, values: Record<string, string>): WeighOutcome {
  const actual = parseFloat(values[f.id] ?? '');
  if (isNaN(actual) || !f.targetWeight) return null;
  const pct = (actual / f.targetWeight) * 100;
  if (pct >= (f.toleranceMin ?? 98) && pct <= (f.toleranceMax ?? 102)) return 'pass';
  if (pct >= (f.toleranceMin ?? 98) - 5 && pct <= (f.toleranceMax ?? 102) + 5) return 'reweigh';
  return 'fail';
}

export function phResult(f: FormField, values: Record<string, string>): PHOutcome {
  const v = parseFloat(values[f.id] ?? '');
  if (isNaN(v)) return null;
  return (v >= (f.phMin ?? 0) && v <= (f.phMax ?? 14)) ? 'pass' : 'fail';
}

export function calcResult(f: FormField, pages: FormPage[], values: Record<string, string>): string {
  if (!f.formula) return '—';
  const fieldValues: Record<string, number> = {};
  for (const pg of pages)
    for (const fld of pg.fields)
      if (fld.label && values[fld.id]) fieldValues[fld.label] = parseFloat(values[fld.id]) || 0;
  const res = evalFormula(f.formula, fieldValues);
  if (res === null) return 'Invalid formula';
  return `${res.toFixed(f.calcDecimals ?? 2)}${f.calcUnit ? ' ' + f.calcUnit : ''}`;
}

/* ════════════════════════════════════════════════════════════════════
   CONDITIONAL VISIBILITY
════════════════════════════════════════════════════════════════════ */

export function evaluateVisibility(rule: VisibilityRule | undefined, values: Record<string, string>): boolean {
  if (!rule || !rule.fieldId) return true;
  const v = values[rule.fieldId] ?? '';
  switch (rule.operator) {
    case 'equals':     return v === (rule.value ?? '');
    case 'not-equals': return v !== (rule.value ?? '');
    case 'contains':   return v.includes(rule.value ?? '');
    case 'gt':         return parseFloat(v) > parseFloat(rule.value ?? '0');
    case 'lt':         return parseFloat(v) < parseFloat(rule.value ?? '0');
    case 'is-checked': return v === 'yes';
    case 'is-empty':   return !v;
    case 'not-empty':  return !!v;
    default:           return true;
  }
}

export const VIS_OPERATOR_LABEL: Record<VisibilityRule['operator'], string> = {
  'equals': 'equals',
  'not-equals': 'does not equal',
  'contains': 'contains',
  'gt': 'is greater than',
  'lt': 'is less than',
  'is-checked': 'is checked',
  'is-empty': 'is empty',
  'not-empty': 'is not empty',
};

/* ════════════════════════════════════════════════════════════════════
   INSTRUMENT CAPTURE SIMULATION
════════════════════════════════════════════════════════════════════ */

export const INSTRUMENT_TYPE_LABEL: Record<string, string> = {
  'balance': 'Balance',
  'hplc': 'HPLC',
  'lcms': 'LC-MS/MS',
  'gc': 'GC',
  'dissolution': 'Dissolution Tester',
  'uv': 'UV Spectrophotometer',
  'ph-meter': 'pH Meter',
  'moisture-analyzer': 'Moisture Analyzer',
};

const DEFAULT_CAPTURE_UNIT: Record<string, string> = {
  'balance': 'mg',
  'hplc': 'AU',
  'lcms': 'cps',
  'gc': 'AU',
  'dissolution': '%',
  'uv': 'AU',
  'ph-meter': 'pH',
  'moisture-analyzer': '%RH',
};

export type InstrumentCapture = {
  value: string;
  unit: string;
  instrumentId: string;
  instrumentName: string;
  timestamp: string;
};

/** Simulates pulling a live reading from a connected instrument. */
export function simulateInstrumentCapture(field: FormField, instruments: InstrumentMasterEntry[]): InstrumentCapture {
  const candidates = instruments.filter(i => i.type === field.instrumentType);
  const pool = candidates.length ? candidates : instruments;
  const instrument = pool[Math.floor(Math.random() * pool.length)];

  const decimals = field.calcDecimals ?? (field.instrumentType === 'balance' ? 4 : 2);
  let value: number;
  if (field.targetWeight) {
    const tolPct = Math.max((field.toleranceMax ?? 102) - 100, 0.5);
    const drift = (Math.random() * 2 - 1) * tolPct / 100;
    value = field.targetWeight * (1 + drift);
  } else {
    value = Math.random() * 100;
  }

  return {
    value: value.toFixed(decimals),
    unit: field.captureUnit || DEFAULT_CAPTURE_UNIT[field.instrumentType ?? 'balance'] || '',
    instrumentId: instrument?.instrumentId ?? 'UNKNOWN',
    instrumentName: instrument?.name ?? 'Unknown Instrument',
    timestamp: new Date().toLocaleString(),
  };
}

/* ════════════════════════════════════════════════════════════════════
   SMART FIELD AUTO-POPULATION (master-data bound fields)
════════════════════════════════════════════════════════════════════ */

/** When a smart field (project-id/sample-id/instrument/user-field) is set,
 *  auto-fills other fields on the form whose label matches a known related
 *  attribute — mirrors the {Label} matching convention used by the formula
 *  evaluator. Returns a map of fieldId -> value to merge into form values. */
export function getMasterAutoFill(binding: MasterBinding, selectedValue: string, pages: FormPage[]): Record<string, string> {
  const result: Record<string, string> = {};
  const allFields = pages.flatMap(p => p.fields);
  const setByLabel = (patterns: string[], value: string | undefined) => {
    if (!value) return;
    for (const f of allFields) {
      const label = f.label.toLowerCase();
      if (patterns.some(p => label.includes(p))) result[f.id] = value;
    }
  };

  switch (binding) {
    case 'project': {
      const entry = PROJECT_MASTER.find(p => p.projectNo === selectedValue);
      setByLabel(['project name'], entry?.name);
      setByLabel(['study no', 'study id'], entry?.studyNo);
      setByLabel(['sponsor'], entry?.sponsor);
      break;
    }
    case 'sample': {
      const entry = SAMPLE_MASTER.find(s => s.sampleId === selectedValue);
      setByLabel(['project no'], entry?.projectNo);
      setByLabel(['matrix'], entry?.matrix);
      setByLabel(['sample status'], entry?.status);
      break;
    }
    case 'instrument': {
      const entry = INSTRUMENT_MASTER.find(i => i.instrumentId === selectedValue);
      setByLabel(['instrument name'], entry?.name);
      setByLabel(['calibration due'], entry?.calibrationDue);
      setByLabel(['location'], entry?.location);
      break;
    }
    case 'user': {
      const entry = USER_MASTER.find(u => u.userId === selectedValue);
      setByLabel(['role'], entry?.role);
      setByLabel(['department'], entry?.department);
      break;
    }
  }
  return result;
}
