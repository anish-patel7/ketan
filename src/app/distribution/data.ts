// ── Types ──────────────────────────────────────────────────────────────────

export type SampleRow = {
  pos: number;
  id: string;
  name: string;
  type: "CC" | "QC" | "SES" | "SP" | "BLK/BLK" | "LLOQ" | "ULOQ" | "Subject";
  level?: string;
  conc: string | null;
  subject?: string;
  tp?: string;
};

// "Other samples" — appended to the end of the run layout, one row each when selected
export type OtherSamplesConfig = {
  ses: boolean;
  sp: boolean;
  blkBlk: boolean;
  lloq: boolean;
  uloq: boolean;
};

export const DEFAULT_OTHER_SAMPLES: OtherSamplesConfig = {
  ses: false, sp: false, blkBlk: true, lloq: false, uloq: false,
};

export type DSRecord = {
  id: string;
  project: string;
  projectName: string;
  analyte: string;
  aps: string;
  runNo: number;
  ccLevels: number;
  qcSamples: number;
  subjectSamples: number;
  totalPositions: number;
  status: "draft" | "pending" | "approved" | "retrieved" | "rejected";
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  retrievalReqId?: string;
  rows?: SampleRow[];
};

export type MasterSample = {
  id: string;
  project: string;
  analyte: string;
  subject: string;
  period: string;
  tp: string;
  freezer: string;
  location: string;
  ft: number;
};

export type ApsEntry = {
  aps: string; lloq: string; uloq: string; ccLevels: number;
  ccConcs: string[]; qc: { name: string; conc: string }[];
};

// ── Project / APS master data ───────────────────────────────────────────────

export const PROJECTS_LIST = [
  { id: "SID-2026-001", name: "Metformin BE Study",    analytes: ["MET", "MET-G"] },
  { id: "SID-2026-002", name: "Amlodipine BE Study",   analytes: ["AML"] },
  { id: "SID-2026-003", name: "Atorvastatin BE Study", analytes: ["ATR"] },
];

export const PROJECT_APS: Record<string, Record<string, ApsEntry>> = {
  "SID-2026-001": {
    "MET": {
      aps: "APS042.02", lloq: "1.00", uloq: "200.00", ccLevels: 8,
      ccConcs: ["1.00","2.00","5.00","10.00","20.00","50.00","100.00","200.00"],
      qc: [
        { name: "HQC",     conc: "150.00" },
        { name: "MQC",     conc: "50.00"  },
        { name: "LQC",     conc: "3.00"   },
        { name: "LLOQ QC", conc: "1.00"   },
      ],
    },
    "MET-G": {
      aps: "APS043.01", lloq: "0.50", uloq: "100.00", ccLevels: 8,
      ccConcs: ["0.50","1.00","2.00","5.00","10.00","25.00","50.00","100.00"],
      qc: [
        { name: "HQC",     conc: "75.00" },
        { name: "MQC",     conc: "25.00" },
        { name: "LQC",     conc: "1.50"  },
        { name: "LLOQ QC", conc: "0.50"  },
      ],
    },
  },
  "SID-2026-002": {
    "AML": {
      aps: "APS017.03", lloq: "0.10", uloq: "20.00", ccLevels: 8,
      ccConcs: ["0.10","0.20","0.50","1.00","2.00","5.00","10.00","20.00"],
      qc: [
        { name: "HQC",     conc: "15.00" },
        { name: "MQC",     conc: "5.00"  },
        { name: "LQC",     conc: "0.30"  },
        { name: "LLOQ QC", conc: "0.10"  },
      ],
    },
  },
};

// ── Mastersheet (available samples from Freezer Room) ──────────────────────

