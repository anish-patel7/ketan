"use client";

import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Tooltip } from "antd";
import {
  Plus, GripVertical, Copy, Trash2, PenLine, EyeOff, QrCode, Paperclip, Cpu,
} from "lucide-react";
import type { FormField, FormPage } from "../../types";
import { paletteInfo, type PaletteEntry } from "./palette";
import { INSTRUMENT_TYPE_LABEL } from "../../formUtils";

/* ════════════════════════════════════════════════════════════════════
   FORM CANVAS (center panel)
════════════════════════════════════════════════════════════════════ */

export function FormCanvas({ page, selectedFieldId, onSelectField, onDeleteField, onDuplicateField }:
  { page: FormPage; selectedFieldId: string | null;
    onSelectField: (id: string | null) => void;
    onDeleteField: (id: string) => void;
    onDuplicateField: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas' });

  return (
    <div ref={setNodeRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 32px' }}
      onClick={() => onSelectField(null)}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Form paper */}
        <div style={{ background: 'white', borderRadius: 12, minHeight: 500,
          border: `2px solid ${isOver ? 'var(--accent)' : 'var(--border)'}`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)', transition: 'border-color 0.15s',
          padding: '32px 40px' }}>

          <SortableContext items={page.fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
            {page.fields.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', minHeight: 320, gap: 12 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--bg-card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={24} style={{ color: 'var(--border-strong)' }} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                  Drag fields from the left panel<br />or click any field to add it
                </div>
              </div>
            ) : (
              page.fields.map(field => (
                <SortableFieldCard
                  key={field.id}
                  field={field}
                  isSelected={selectedFieldId === field.id}
                  onSelect={() => onSelectField(field.id)}
                  onDelete={() => onDeleteField(field.id)}
                  onDuplicate={() => onDuplicateField(field.id)}
                />
              ))
            )}
          </SortableContext>

          {page.fields.length > 0 && (
            <div style={{ marginTop: 16, padding: '12px 0', borderTop: '1px dashed var(--border)',
              textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
              Drop more fields here · {page.fields.length} field{page.fields.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   SORTABLE FIELD CARD
════════════════════════════════════════════════════════════════════ */

function SortableFieldCard({ field, isSelected, onSelect, onDelete, onDuplicate }:
  { field: FormField; isSelected: boolean;
    onSelect: () => void; onDelete: () => void; onDuplicate: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 100 : undefined,
  };

  const info = paletteInfo(field.type);

  return (
    <div ref={setNodeRef} style={style}>
      <div
        onClick={e => { e.stopPropagation(); onSelect(); }}
        style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
          marginBottom: 8, borderRadius: 8, cursor: 'pointer', position: 'relative',
          border: `1.5px solid ${isSelected ? info.color : 'var(--border)'}`,
          background: isSelected ? `${info.color}08` : 'white',
          boxShadow: isSelected ? `0 0 0 3px ${info.color}22` : 'none',
          transition: 'all 0.1s' }}>

        {/* Drag handle */}
        <div {...attributes} {...listeners}
          style={{ cursor: 'grab', color: 'var(--border-strong)', paddingTop: 3, flexShrink: 0 }}
          onClick={e => e.stopPropagation()}>
          <GripVertical size={15} />
        </div>

        {/* Field preview */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <FieldInCanvas field={field} info={info} />
        </div>

        {/* Action buttons (visible on hover / selection) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, opacity: isSelected ? 1 : 0 }}>
          {field.visibilityRule?.fieldId && (
            <Tooltip title="Conditionally visible">
              <span style={{ display: 'flex', color: 'var(--text-muted)', padding: 3 }}>
                <EyeOff size={13} />
              </span>
            </Tooltip>
          )}
          <Tooltip title="Duplicate">
            <button onClick={e => { e.stopPropagation(); onDuplicate(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: 3 }}>
              <Copy size={13} />
            </button>
          </Tooltip>
          <Tooltip title="Delete">
            <button onClick={e => { e.stopPropagation(); onDelete(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                color: '#ef4444', padding: 3 }}>
              <Trash2 size={13} />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

/* ── How each field looks inside the canvas ──────────────────────── */

function FieldInCanvas({ field, info }: { field: FormField; info: PaletteEntry }) {
  const Icon = info.icon;
  const inputStyle: React.CSSProperties = {
    border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px',
    fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-page)',
    width: '100%',
  };

  /* Layout-only fields */
  if (field.type === 'section-header') return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)',
        borderBottom: '2px solid var(--border-strong)', paddingBottom: 4 }}>
        {field.content || 'Section Title'}
      </div>
    </div>
  );
  if (field.type === 'instruction') return (
    <div style={{ padding: '8px 12px', background: '#FAFAF8', borderRadius: 6,
      border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)',
      fontStyle: 'italic' }}>
      {field.content || 'Instruction text…'}
    </div>
  );
  if (field.type === 'divider') return (
    <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />
  );

  if (field.type === 'step-section') return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)',
        borderBottom: '2px solid var(--border-strong)', paddingBottom: 5, marginBottom: 10 }}>
        {field.label || 'Step Section'}
      </div>
      {(field.steps ?? []).length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
          No steps — configure in the properties panel →
        </div>
      )}
      {(field.steps ?? []).map((step, idx) => (
        <div key={step.id} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
              {idx + 1}. {step.title || 'Untitled Step'}
            </div>
            {step.instruction && (
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5, lineHeight: 1.5 }}>
                {step.instruction}
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: step.hasSignDate ? 5 : 0 }}>
              {step.fields.map(sf => (
                <div key={sf.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{sf.label}:</span>
                  <div style={{ width: 80, borderBottom: '1px solid var(--border-strong)' }} />
                </div>
              ))}
            </div>
            {step.hasSignDate && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <PenLine size={10} />
                <span>Sign/Date: _______________</span>
              </div>
            )}
          </div>
          {step.attachmentLabel && (
            <div style={{ width: 80, minHeight: 50, border: '1px solid var(--border)', borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: 4, lineHeight: 1.4 }}>
              {step.attachmentLabel}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <div style={{ width: 18, height: 18, borderRadius: 4, background: `${info.color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={10} style={{ color: info.color }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          {field.label}
          {field.required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
        </span>
        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3,
          background: `${info.color}14`, color: info.color,
          fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginLeft: 'auto', flexShrink: 0 }}>
          {info.label}
        </span>
      </div>

      {/* Mock input */}
      {field.type === 'text'     && <div style={inputStyle}>Enter text…</div>}
      {field.type === 'number'   && (
        <div style={{ ...inputStyle, display: 'flex', justifyContent: 'space-between' }}>
          <span>0{field.decimals ? `.${Array(field.decimals+1).join('0')}` : ''}</span>
          {field.unit && <span style={{ color: 'var(--border-strong)' }}>{field.unit}</span>}
        </div>
      )}
      {field.type === 'date'     && <div style={inputStyle}>DD MMM YYYY</div>}
      {field.type === 'datetime' && <div style={inputStyle}>DD MMM YYYY HH:MM</div>}
      {field.type === 'textarea' && <div style={{ ...inputStyle, minHeight: 52 }}>Enter remarks…</div>}
      {field.type === 'barcode'  && <div style={inputStyle}>Scan or enter barcode…</div>}
      {field.type === 'initials' && <div style={{ ...inputStyle, width: 80, textAlign: 'center' }}>___</div>}
      {(field.type === 'dropdown' || field.type === 'radio') && (
        <div style={{ ...inputStyle, display: 'flex', justifyContent: 'space-between' }}>
          <span>Select option…</span><span>▾</span>
        </div>
      )}
      {field.type === 'checkbox' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 16, height: 16, border: '1.5px solid var(--border)', borderRadius: 3 }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Yes / No</span>
        </div>
      )}
      {field.type === 'weigh-slip' && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ ...inputStyle, flex: 1 }}>
            Target: {field.targetWeight ?? '—'} {field.weightUnit ?? 'mg'}
          </div>
          <div style={{ ...inputStyle, flex: 1 }}>Actual weight…</div>
          <div style={{ padding: '5px 10px', background: '#EAF4EE', color: '#4A7C59',
            borderRadius: 6, fontSize: 11, fontWeight: 700, border: '1px solid #81c784' }}>
            {field.toleranceMin ?? 98}–{field.toleranceMax ?? 102}%
          </div>
        </div>
      )}
      {field.type === 'ph-slip' && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ ...inputStyle, flex: 1 }}>
            Target: {field.targetPH ?? '—'} ({field.phMin ?? '—'}–{field.phMax ?? '—'})
          </div>
          <div style={{ ...inputStyle, flex: 1 }}>Actual pH…</div>
        </div>
      )}
      {field.type === 'calculation' && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'monospace' }}>
            = {field.formula || 'formula not set'}
          </div>
          <div style={{ ...inputStyle, background: '#F8F8F8', color: 'var(--text-secondary)' }}>
            Auto-calculated {field.calcUnit ? `(${field.calcUnit})` : ''}
          </div>
        </div>
      )}
      {field.type === 'e-signature' && (
        <div style={{ ...inputStyle, height: 44, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', borderStyle: 'dashed' }}>
          <span style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--text-muted)' }}>
            {field.signatureRole ?? 'Signature'} — awaiting
          </span>
          <PenLine size={13} style={{ color: 'var(--text-muted)' }} />
        </div>
      )}
      {field.type === 'timestamp' && (
        <div style={{ ...inputStyle, background: '#F8F8F8', color: 'var(--text-secondary)' }}>
          Auto-captured: DD MMM YYYY HH:MM:SS
        </div>
      )}
      {(field.type === 'table' || field.type === 'dynamic-table') && (
        <div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ display: 'flex', background: 'var(--bg-card)' }}>
              {(field.columns ?? []).map(col => (
                <div key={col.id} style={{ flex: 1, padding: '5px 10px', fontSize: 11,
                  fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase',
                  letterSpacing: '0.05em', borderRight: '1px solid var(--border)' }}>
                  {col.header}{col.type === 'subtable' && ' (sub-table)'}
                </div>
              ))}
            </div>
            {[...Array(Math.min(field.defaultRows ?? (field.type === 'dynamic-table' ? (field.minRows ?? 1) : 2), 2))].map((_, i) => (
              <div key={i} style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
                {(field.columns ?? []).map(col => (
                  <div key={col.id} style={{ flex: 1, padding: '5px 10px', fontSize: 12,
                    color: 'var(--text-muted)', borderRight: '1px solid var(--border)' }}>—</div>
                ))}
              </div>
            ))}
          </div>
          {field.type === 'dynamic-table' && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              Repeatable: {field.minRows ?? 1}–{field.maxRows ?? 10} rows
            </div>
          )}
        </div>
      )}
      {field.type === 'qrcode' && (
        <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
          <QrCode size={14} />
          <span>Auto-generated QR (form / instance reference)</span>
        </div>
      )}
      {field.type === 'attachment' && (
        <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 8, borderStyle: 'dashed' }}>
          <Paperclip size={14} />
          <span>Attach file…</span>
        </div>
      )}
      {(field.type === 'sample-id' || field.type === 'project-id'
        || field.type === 'instrument' || field.type === 'user-field') && (
        <div style={{ ...inputStyle, display: 'flex', justifyContent: 'space-between' }}>
          <span>
            Select {field.masterBinding ?? 'item'}…
            {field.type === 'instrument' && field.instrumentType && ` (${INSTRUMENT_TYPE_LABEL[field.instrumentType]})`}
          </span>
          <span>▾</span>
        </div>
      )}
      {field.type === 'instrument-capture' && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ ...inputStyle, flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Cpu size={13} />
            Capture from {INSTRUMENT_TYPE_LABEL[field.instrumentType ?? 'balance']}
          </div>
          {field.targetWeight !== undefined && (
            <div style={{ padding: '5px 10px', background: '#EAF4EE', color: '#4A7C59',
              borderRadius: 6, fontSize: 11, fontWeight: 700, border: '1px solid #81c784' }}>
              Target {field.targetWeight} {field.weightUnit ?? field.captureUnit}
            </div>
          )}
        </div>
      )}
      {field.helpText && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{field.helpText}</div>
      )}
    </div>
  );
}
