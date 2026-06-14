import type { FormTemplate, FormHeaderConfig, FormFooterConfig } from './types';

const KEY = 'lims-form-templates';

export const DEFAULT_HEADER: FormHeaderConfig = { companyName: 'Aurora CRO Laboratories', showLogo: true };
export const DEFAULT_FOOTER: FormFooterConfig = { showPageNumbers: true, showQrCode: true, showAuditRef: true };

const SEED: FormTemplate[] = [
  {
    id: 'f-ba-001',
    formNo: 'F-BA-001',
    name: 'Sample Extraction Worksheet',
    category: 'Worksheet',
    department: 'Bioanalytical',
    version: '2.1',
    status: 'live',
    description: 'Step-by-step extraction documentation for SPE and LLE procedures.',
    createdBy: 'Dr. S. Mehta',
    createdAt: '2026-03-10',
    updatedAt: '2026-04-01',
    effectiveDate: '2026-04-02',
    header: DEFAULT_HEADER,
    footer: DEFAULT_FOOTER,
    orientation: 'portrait',
    revisionHistory: [
      { version: '1.0', date: '2026-03-10', author: 'Dr. S. Mehta', change: 'Initial release.' },
      { version: '2.1', date: '2026-04-01', author: 'Dr. S. Mehta', change: 'Added centrifugation step verification and dual signatures.', changeControlRef: 'CC-2026-014' },
    ],
    pages: [
      {
        id: 'p1',
        title: 'Run Information',
        fields: [
          { id: 'f1', type: 'text',      label: 'Run ID',           required: true  },
          { id: 'f2', type: 'text',      label: 'Analyst',          required: true  },
          { id: 'f3', type: 'date',      label: 'Date',             required: true  },
          { id: 'f4', type: 'datetime',  label: 'Start Time',       required: true  },
        ],
      },
      {
        id: 'p2',
        title: 'Centrifugation',
        fields: [
          { id: 'f5', type: 'number',    label: 'Centrifuge RPM',   required: true,  unit: 'RPM' },
          { id: 'f6', type: 'number',    label: 'Temperature',      required: true,  unit: '°C'  },
          { id: 'f7', type: 'number',    label: 'Duration',         required: true,  unit: 'min' },
          { id: 'f8', type: 'textarea',  label: 'Observations',     required: false  },
          { id: 'f9', type: 'e-signature', label: 'Prepared By',    required: true, signatureRole: 'Prepared By', requirePassword: true },
          { id: 'f10',type: 'e-signature', label: 'Verified By',    required: true, signatureRole: 'Verified By', requirePassword: true },
        ],
      },
    ],
  },
  {
    id: 'f-ba-002',
    formNo: 'F-BA-002',
    name: 'Solution Preparation Log',
    category: 'Log Sheet',
    department: 'Bioanalytical',
    version: '1.3',
    status: 'live',
    description: 'Tracks stock and working solution preparations with weight validation.',
    createdBy: 'Dr. R. Patel',
    createdAt: '2026-03-18',
    updatedAt: '2026-03-18',
    effectiveDate: '2026-03-19',
    header: DEFAULT_HEADER,
    footer: DEFAULT_FOOTER,
    orientation: 'portrait',
    revisionHistory: [
      { version: '1.0', date: '2026-02-20', author: 'Dr. R. Patel', change: 'Initial release.' },
      { version: '1.3', date: '2026-03-18', author: 'Dr. R. Patel', change: 'Added % accuracy auto-calculation.' },
    ],
    pages: [
      {
        id: 'p1',
        title: 'Solution Details',
        fields: [
          { id: 'f1', type: 'text',       label: 'Solution Name',    required: true },
          { id: 'f2', type: 'text',       label: 'Lot / Batch No.',  required: true },
          { id: 'f3', type: 'date',       label: 'Preparation Date', required: true },
          { id: 'f4', type: 'weigh-slip', label: 'Active Ingredient', required: true,
            targetWeight: 50, weightUnit: 'mg', toleranceMin: 98, toleranceMax: 102,
            passLabel: 'Pass', failLabel: 'Fail', reweighLabel: 'Reweigh' },
          { id: 'f5', type: 'dropdown',   label: 'Solvent',          required: true,
            options: 'Methanol,Acetonitrile,Water,Formic Acid,Ammonium Formate' },
          { id: 'f6', type: 'number',     label: 'Final Volume',     required: true, unit: 'mL' },
          { id: 'f7', type: 'calculation',label: '% Accuracy',       required: false,
            formula: '({Actual Weight} / {Target Weight}) * 100', calcUnit: '%', calcDecimals: 2 },
          { id: 'f8', type: 'e-signature',label: 'Prepared By',      required: true,
            signatureRole: 'Prepared By', requirePassword: true },
        ],
      },
    ],
  },
  {
    id: 'f-cl-001',
    formNo: 'F-CL-001',
    name: 'Sample Receipt Checklist',
    category: 'Checklist',
    department: 'Clinical',
    version: '1.0',
    status: 'live',
    description: 'Verifies sample shipment integrity on receipt from site.',
    createdBy: 'T. Okafor',
    createdAt: '2026-03-22',
    updatedAt: '2026-03-22',
    effectiveDate: '2026-03-23',
    header: DEFAULT_HEADER,
    footer: DEFAULT_FOOTER,
    orientation: 'portrait',
    revisionHistory: [
      { version: '1.0', date: '2026-03-22', author: 'T. Okafor', change: 'Initial release.' },
    ],
    pages: [
      {
        id: 'p1',
        title: 'Receipt Verification',
        fields: [
          { id: 'f1', type: 'text',      label: 'Study ID',             required: true },
          { id: 'f2', type: 'date',      label: 'Date Received',        required: true },
          { id: 'f3', type: 'text',      label: 'Courier',              required: true },
          { id: 'f4', type: 'ph-slip',   label: 'Shipment pH Check',    required: false,
            targetPH: 7.0, phMin: 6.5, phMax: 7.5 },
          { id: 'f5', type: 'checkbox',  label: 'Dry Ice Present',      required: true },
          { id: 'f6', type: 'checkbox',  label: 'Seal Intact',          required: true },
          { id: 'f7', type: 'checkbox',  label: 'Manifest Attached',    required: true },
          { id: 'f8', type: 'checkbox',  label: 'Sample Count Correct', required: true },
          { id: 'f9', type: 'textarea',  label: 'Remarks',              required: false },
          { id: 'f10',type: 'e-signature',label: 'Received By',         required: true,
            signatureRole: 'Received By', requirePassword: true },
        ],
      },
    ],
  },
  {
    id: 'f-fr-001',
    formNo: 'F-FR-001',
    name: 'Freezer Temperature Log',
    category: 'Log Sheet',
    department: 'Freezer Room',
    version: '1.0',
    status: 'draft',
    description: 'Daily temperature monitoring log for all storage units.',
    createdBy: 'Dr. A. Liang',
    createdAt: '2026-04-20',
    updatedAt: '2026-04-20',
    header: DEFAULT_HEADER,
    footer: DEFAULT_FOOTER,
    orientation: 'portrait',
    revisionHistory: [
      { version: '1.0', date: '2026-04-20', author: 'Dr. A. Liang', change: 'Initial draft created.' },
    ],
    pages: [
      {
        id: 'p1',
        title: 'Temperature Records',
        fields: [
          { id: 'f1', type: 'text',      label: 'Freezer ID',      required: true },
          { id: 'f2', type: 'date',      label: 'Date',            required: true },
          { id: 'f3', type: 'number',    label: 'Morning Temp.',   required: true, unit: '°C' },
          { id: 'f4', type: 'number',    label: 'Afternoon Temp.', required: true, unit: '°C' },
          { id: 'f5', type: 'number',    label: 'Evening Temp.',   required: false, unit: '°C' },
          { id: 'f6', type: 'checkbox',  label: 'Alarm Triggered', required: true },
          { id: 'f7', type: 'textarea',  label: 'Remarks',         required: false },
          { id: 'f8', type: 'e-signature', label: 'Recorded By',   required: true,
            signatureRole: 'Recorded By', requirePassword: true },
        ],
      },
    ],
  },
];