export const MASTERSHEET: MasterSample[] = [
  { id:"SID-2026-001-007-P1-0H-MET-1",   project:"SID-2026-001", analyte:"MET",   subject:"007", period:"P1", tp:"0H",   freezer:"FRZ-01", location:"R2-B4-P12", ft:0 },
  { id:"SID-2026-001-007-P1-0.5H-MET-1", project:"SID-2026-001", analyte:"MET",   subject:"007", period:"P1", tp:"0.5H", freezer:"FRZ-01", location:"R2-B4-P13", ft:0 },
  { id:"SID-2026-001-007-P1-1H-MET-1",   project:"SID-2026-001", analyte:"MET",   subject:"007", period:"P1", tp:"1H",   freezer:"FRZ-01", location:"R2-B4-P14", ft:1 },
  { id:"SID-2026-001-007-P1-2H-MET-1",   project:"SID-2026-001", analyte:"MET",   subject:"007", period:"P1", tp:"2H",   freezer:"FRZ-01", location:"R2-B4-P15", ft:2 },
  { id:"SID-2026-001-008-P1-0H-MET-1",   project:"SID-2026-001", analyte:"MET",   subject:"008", period:"P1", tp:"0H",   freezer:"FRZ-01", location:"R2-B5-P01", ft:0 },
  { id:"SID-2026-001-008-P1-0.5H-MET-1", project:"SID-2026-001", analyte:"MET",   subject:"008", period:"P1", tp:"0.5H", freezer:"FRZ-01", location:"R2-B5-P02", ft:0 },
  { id:"SID-2026-001-008-P1-1H-MET-1",   project:"SID-2026-001", analyte:"MET",   subject:"008", period:"P1", tp:"1H",   freezer:"FRZ-01", location:"R2-B5-P03", ft:0 },
  { id:"SID-2026-001-009-P1-0H-MET-1",   project:"SID-2026-001", analyte:"MET",   subject:"009", period:"P1", tp:"0H",   freezer:"FRZ-01", location:"R2-B5-P04", ft:0 },
  { id:"SID-2026-001-009-P1-1H-MET-1",   project:"SID-2026-001", analyte:"MET",   subject:"009", period:"P1", tp:"1H",   freezer:"FRZ-01", location:"R2-B5-P05", ft:0 },
  { id:"SID-2026-001-009-P1-2H-MET-1",   project:"SID-2026-001", analyte:"MET",   subject:"009", period:"P1", tp:"2H",   freezer:"FRZ-01", location:"R2-B5-P06", ft:1 },
  { id:"SID-2026-001-010-P1-0H-MET-1",   project:"SID-2026-001", analyte:"MET",   subject:"010", period:"P1", tp:"0H",   freezer:"FRZ-01", location:"R2-B5-P07", ft:0 },
  { id:"SID-2026-001-010-P1-1H-MET-1",   project:"SID-2026-001", analyte:"MET",   subject:"010", period:"P1", tp:"1H",   freezer:"FRZ-01", location:"R2-B5-P08", ft:0 },
  { id:"SID-2026-001-007-P1-0H-METG-1",  project:"SID-2026-001", analyte:"MET-G", subject:"007", period:"P1", tp:"0H",   freezer:"FRZ-02", location:"R1-B2-P01", ft:0 },
  { id:"SID-2026-001-008-P1-0H-METG-1",  project:"SID-2026-001", analyte:"MET-G", subject:"008", period:"P1", tp:"0H",   freezer:"FRZ-02", location:"R1-B2-P02", ft:0 },
  { id:"SID-2026-002-S01-P1-0H-AML-1",   project:"SID-2026-002", analyte:"AML",   subject:"S01", period:"P1", tp:"0H",   freezer:"FRZ-02", location:"R1-B3-P01", ft:0 },
  { id:"SID-2026-002-S01-P1-1H-AML-1",   project:"SID-2026-002", analyte:"AML",   subject:"S01", period:"P1", tp:"1H",   freezer:"FRZ-02", location:"R1-B3-P02", ft:0 },
  { id:"SID-2026-002-S02-P1-0H-AML-1",   project:"SID-2026-002", analyte:"AML",   subject:"S02", period:"P1", tp:"0H",   freezer:"FRZ-02", location:"R1-B3-P03", ft:0 },
];

// ── Initial ledger ──────────────────────────────────────────────────────────

export const INIT_DS: DSRecord[] = [
  {
    id:"DS-2026-001-008", project:"SID-2026-001", projectName:"Metformin BE Study",
    analyte:"MET", aps:"APS042.02", runNo:8,
    ccLevels:8, qcSamples:4, subjectSamples:6, totalPositions:21,
    status:"pending", createdBy:"A. Liang", createdAt:"18 Apr 2026",
  },
  {
    id:"DS-2026-001-007", project:"SID-2026-001", projectName:"Metformin BE Study",
    analyte:"MET", aps:"APS042.02", runNo:7,
    ccLevels:8, qcSamples:4, subjectSamples:6, totalPositions:21,
    status:"approved", createdBy:"A. Liang", createdAt:"18 Apr 2026",
    approvedBy:"J. Chen", approvedAt:"18 Apr 2026",
  },
  {
    id:"DS-2026-001-006", project:"SID-2026-001", projectName:"Metformin BE Study",
    analyte:"MET", aps:"APS042.02", runNo:6,
    ccLevels:8, qcSamples:4, subjectSamples:6, totalPositions:21,
    status:"retrieved", createdBy:"A. Liang", createdAt:"17 Apr 2026",
    approvedBy:"J. Chen", approvedAt:"17 Apr 2026",
    retrievalReqId:"RET-2026-003",
  },
  {
    id:"DS-2026-001-005", project:"SID-2026-001", projectName:"Metformin BE Study",
    analyte:"MET", aps:"APS042.02", runNo:5,
    ccLevels:8, qcSamples:4, subjectSamples:6, totalPositions:21,
    status:"retrieved", createdBy:"R. Patel", createdAt:"16 Apr 2026",
    approvedBy:"J. Chen", approvedAt:"16 Apr 2026",
    retrievalReqId:"RET-2026-002",
  },
  {
    id:"DS-2026-002-001", project:"SID-2026-002", projectName:"Amlodipine BE Study",
    analyte:"AML", aps:"APS017.03", runNo:1,
    ccLevels:8, qcSamples:4, subjectSamples:4, totalPositions:19,
    status:"approved", createdBy:"R. Patel", createdAt:"17 Apr 2026",
    approvedBy:"J. Chen", approvedAt:"17 Apr 2026",
  },
];

