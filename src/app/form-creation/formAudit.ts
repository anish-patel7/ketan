import type { AuditEvent, AuditCategory } from './types';

const KEY = 'lims-form-audit';

export function loadAuditTrail(): AuditEvent[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export function persistAuditTrail(events: AuditEvent[]): void {
  if (typeof window !== 'undefined')
    localStorage.setItem(KEY, JSON.stringify(events));
}

/** Append-only — events are immutable once written. */
export function logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
  const full: AuditEvent = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...event,
  };
  persistAuditTrail([full, ...loadAuditTrail()]);
  return full;
}

export function getAuditTrail(filter?: {
  category?: AuditCategory;
  formId?: string;
  instanceId?: string;
}): AuditEvent[] {
  let events = loadAuditTrail();
  if (filter?.category)   events = events.filter(e => e.category === filter.category);
  if (filter?.formId)     events = events.filter(e => e.formId === filter.formId);
  if (filter?.instanceId) events = events.filter(e => e.instanceId === filter.instanceId);
  return events;
}