/** Fills in fields introduced after a template may have been persisted, and
 *  migrates the old 5-stage status values to the current 8-stage lifecycle. */
function normalizeForm(f: FormTemplate): FormTemplate {
  const status = (f.status as string) === 'active' ? 'live' : f.status;
  return {
    ...f,
    status,
    header: f.header ?? { ...DEFAULT_HEADER },
    footer: f.footer ?? { ...DEFAULT_FOOTER },
    orientation: f.orientation ?? 'portrait',
    revisionHistory: f.revisionHistory ?? [],
  };
}

export function loadForms(): FormTemplate[] {
  if (typeof window === 'undefined') return SEED;
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(SEED));
    return SEED;
  }
  try {
    const parsed = JSON.parse(raw) as FormTemplate[];
    return parsed.map(normalizeForm);
  } catch { return SEED; }
}

export function persistForms(forms: FormTemplate[]): void {
  if (typeof window !== 'undefined')
    localStorage.setItem(KEY, JSON.stringify(forms));
}

export function getForm(id: string): FormTemplate | null {
  return loadForms().find(f => f.id === id) ?? null;
}

export function upsertForm(form: FormTemplate): void {
  const all = loadForms();
  const idx = all.findIndex(f => f.id === form.id);
  const updated = idx >= 0 ? all.map(f => f.id === form.id ? form : f) : [form, ...all];
  persistForms(updated);
}

export function removeForm(id: string): void {
  persistForms(loadForms().filter(f => f.id !== id));
}
