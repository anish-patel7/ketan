"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Button, Form, message, Tooltip } from "antd";
import {
  ArrowLeft, Eye, Save, Plus, X, Settings,
  Send, CheckCircle2, RotateCcw, XCircle,
} from "lucide-react";
import type { FormField, FormPage, FormTemplate, FieldType, FormStatus } from "../../types";
import { getForm, upsertForm, loadForms, DEFAULT_HEADER, DEFAULT_FOOTER } from "../../store";
import { STATUS_LABEL, STATUS_STYLE, STATUS_FLOW, TONE_STYLE, type StatusTone } from "../../formUtils";
import { CURRENT_USER } from "../../masterData";
import { logAuditEvent } from "../../formAudit";
import { FieldPalette, PaletteDragOverlay, FieldDragOverlay, createField } from "./palette";
import { FormCanvas } from "./canvas";
import { MetaModal } from "./meta-modal";
import { PreviewModal } from "./preview-modal";
import { PropertiesPanel, EmptyProperties } from "./properties-panel";
import { PageSetupModal } from "./page-setup-modal";

const TONE_ICON: Record<StatusTone, React.ElementType> = {
  info: Send, success: CheckCircle2, warning: RotateCcw, danger: XCircle,
};

/* ════════════════════════════════════════════════════════════════════
   MAIN BUILDER PAGE
════════════════════════════════════════════════════════════════════ */

