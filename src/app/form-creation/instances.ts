import type { FormIssuedInstance, FormTemplate, ProjectMasterEntry, InstanceStatus } from './types';

const KEY = 'lims-form-instances';
const COUNTER_KEY = 'lims-form-instance-counters';

export function loadInstances(): FormIssuedInstance[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export function persistInstances(instances: FormIssuedInstance[]): void {
  if (typeof window !== 'undefined')
    localStorage.setItem(KEY, JSON.stringify(instances));
}

export function getInstance(id: string): FormIssuedInstance | null {
  return loadInstances().find(i => i.id === id) ?? null;
}

export function upsertInstance(instance: FormIssuedInstance): void {
  const all = loadInstances();
  const idx = all.findIndex(i => i.id === instance.id);
  const updated = idx >= 0 ? all.map(i => i.id === instance.id ? instance : i) : [instance, ...all];
  persistInstances(updated);
}

/* ── Issuance numbering ──────────────────────────────────────────────
   Format: <FormNo>-V<MajorVersion padded to 2>-<Year>-<6-digit sequence>
   e.g.    F-BA-002-V02-2026-000001
   The per (formNo, version, year) counter is persisted so numbers are
   never reused — satisfying the "no duplicate issuance" requirement. */

function loadCounters(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem(COUNTER_KEY);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function persistCounters(counters: Record<string, number>): void {
  if (typeof window !== 'undefined')
    localStorage.setItem(COUNTER_KEY, JSON.stringify(counters));
}

function nextSequence(key: string): number {
  const counters = loadCounters();
  const next = (counters[key] ?? 0) + 1;
  counters[key] = next;
  persistCounters(counters);
  return next;
}

function majorVersion(version: string): string {
  const major = Math.floor(parseFloat(version)) || 1;
  return String(major).padStart(2, '0');
}

export function buildInstanceNo(template: FormTemplate, year: string, seq: number): string {
  return `${template.formNo}-V${majorVersion(template.version)}-${year}-${String(seq).padStart(6, '0')}`;
}

export function issueForm(template: FormTemplate, project: ProjectMasterEntry, issuedBy: string): FormIssuedInstance {
  const year = new Date().getFullYear().toString();
  const counterKey = `${template.formNo}-V${majorVersion(template.version)}-${year}`;
  const seq = nextSequence(counterKey);

  const instance: FormIssuedInstance = {
    id: `inst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    instanceNo: buildInstanceNo(template, year, seq),
    formId: template.id,
    formNo: template.formNo,
    formName: template.name,
    version: template.version,
    projectNo: project.projectNo,
    projectName: project.name,
    studyNo: project.studyNo,
    status: 'issued' as InstanceStatus,
    issuedAt: new Date().toISOString(),
    issuedBy,
    pages: template.pages,
    header: template.header,
    footer: template.footer,
    orientation: template.orientation,
    values: {},
    signatures: {},
  };

  upsertInstance(instance);
  return instance;
}