// ── Run layout builder ────────────────────────────────────────────────────

export function buildRunLayout(
  apsData: ApsEntry,
  selectedSamples: MasterSample[],
  runNo: number,
  qcSets: number,
  otherSamples: OtherSamplesConfig,
): SampleRow[] {
  const rows: SampleRow[] = [];
  let pos = 1;

  for (let i = 0; i < apsData.ccLevels; i++) {
    rows.push({ pos: pos++, id:`CC-CC${i+1}-001`, name:`CC Level ${i+1}`, type:"CC", level:`CC${i+1}`, conc:`${apsData.ccConcs[i]} ng/mL` });
  }

  // QC anchor block (HQC / LLOQ QC / interspersed MQC / LQC) repeated for each QC set,
  // with subject samples divided evenly across the sets.
  const hqc    = apsData.qc.find(q => q.name === "HQC");
  const mqc    = apsData.qc.find(q => q.name === "MQC");
  const lqc    = apsData.qc.find(q => q.name === "LQC");
  const lloqQc = apsData.qc.find(q => q.name === "LLOQ QC");

  const sets   = Math.max(1, qcSets);
  const perSet = Math.max(1, Math.ceil(selectedSamples.length / sets));

  for (let set = 0; set < sets; set++) {
    const chunk  = selectedSamples.slice(set * perSet, (set + 1) * perSet);
    const suffix = String(set + 1).padStart(3, "0");

    if (hqc)    rows.push({ pos: pos++, id:`QC-HQC-${suffix}`,    name:`HQC (set ${set + 1})`,     type:"QC", level:"HQC",     conc:`${hqc.conc} ng/mL` });
    if (lloqQc) rows.push({ pos: pos++, id:`QC-LLOQQC-${suffix}`, name:`LLOQ QC (set ${set + 1})`, type:"QC", level:"LLOQ QC", conc:`${lloqQc.conc} ng/mL` });

    chunk.forEach((s, i) => {
      rows.push({ pos: pos++, id:s.id, name:`Subject ${s.subject} / ${s.period} / ${s.tp}`, type:"Subject", subject:s.subject, tp:s.tp, conc:null });
      if (mqc && (i + 1) % 6 === 0 && i < chunk.length - 1) {
        rows.push({ pos: pos++, id:`QC-MQC-${suffix}-${i + 1}`, name:`MQC (set ${set + 1}, interspersed)`, type:"QC", level:"MQC", conc:`${mqc.conc} ng/mL` });
      }
    });

    if (lqc) rows.push({ pos: pos++, id:`QC-LQC-${suffix}`, name:`LQC (set ${set + 1})`, type:"QC", level:"LQC", conc:`${lqc.conc} ng/mL` });
  }

  // Other samples — appended at the end of the run, one row each when selected
  const OTHER_SAMPLE_DEFS: { key: keyof OtherSamplesConfig; type: SampleRow["type"]; name: string }[] = [
    { key:"ses",    type:"SES",     name:"SES Sample" },
    { key:"sp",     type:"SP",      name:"SP Sample" },
    { key:"blkBlk", type:"BLK/BLK", name:"Double Blank (BLK/BLK)" },
    { key:"lloq",   type:"LLOQ",    name:"LLOQ Sample" },
    { key:"uloq",   type:"ULOQ",    name:"ULOQ Sample" },
  ];

  OTHER_SAMPLE_DEFS.forEach(def => {
    if (otherSamples[def.key]) {
      rows.push({ pos: pos++, id:`${def.type.replace("/", "-")}-001`, name:def.name, type:def.type, conc:null });
    }
  });

  return rows;
}

export function nextRunNo(records: DSRecord[], project: string, analyte: string): number {
  const existing = records.filter(d => d.project === project && d.analyte === analyte);
  return existing.length === 0 ? 1 : Math.max(...existing.map(d => d.runNo)) + 1;
}

export function nextDsId(records: DSRecord[], project: string, analyte: string, runNo: number): string {
  const yr = new Date().getFullYear();
  const projSeq = project.slice(-3);
  return `DS-${yr}-${projSeq}-${String(runNo).padStart(3,"0")}`;
}

// ── Ledger persistence (localStorage) ───────────────────────────────────────

const KEY = "lims-distribution-sheets";

export function loadDsRecords(): DSRecord[] {
  if (typeof window === "undefined") return INIT_DS;
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(INIT_DS));
    return INIT_DS;
  }
  try {
    return JSON.parse(raw) as DSRecord[];
  } catch {
    return INIT_DS;
  }
}

export function persistDsRecords(records: DSRecord[]): void {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(records));
}

export function addDsRecord(record: DSRecord): void {
  persistDsRecords([record, ...loadDsRecords()]);
}

export function updateDsRecord(id: string, changes: Partial<DSRecord>): void {
  persistDsRecords(loadDsRecords().map(r => r.id === id ? { ...r, ...changes } : r));
}
