"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Input, Select, Upload, Modal, Progress, Steps } from "antd";
import { UploadCloud, FileText, X, Info, Sparkles } from "lucide-react";
import type { FormField, FormTemplate } from "../types";
import { DEFAULT_HEADER, DEFAULT_FOOTER, loadForms, upsertForm } from "../store";
import { CURRENT_USER } from "../masterData";
import { CATEGORIES, DEPARTMENTS } from "../formUtils";

const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;

const EXTRACTION_STEPS = [
  'Uploading document',
  'Analyzing page layout',
  'Detecting fields & sections',
  'Mapping fields to LIMS data types',
  'Generating draft form',
];

/* ════════════════════════════════════════════════════════════════════
   STARTER FIELD GENERATION (simulated extraction result)
════════════════════════════════════════════════════════════════════ */

function deriveFormName(fileName: string): string {
  const base = fileName.replace(/\.[^/.]+$/, '');
  return base.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function buildStarterFields(category: string, formName: string): FormField[] {
  let n = 0;
  const id = () => `f-${Date.now()}-u${++n}`;

  const fields: FormField[] = [
    { id: id(), type: 'section-header', label: '', required: false, content: formName },
    { id: id(), type: 'instruction', label: '', required: false,
      content: 'Draft generated from the uploaded document. Review field labels, types and validation rules below, then refine using the field palette.' },
    { id: id(), type: 'text', label: 'Reference / Batch No.', required: true },
    { id: id(), type: 'date', label: 'Date', required: true },
    { id: id(), type: 'text', label: 'Analyst', required: true },
  ];

  switch (category) {
    case 'Checklist':
      fields.push(
        { id: id(), type: 'checkbox', label: 'Item 1 Verified', required: true },
        { id: id(), type: 'checkbox', label: 'Item 2 Verified', required: true },
        { id: id(), type: 'checkbox', label: 'Item 3 Verified', required: true },
        { id: id(), type: 'textarea', label: 'Remarks', required: false },
      );
      break;
    case 'Log Sheet':
      fields.push({
        id: id(), type: 'table', label: 'Log Entries', required: false,
        columns: [
          { id: 'c1', header: 'Time', type: 'text' },
          { id: 'c2', header: 'Reading', type: 'number' },
          { id: 'c3', header: 'Initials', type: 'text' },
        ],
        defaultRows: 5, allowAddRows: true,
      });
      break;
    case 'Batch Record':
    case 'Protocol':
    case 'Method':
    case 'Method Validation':
    case 'SOP':
      fields.push({
        id: id(), type: 'step-section', label: '', required: false,
        steps: [
          { id: `step-${Date.now()}-1`, title: 'Step 1', instruction: 'Describe the first procedural step.', fields: [], hasSignDate: true },
        ],
      });
      break;
    default:
      fields.push({ id: id(), type: 'textarea', label: 'Notes / Observations', required: false });
  }

  fields.push({ id: id(), type: 'e-signature', label: 'Performed By', required: true, signatureRole: 'Performed By', requirePassword: true });

  return fields;
}

function buildDraftForm(fileName: string, formName: string, category: string, department: string, description: string): FormTemplate {
  const now = new Date().toISOString().slice(0, 10);
  const forms = loadForms();
  const formNo = `F-${department.slice(0, 2).toUpperCase()}-${String(forms.length + 1).padStart(3, '0')}`;
  return {
    id: `form-${Date.now()}`,
    formNo,
    name: formName,
    category,
    department,
    version: '1.0',
    status: 'draft',
    description: description || `Draft generated from uploaded document "${fileName}" via AI-assisted conversion. Review and refine all fields before submitting for approval.`,
    pages: [{ id: 'p1', title: 'Page 1', fields: buildStarterFields(category, formName) }],
    createdBy: CURRENT_USER.name,
    createdAt: now,
    updatedAt: now,
    revisionHistory: [
      { version: '1.0', date: now, author: CURRENT_USER.name, change: `Draft generated from uploaded document "${fileName}" via AI-assisted conversion.` },
    ],
    header: DEFAULT_HEADER,
    footer: DEFAULT_FOOTER,
    orientation: 'portrait',
  };
}

/* ════════════════════════════════════════════════════════════════════
   CREATE FORM FROM DOCUMENT
════════════════════════════════════════════════════════════════════ */

export default function CreateFromDocumentPage() {
  const router = useRouter();

  const [fileName, setFileName] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [category, setCategory] = useState('Worksheet');
  const [department, setDepartment] = useState('General');
  const [description, setDescription] = useState('');

  const [generating, setGenerating] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  function handleFile(file: File): boolean {
    setFileName(file.name);
    if (!formName.trim()) setFormName(deriveFormName(file.name));
    return false; // prevent actual upload — this is a frontend-only simulation
  }

  function handleGenerate() {
    if (!fileName || !formName.trim()) return;
    setGenerating(true);
    setStepIdx(0);
    intervalRef.current = setInterval(() => {
      setStepIdx(prev => {
        const next = prev + 1;
        if (next >= EXTRACTION_STEPS.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimeout(() => {
            const draft = buildDraftForm(fileName, formName.trim(), category, department, description.trim());
            upsertForm(draft);
            router.push(`/form-creation/builder/${draft.id}`);
          }, 500);
        }
        return Math.min(next, EXTRACTION_STEPS.length);
      });
    }, 550);
  }

  const canGenerate = !!fileName && formName.trim().length > 0;

  return (
    <AppLayout>
      <div className="page-container">

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="section-title">New Form from Document</h1>
            <p className="section-subtitle">Upload an existing paper form, SOP or protocol and generate a draft template to refine in the Builder</p>
          </div>
          <Button onClick={() => router.push('/form-creation')}>Back to Form Library</Button>
        </div>

        {/* Simulation notice */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px',
          borderRadius: 6, background: 'var(--accent-light)', color: 'var(--accent-hover)',
          fontSize: 12.5, marginBottom: 20, lineHeight: 1.5,
        }}>
          <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            In this demo, the uploaded document is not parsed. Instead, a starter form structure — header, key fields,
            and signatures — is generated based on the category you select below, ready for refinement.
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6">

          {/* Upload */}
          <div>
            <div className="block-label">Source Document</div>
            <Dragger multiple={false} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" showUploadList={false}
              beforeUpload={handleFile} style={{ background: 'white' }}>
              <p style={{ marginBottom: 8 }}><UploadCloud size={32} style={{ color: 'var(--accent)' }} /></p>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>Click or drag a file to this area to upload</p>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Supports PDF, Word (.doc/.docx) and scanned images (.png/.jpg)</p>
            </Dragger>

            {fileName && (
              <div className="flex items-center justify-between" style={{
                marginTop: 12, padding: '10px 12px', borderRadius: 6,
                border: '1px solid var(--border)', background: 'white',
              }}>
                <div className="flex items-center gap-2">
                  <FileText size={16} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>{fileName}</span>
                </div>
                <button onClick={() => setFileName(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Form details */}
          <div>
            <div className="block-label">Draft Form Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Form Name</div>
                <Input value={formName} onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Sample Extraction Worksheet" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Category</div>
                  <Select style={{ width: '100%' }} value={category} onChange={setCategory}>
                    {CATEGORIES.map(c => <Option key={c} value={c}>{c}</Option>)}
                  </Select>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Department</div>
                  <Select style={{ width: '100%' }} value={department} onChange={setDepartment}>
                    {DEPARTMENTS.map(d => <Option key={d} value={d}>{d}</Option>)}
                  </Select>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Description (optional)</div>
                <TextArea rows={3} value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Briefly describe the purpose of this form…" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end" style={{ marginTop: 24 }}>
          <Button type="primary" size="large" icon={<Sparkles size={14} />}
            disabled={!canGenerate} onClick={handleGenerate}>
            Generate Draft with AI
          </Button>
        </div>

        {/* Extraction progress modal */}
        <Modal open={generating} closable={false} footer={null} width={460} title="Generating Draft Form…">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingTop: 4 }}>
            <Progress percent={Math.round((Math.min(stepIdx, EXTRACTION_STEPS.length) / EXTRACTION_STEPS.length) * 100)} />
            <Steps direction="vertical" size="small" current={stepIdx}
              items={EXTRACTION_STEPS.map(s => ({ title: s }))} />
          </div>
        </Modal>

      </div>
    </AppLayout>
  );
}
