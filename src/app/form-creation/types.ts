export type StepInlineField = {
  id: string;
  label: string;
  placeholder?: string;
};

export type FormStep = {
  id: string;
  title: string;
  instruction?: string;
  fields: StepInlineField[];
  hasSignDate: boolean;
  attachmentLabel?: string;
};

export type FieldType =
  | 'text' | 'number' | 'date' | 'datetime' | 'dropdown' | 'radio'
  | 'checkbox' | 'textarea'
  | 'weigh-slip' | 'ph-slip' | 'calculation' | 'barcode'
  | 'section-header' | 'instruction' | 'divider' | 'table'
  | 'e-signature' | 'timestamp' | 'initials' | 'step-section'
  | 'qrcode' | 'sample-id' | 'project-id' | 'instrument' | 'user-field'
  | 'attachment' | 'instrument-capture' | 'dynamic-table';

export type TableColumn = {
  id: string;
  header: string;
  type: 'text' | 'number' | 'dropdown' | 'subtable';
  options?: string;   // comma-separated for dropdown columns
  width?: number;
  subColumns?: { id: string; header: string }[]; // for nested mini-table column (dynamic-table only)
};

/* ── Master-data binding ──────────────────────────────────────────── */

export type MasterBinding = 'project' | 'sample' | 'instrument' | 'user';

export type InstrumentType =
  | 'balance' | 'hplc' | 'lcms' | 'gc' | 'dissolution' | 'uv' | 'ph-meter' | 'moisture-analyzer';

/* ── Conditional visibility ───────────────────────────────────────── */

export type VisOperator =
  | 'equals' | 'not-equals' | 'contains' | 'gt' | 'lt' | 'is-checked' | 'is-empty' | 'not-empty';

export type VisibilityRule = {
  fieldId: string;
  operator: VisOperator;
  value?: string;
};

export type FormField = {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;

  /* Number */
  unit?: string;
  decimals?: number;
  numMin?: number;
  numMax?: number;

  /* Dropdown / Radio */
  options?: string;   // comma-separated

  /* Weigh Slip / Instrument Capture (target + tolerance) */
  targetWeight?: number;
  weightUnit?: string;
  toleranceMin?: number;
  toleranceMax?: number;
  passLabel?: string;
  failLabel?: string;
  reweighLabel?: string;

  /* pH Slip */
  targetPH?: number;
  phMin?: number;
  phMax?: number;

  /* Calculation */
  formula?: string;
  calcUnit?: string;
  calcDecimals?: number;

  /* Table / Dynamic Table */
  columns?: TableColumn[];
  allowAddRows?: boolean;
  defaultRows?: number;
  minRows?: number;
  maxRows?: number;

  /* E-Signature */
  signatureRole?: string;
  requirePassword?: boolean;

  /* Section Header / Instruction */
  content?: string;

  /* Step Section */
  steps?: FormStep[];

  /* Smart / Master-Data Fields */
  masterBinding?: MasterBinding;

  /* Instrument Capture */
  instrumentType?: InstrumentType;
  captureUnit?: string;

  /* Conditional visibility (any field type) */
  visibilityRule?: VisibilityRule;
};

export type FormPage = {
  id: string;
  title: string;
  fields: FormField[];
};

export type FormStatus =
  | 'draft' | 'under-review' | 'qa-review' | 'approved'
  | 'effective' | 'live' | 'obsolete' | 'archived';

export type RevisionEntry = {
  version: string;
  date: string;
  author: string;
  change: string;
  changeControlRef?: string;
};

export type FormHeaderConfig = {
  companyName: string;
  showLogo: boolean;
  watermarkText?: string;
};

export type FormFooterConfig = {
  showPageNumbers: boolean;
  showQrCode: boolean;
  showAuditRef: boolean;
};

export type FormTemplate = {
  id: string;
  formNo: string;
  name: string;
  category: string;
  department: string;
  version: string;
  status: FormStatus;
  description: string;
  pages: FormPage[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  /* Lifecycle */
  effectiveDate?: string;
  obsoleteDate?: string;
  revisionHistory: RevisionEntry[];
  changeControlRef?: string;
  previousVersionId?: string;
  nextVersionId?: string;

  /* Page setup */
  header: FormHeaderConfig;
  footer: FormFooterConfig;
  orientation: 'portrait' | 'landscape';
};

/* ════════════════════════════════════════════════════════════════════
   E-SIGNATURES
════════════════════════════════════════════════════════════════════ */

export type SignatureRecord = {
  userId: string;
  userName: string;
  role: string;
  meaning: string;
  reason: string;
  timestamp: string;
};

/* ════════════════════════════════════════════════════════════════════
   ISSUED FORM INSTANCES
════════════════════════════════════════════════════════════════════ */

export type InstanceStatus = 'issued' | 'in-progress' | 'completed' | 'under-review' | 'approved';

export type FormIssuedInstance = {
  id: string;
  instanceNo: string;
  formId: string;
  formNo: string;
  formName: string;
  version: string;
  projectNo: string;
  projectName: string;
  studyNo?: string;
  status: InstanceStatus;
  issuedAt: string;
  issuedBy: string;

  /* Snapshot of the template at the time of issuance */
  pages: FormPage[];
  header: FormHeaderConfig;
  footer: FormFooterConfig;
  orientation: 'portrait' | 'landscape';

  values: Record<string, string>;
  signatures: Record<string, SignatureRecord>;
  completedAt?: string;
};

/* ════════════════════════════════════════════════════════════════════
   AUDIT TRAIL
════════════════════════════════════════════════════════════════════ */

export type AuditCategory =
  | 'form-status' | 'form-version' | 'form-issued'
  | 'instance-status' | 'instance-value' | 'instance-signed' | 'instrument-capture';

export type AuditEvent = {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  category: AuditCategory;
  formId?: string;
  formNo?: string;
  instanceId?: string;
  instanceNo?: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  detail: string;
};

/* ════════════════════════════════════════════════════════════════════
   MASTER DATA
════════════════════════════════════════════════════════════════════ */

export type ProjectMasterEntry = {
  id: string;
  projectNo: string;
  studyNo: string;
  name: string;
  sponsor: string;
};

export type SampleMasterEntry = {
  id: string;
  sampleId: string;
  projectNo: string;
  matrix: string;
  status: string;
};

export type InstrumentMasterEntry = {
  id: string;
  instrumentId: string;
  name: string;
  type: InstrumentType;
  location: string;
  calibrationDue: string;
};

export type UserMasterEntry = {
  id: string;
  userId: string;
  name: string;
  role: string;
  department: string;
};
