"use client";

import { useDraggable } from "@dnd-kit/core";
import {
  Type, Hash, Calendar, Clock, ChevronDown, ChevronRight, CheckSquare, AlignLeft, Scale,
  FlaskConical, Calculator, Barcode, Heading, Info, Minus, Table2, PenLine,
  Stamp, Fingerprint, ListOrdered, QrCode, TestTube2, FolderKanban, Cpu,
  UserRound, Paperclip, Activity, Rows3,
} from "lucide-react";
import type { FormField, FieldType } from "../../types";

/* ── Field type catalogue ─────────────────────────────────────────── */

export type PaletteEntry = { type: FieldType; label: string; icon: React.ElementType; color: string };

export const PALETTE: { group: string; items: PaletteEntry[] }[] = [
  {
    group: "Basic",
    items: [
      { type: "text",      label: "Text",       icon: Type,        color: "#3A6B9B" },
      { type: "number",    label: "Number",     icon: Hash,        color: "#5C6E4E" },
      { type: "date",      label: "Date",       icon: Calendar,    color: "#2A6B8F" },
      { type: "datetime",  label: "Date + Time",icon: Clock,       color: "#2A6B8F" },
      { type: "dropdown",  label: "Dropdown",   icon: ChevronDown, color: "#7B5EA7" },
      { type: "radio",     label: "Radio",      icon: ChevronRight, color: "#7B5EA7" },
      { type: "checkbox",  label: "Checkbox",   icon: CheckSquare, color: "#B05E2A" },
      { type: "textarea",  label: "Text Area",  icon: AlignLeft,   color: "#6B6560" },
    ],
  },
  {
    group: "Lab Specific",
    items: [
      { type: "weigh-slip",  label: "Weigh Slip",    icon: Scale,      color: "#4A7C59" },
      { type: "ph-slip",     label: "pH Slip",       icon: FlaskConical,color:"#2A6B8F" },
      { type: "calculation", label: "Calculation",   icon: Calculator, color: "#8A3A6B" },
      { type: "barcode",     label: "Barcode Scan",  icon: Barcode,    color: "#6B6560" },
    ],
  },
  {
    group: "Smart Fields",
    items: [
      { type: "sample-id",          label: "Sample ID",         icon: TestTube2,    color: "#4A7C59" },
      { type: "project-id",         label: "Project ID",        icon: FolderKanban, color: "#B05E2A" },
      { type: "instrument",         label: "Instrument",        icon: Cpu,          color: "#3A6B9B" },
      { type: "instrument-capture", label: "Instrument Capture",icon: Activity,     color: "#2A8F8F" },
      { type: "user-field",         label: "User",              icon: UserRound,    color: "#7B5EA7" },
      { type: "attachment",         label: "Attachment",        icon: Paperclip,    color: "#6B6560" },
      { type: "qrcode",             label: "QR Code",           icon: QrCode,       color: "#4A5568" },
      { type: "dynamic-table",      label: "Dynamic Table",     icon: Rows3,        color: "#3A8F6B" },
    ],
  },
  {
    group: "Layout",
    items: [
      { type: "section-header", label: "Section Header", icon: Heading, color: "#4A5568" },
      { type: "instruction",    label: "Instruction",    icon: Info,    color: "#4A5568" },
      { type: "divider",        label: "Divider",        icon: Minus,   color: "#9B9590" },
      { type: "table",          label: "Table",          icon: Table2,  color: "#3A6B9B" },
      { type: "step-section",   label: "Step Section",   icon: ListOrdered, color: "#5C6E4E" },
    ],
  },
  {
    group: "Compliance",
    items: [
      { type: "e-signature", label: "E-Signature",    icon: PenLine,     color: "#8A3A3A" },
      { type: "timestamp",   label: "Auto Timestamp", icon: Stamp,       color: "#5C6E4E" },
      { type: "initials",    label: "Initials",       icon: Fingerprint, color: "#7B5EA7" },
    ],
  },
];

export const ALL_PALETTE = PALETTE.flatMap(g => g.items);

/* ── Default values when adding a new field ──────────────────────── */