export default function FormBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router  = useRouter();
  const isNew   = id === 'new';

  /* ── form state ── */
  const [form, setForm] = useState<FormTemplate>(() => {
    if (!isNew) {
      const existing = getForm(id);
      if (existing) return existing;
    }
    return {
      id: `form-${Date.now()}`,
      formNo: '',
      name: 'Untitled Form',
      category: 'General',
      department: 'General',
      version: '1.0',
      status: 'draft',
      description: '',
      pages: [{ id: 'p1', title: 'Page 1', fields: [] }],
      createdBy: CURRENT_USER.name,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
      revisionHistory: [],
      header: DEFAULT_HEADER,
      footer: DEFAULT_FOOTER,
      orientation: 'portrait',
    };
  });

  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId]       = useState<string | null>(null);
  const [previewOpen, setPreviewOpen]         = useState(false);
  const [metaOpen, setMetaOpen]               = useState(false);
  const [pageSetupOpen, setPageSetupOpen]     = useState(false);
  const [metaForm] = Form.useForm();

  /* ── redirect if the requested form doesn't exist ── */
  useEffect(() => {
    if (!isNew && !getForm(id)) {
      message.error('Form not found');
      router.push('/form-creation');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ── DnD sensors ── */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  /* ── current page ── */
  const currentPage = form.pages[currentPageIdx] ?? form.pages[0];

  /* ── helpers ── */
  const updatePages = useCallback((updater: (pages: FormPage[]) => FormPage[]) => {
    setForm(prev => ({ ...prev, pages: updater(prev.pages), updatedAt: new Date().toISOString().slice(0, 10) }));
  }, []);

  function addField(type: FieldType, insertBeforeId?: string) {
    const field = createField(type);
    updatePages(pages => pages.map((p, i) => {
      if (i !== currentPageIdx) return p;
      const fields = [...p.fields];
      const idx = insertBeforeId ? fields.findIndex(f => f.id === insertBeforeId) : -1;
      if (idx >= 0) fields.splice(idx, 0, field);
      else fields.push(field);
      return { ...p, fields };
    }));
    setSelectedFieldId(field.id);
  }

  function updateField(fieldId: string, changes: Partial<FormField>) {
    updatePages(pages => pages.map((p, i) =>
      i !== currentPageIdx ? p : {
        ...p,
        fields: p.fields.map(f => f.id === fieldId ? { ...f, ...changes } : f),
      }
    ));
  }

  function deleteField(fieldId: string) {
    updatePages(pages => pages.map((p, i) =>
      i !== currentPageIdx ? p : { ...p, fields: p.fields.filter(f => f.id !== fieldId) }
    ));
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  }

  function duplicateField(fieldId: string) {
    updatePages(pages => pages.map((p, i) => {
      if (i !== currentPageIdx) return p;
      const idx = p.fields.findIndex(f => f.id === fieldId);
      if (idx < 0) return p;
      const clone = { ...p.fields[idx], id: `f-${Date.now()}` };
      const fields = [...p.fields];
      fields.splice(idx + 1, 0, clone);
      return { ...p, fields };
    }));
  }

  function addPage() {
    const id = `p-${Date.now()}`;
    updatePages(pages => [...pages, { id, title: `Page ${pages.length + 1}`, fields: [] }]);
    setCurrentPageIdx(form.pages.length);
  }

  function deletePage(idx: number) {
    if (form.pages.length === 1) { message.warning('A form must have at least one page.'); return; }
    updatePages(pages => pages.filter((_, i) => i !== idx));
    setCurrentPageIdx(Math.max(0, idx - 1));
  }

  function updatePageTitle(idx: number, title: string) {
    updatePages(pages => pages.map((p, i) => i === idx ? { ...p, title } : p));
  }

  /* ── DnD handlers ── */
  function handleDragStart({ active }: DragStartEvent) {
    setActiveDragId(active.id.toString());
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveDragId(null);
    if (!over) return;
    const activeId = active.id.toString();
    const overId   = over.id.toString();

    if (activeId.startsWith('palette:')) {
      const type = activeId.replace('palette:', '') as FieldType;
      const insertBefore = overId === 'canvas' ? undefined : overId;
      addField(type, insertBefore);
      return;
    }

    if (activeId !== overId && !overId.startsWith('canvas')) {
      updatePages(pages => pages.map((p, i) => {
        if (i !== currentPageIdx) return p;
        const oldIdx = p.fields.findIndex(f => f.id === activeId);
        const newIdx = p.fields.findIndex(f => f.id === overId);
        if (oldIdx < 0 || newIdx < 0) return p;
        return { ...p, fields: arrayMove(p.fields, oldIdx, newIdx) };
      }));
    }
  }

  /* ── save / lifecycle ── */
  function handleSave(newStatus?: FormStatus) {
    if (!form.formNo.trim()) {
      setMetaOpen(true);
      metaForm.setFieldsValue({ formNo: form.formNo, name: form.name,
        category: form.category, department: form.department,
        version: form.version, description: form.description });
      message.warning('Please set the Form Number before saving.');
      return;
    }
    const oldStatus = form.status;
    const now = new Date().toISOString().slice(0, 10);
    const toSave: FormTemplate = {
      ...form, status: newStatus ?? form.status, updatedAt: now,
      ...(newStatus === 'effective' ? { effectiveDate: now } : {}),
      ...(newStatus === 'obsolete' ? { obsoleteDate: now } : {}),
    };
    if (isNew) {
      const existing = loadForms();
      toSave.formNo = toSave.formNo || `F-${form.department.slice(0,2).toUpperCase()}-${String(existing.length + 1).padStart(3,'0')}`;
    }
    upsertForm(toSave);
    setForm(toSave);
    if (newStatus && newStatus !== oldStatus) {
      logAuditEvent({
        actor: CURRENT_USER.name, actorRole: CURRENT_USER.role, category: 'form-status',
        formId: toSave.id, formNo: toSave.formNo,
        oldValue: STATUS_LABEL[oldStatus], newValue: STATUS_LABEL[newStatus],
        detail: `${toSave.formNo} status changed from ${STATUS_LABEL[oldStatus]} to ${STATUS_LABEL[newStatus]}.`,
      });
      message.success(`Status updated to ${STATUS_LABEL[newStatus]}`);
    } else {
      message.success('Form saved.');
    }
    if (isNew) router.replace(`/form-creation/builder/${toSave.id}`);
  }

  /* ── page setup (header/footer/orientation) ── */
  function updateFormMeta(changes: Partial<FormTemplate>) {
    setForm(prev => ({ ...prev, ...changes, updatedAt: new Date().toISOString().slice(0, 10) }));
  }

  /* ── create a new draft version, branched from the current form ── */
  function handleCreateVersion(info: { version: string; change: string; changeControlRef?: string }) {
    const now = new Date().toISOString().slice(0, 10);
    const newId = `form-${Date.now()}`;
    const newForm: FormTemplate = {
      ...form,
      id: newId,
      version: info.version,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      effectiveDate: undefined,
      obsoleteDate: undefined,
      previousVersionId: form.id,
      nextVersionId: undefined,
      changeControlRef: info.changeControlRef,
      revisionHistory: [
        ...form.revisionHistory,
        { version: info.version, date: now, author: CURRENT_USER.name, change: info.change, changeControlRef: info.changeControlRef },
      ],
    };
    const updatedCurrent: FormTemplate = { ...form, nextVersionId: newId };
    upsertForm(updatedCurrent);
    upsertForm(newForm);
    setForm(updatedCurrent);
    logAuditEvent({
      actor: CURRENT_USER.name, actorRole: CURRENT_USER.role, category: 'form-version',
      formId: newId, formNo: newForm.formNo,
      oldValue: `v${form.version}`, newValue: `v${info.version}`,
      detail: `New version v${info.version} of ${form.formNo} branched from v${form.version}`
        + `${info.changeControlRef ? ` (Change Control ${info.changeControlRef})` : ''}: ${info.change}`,
    });
    message.success(`Version ${info.version} created as a new draft.`);
    setPageSetupOpen(false);
    router.push(`/form-creation/builder/${newId}`);
  }

  /* ── selected field ── */
  const selectedField = currentPage?.fields.find(f => f.id === selectedFieldId) ?? null;

  /* ── all field labels (for formula reference picker) ── */
  const allFieldLabels = currentPage?.fields
    .filter(f => f.type !== 'section-header' && f.type !== 'instruction' && f.type !== 'divider' && f.label)
    .map(f => f.label) ?? [];

  /* ── all fields (for visibility-rule reference picker) ── */
  const allFields = currentPage?.fields
    .filter(f => f.type !== 'section-header' && f.type !== 'instruction' && f.type !== 'divider' && f.label)
    .map(f => ({ id: f.id, label: f.label })) ?? [];

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#1C1B18', overflow: 'hidden' }}>

        {/* ── Top Bar ── */}
        <TopBar
          form={form}
          onBack={() => router.push('/form-creation')}
          onSave={() => handleSave()}
          onStatusChange={status => handleSave(status)}
          onPreview={() => setPreviewOpen(true)}
          onPageSetup={() => setPageSetupOpen(true)}
          onEditMeta={() => {
            metaForm.setFieldsValue({ formNo: form.formNo, name: form.name,
              category: form.category, department: form.department,
              version: form.version, description: form.description });
            setMetaOpen(true);
          }}
        />

        {/* ── Three-panel layout ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Left: Palette */}
          <div style={{ width: 220, background: '#FAF9F6', borderRight: '1px solid #E0DBD3',
            overflowY: 'auto', flexShrink: 0 }}>
            <FieldPalette onAdd={addField} activeDragId={activeDragId} />
          </div>

          {/* Center: Canvas */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F2F0EB',
            overflow: 'hidden' }}>
            {/* Page tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '0 16px',
              background: 'white', borderBottom: '1px solid var(--border)', minHeight: 44, flexShrink: 0 }}>
              {form.pages.map((page, idx) => (
                <PageTab key={page.id} page={page}
                  isActive={idx === currentPageIdx}
                  canDelete={form.pages.length > 1}
                  onSelect={() => { setCurrentPageIdx(idx); setSelectedFieldId(null); }}
                  onRename={title => updatePageTitle(idx, title)}
                  onDelete={() => deletePage(idx)} />
              ))}
              <button onClick={addPage}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  fontSize: 12, borderRadius: 6, marginLeft: 4 }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
                <Plus size={13} /> Add Page
              </button>
            </div>

            {/* Canvas drop zone */}
            <FormCanvas
              page={currentPage}
              selectedFieldId={selectedFieldId}
              onSelectField={setSelectedFieldId}
              onDeleteField={deleteField}
              onDuplicateField={duplicateField}
            />
          </div>

          {/* Right: Properties */}
          <div style={{ width: 300, background: 'white', borderLeft: '1px solid var(--border)',
            overflowY: 'auto', flexShrink: 0 }}>
            {selectedField ? (
              <PropertiesPanel
                field={selectedField}
                allLabels={allFieldLabels}
                allFields={allFields}
                onChange={changes => updateField(selectedField.id, changes)}
                onDelete={() => deleteField(selectedField.id)}
              />
            ) : (
              <EmptyProperties />
            )}
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeDragId?.startsWith('palette:') && (
          <PaletteDragOverlay type={activeDragId.replace('palette:', '') as FieldType} />
        )}
        {activeDragId && !activeDragId.startsWith('palette:') && (
          <FieldDragOverlay
            field={currentPage?.fields.find(f => f.id === activeDragId) ?? null}
          />
        )}
      </DragOverlay>

      {/* Form metadata modal */}
      <MetaModal
        open={metaOpen}
        form={metaForm}
        onClose={() => setMetaOpen(false)}
        onSave={values => {
          setForm(prev => ({ ...prev, ...values }));
          setMetaOpen(false);
        }}
      />

      {/* Preview modal */}
      <PreviewModal open={previewOpen} form={form} onClose={() => setPreviewOpen(false)} />

      {/* Page setup & versioning modal */}
      <PageSetupModal
        open={pageSetupOpen}
        form={form}
        onClose={() => setPageSetupOpen(false)}
        onChange={updateFormMeta}
        onCreateVersion={handleCreateVersion}
      />
    </DndContext>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TOP BAR
════════════════════════════════════════════════════════════════════ */

function TopBar({ form, onBack, onSave, onStatusChange, onPreview, onPageSetup, onEditMeta }:
  { form: FormTemplate; onBack: () => void; onSave: () => void;
    onStatusChange: (status: FormStatus) => void;
    onPreview: () => void; onPageSetup: () => void; onEditMeta: () => void }) {
  const statusStyle = STATUS_STYLE[form.status];
  return (
    <div style={{ height: 52, background: '#232320', display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 12, flexShrink: 0, borderBottom: '1px solid #1a1a17' }}>
      <button onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8A8678',
          background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: '4px 8px',
          borderRadius: 6 }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#E8E4DC'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#8A8678'}>
        <ArrowLeft size={14} /> Form Library
      </button>

      <div style={{ width: 1, height: 20, background: '#3A3A34' }} />

      <button onClick={onEditMeta}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none',
          border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#2E2E2A'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
        <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 15, color: '#E8E4DC' }}>
          {form.name || 'Untitled Form'}
        </span>
        {form.formNo && (
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#8A8678' }}>{form.formNo}</span>
        )}
        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 3,
          background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`,
          textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {STATUS_LABEL[form.status]}
        </span>
      </button>

      <div style={{ flex: 1 }} />

      <span style={{ fontSize: 11, color: '#5C5A54' }}>
        {form.pages.length} page{form.pages.length !== 1 ? 's' : ''} · v{form.version}
      </span>

      <Button size="small" icon={<Settings size={12} />} onClick={onPageSetup}
        style={{ background: '#2E2E2A', border: '1px solid #3A3A34', color: '#E8E4DC', fontSize: 12 }}>
        Page Setup
      </Button>
      <Button size="small" icon={<Eye size={12} />} onClick={onPreview}
        style={{ background: '#2E2E2A', border: '1px solid #3A3A34', color: '#E8E4DC', fontSize: 12 }}>
        Preview
      </Button>
      <Button size="small" icon={<Save size={12} />} onClick={onSave}
        style={{ background: '#2E2E2A', border: '1px solid #3A3A34', color: '#E8E4DC', fontSize: 12 }}>
        Save Draft
      </Button>

      {STATUS_FLOW[form.status].map(t => {
        const ts = TONE_STYLE[t.tone];
        const Icon = TONE_ICON[t.tone];
        return (
          <Tooltip key={t.next} title={t.label}>
            <button onClick={() => onStatusChange(t.next)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px',
                borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: ts.bg, border: `1px solid ${ts.border}`, color: ts.color,
                whiteSpace: 'nowrap' }}>
              <Icon size={12} /> {t.label}
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   PAGE TAB
════════════════════════════════════════════════════════════════════ */

function PageTab({ page, isActive, canDelete, onSelect, onRename, onDelete }:
  { page: FormPage; isActive: boolean; canDelete: boolean;
    onSelect: () => void; onRename: (t: string) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(page.title);

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 12px', height: 44,
        borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
        cursor: 'pointer', fontSize: 12,
        color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
        fontWeight: isActive ? 600 : 400, userSelect: 'none' }}
      onClick={onSelect}>
      {editing ? (
        <input autoFocus value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={() => { onRename(val); setEditing(false); }}
          onKeyDown={e => { if (e.key === 'Enter') { onRename(val); setEditing(false); } }}
          onClick={e => e.stopPropagation()}
          style={{ border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'inherit', fontSize: 12, width: 90 }} />
      ) : (
        <span onDoubleClick={e => { e.stopPropagation(); setEditing(true); }}>{page.title}</span>
      )}
      <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 2 }}>
        ({page.fields.length})
      </span>
      {isActive && canDelete && (
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
            padding: 1, display: 'flex', marginLeft: 2 }}>
          <X size={11} />
        </button>
      )}
    </div>
  );
}
