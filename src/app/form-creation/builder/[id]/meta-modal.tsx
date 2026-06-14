"use client";

import { Input, Select, Modal, Form } from "antd";

const { Option } = Select;
const { TextArea } = Input;

export const CATEGORIES = ["Worksheet","Log Sheet","Checklist","Batch Record","SOP","Protocol","Method","Method Validation","General"];
export const DEPARTMENTS = ["Clinical","Bioanalytical","Freezer Room","General"];

/* ════════════════════════════════════════════════════════════════════
   META MODAL (form properties)
════════════════════════════════════════════════════════════════════ */

export function MetaModal({ open, form, onClose, onSave }:
  { open: boolean; form: ReturnType<typeof Form.useForm>[0]; onClose: () => void;
    onSave: (v: Record<string, string>) => void }) {
  return (
    <Modal title={<span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 17 }}>Form Properties</span>}
      open={open} onCancel={onClose} width={520}
      onOk={() => form.validateFields().then(v => onSave(v as Record<string, string>))}
      okText="Apply">
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item name="formNo" label="Form Number" rules={[{ required: true }]}>
            <Input placeholder="e.g. F-BA-001" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="version" label="Version" rules={[{ required: true }]} initialValue="1.0">
            <Input placeholder="1.0" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="name" label="Form Name" rules={[{ required: true }]} style={{ gridColumn: 'span 2' }}>
            <Input placeholder="e.g. Solution Preparation Log" />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select placeholder="Select">
              {CATEGORIES.map(c => <Option key={c} value={c}>{c}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="department" label="Department" rules={[{ required: true }]}>
            <Select placeholder="Select">
              {DEPARTMENTS.map(d => <Option key={d} value={d}>{d}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Description / Purpose" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
            <TextArea rows={2} placeholder="Brief purpose of this form…" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