export function createField(type: FieldType): FormField {
  const id = `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const base: FormField = { id, type, label: defaultLabel(type), required: false };
  switch (type) {
    case "number":      return { ...base, unit: "", decimals: 2 };
    case "dropdown":
    case "radio":       return { ...base, options: "Option 1,Option 2,Option 3" };
    case "weigh-slip":  return { ...base, label: "Weight Measurement", targetWeight: 100,
                          weightUnit: "mg", toleranceMin: 98, toleranceMax: 102,
                          passLabel: "Pass", failLabel: "Fail", reweighLabel: "Reweigh" };
    case "ph-slip":     return { ...base, label: "pH Measurement", targetPH: 7.0, phMin: 6.5, phMax: 7.5 };
    case "calculation": return { ...base, label: "Calculated Value", formula: "", calcUnit: "", calcDecimals: 2 };
    case "table":       return { ...base, label: "Data Table",
                          columns: [
                            { id: `c-${Date.now()}1`, header: "Column 1", type: "text" },
                            { id: `c-${Date.now()}2`, header: "Column 2", type: "text" },
                          ],
                          allowAddRows: true, defaultRows: 3 };
    case "dynamic-table": return { ...base, label: "Repeatable Table",
                          columns: [
                            { id: `c-${Date.now()}1`, header: "Column 1", type: "text" },
                            { id: `c-${Date.now()}2`, header: "Column 2", type: "text" },
                          ],
                          minRows: 1, maxRows: 10, defaultRows: 1 };
    case "e-signature": return { ...base, label: "Signature", signatureRole: "Prepared By", requirePassword: true };
    case "section-header": return { ...base, label: "", content: "Section Title" };
    case "instruction": return { ...base, label: "", content: "Enter instruction text here…" };
    case "step-section": return { ...base, label: "Solution Preparation",
                          steps: [{ id: `step-${Date.now()}`, title: "Step 1",
                            instruction: "", fields: [], hasSignDate: false, attachmentLabel: "" }] };
    case "sample-id":   return { ...base, label: "Sample ID", masterBinding: "sample" };
    case "project-id":  return { ...base, label: "Project No.", masterBinding: "project" };
    case "instrument":  return { ...base, label: "Instrument", masterBinding: "instrument" };
    case "user-field":  return { ...base, label: "User", masterBinding: "user" };
    case "attachment":  return { ...base, label: "Attachment" };
    case "qrcode":      return { ...base, label: "QR Code", required: false };
    case "instrument-capture": return { ...base, label: "Instrument Reading",
                          instrumentType: "balance", captureUnit: "mg" };
    default:            return base;
  }
}

export function defaultLabel(type: FieldType): string {
  const found = ALL_PALETTE.find(p => p.type === type);
  return found?.label ?? type;
}

export function paletteInfo(type: FieldType): PaletteEntry {
  return ALL_PALETTE.find(p => p.type === type) ?? { type, label: type, icon: Type, color: "#6B6560" };
}

/* ════════════════════════════════════════════════════════════════════
   FIELD PALETTE (left panel)
════════════════════════════════════════════════════════════════════ */

export function FieldPalette({ onAdd, activeDragId }:
  { onAdd: (type: FieldType) => void; activeDragId: string | null }) {
  return (
    <div style={{ padding: '12px 10px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--text-muted)', marginBottom: 10, padding: '0 4px' }}>
        Field Types
      </div>
      {PALETTE.map(group => (
        <div key={group.group} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--text-muted)', marginBottom: 5, padding: '0 4px' }}>
            {group.group}
          </div>
          {group.items.map(item => (
            <DraggablePaletteItem key={item.type} item={item} onAdd={onAdd}
              isDragging={activeDragId === `palette:${item.type}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

function DraggablePaletteItem({ item, onAdd, isDragging }:
  { item: PaletteEntry; onAdd: (t: FieldType) => void; isDragging: boolean }) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `palette:${item.type}`,
    data: { type: item.type, source: 'palette' },
  });
  const Icon = item.icon;
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onAdd(item.type)}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
        borderRadius: 7, cursor: 'grab', marginBottom: 2, opacity: isDragging ? 0.4 : 1,
        border: '1px solid transparent', userSelect: 'none',
        background: isDragging ? 'var(--bg-card)' : 'transparent' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
        (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
      }}>
      <div style={{ width: 26, height: 26, borderRadius: 6, background: `${item.color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={13} style={{ color: item.color }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   DRAG OVERLAYS
════════════════════════════════════════════════════════════════════ */

export function PaletteDragOverlay({ type }: { type: FieldType }) {
  const info = paletteInfo(type);
  const Icon = info.icon;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
      background: 'white', border: `1.5px solid ${info.color}`,
      borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', cursor: 'grabbing', width: 180 }}>
      <div style={{ width: 26, height: 26, borderRadius: 6, background: `${info.color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={13} style={{ color: info.color }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{info.label}</span>
    </div>
  );
}

export function FieldDragOverlay({ field }: { field: FormField | null }) {
  if (!field) return null;
  const info = paletteInfo(field.type);
  return (
    <div style={{ padding: '10px 14px', background: 'white',
      border: `1.5px solid ${info.color}`, borderRadius: 8,
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)', cursor: 'grabbing', width: 360, opacity: 0.95 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{field.label}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{info.label}</div>
    </div>
  );
}
