// ── Types ──────────────────────────────────────────────────────────────────

export type SampleRow = {
  pos: number;
  id: string;
  name: string;
  type: "CC" | "QC" | "SES" | "SP" | "BLK/BLK" | "LLOQ" | "ULOQ" | "Subject" | "Pooled Plasma" | "Matrix Lot";
  level?: string;
  conc: string | null;
  subject?: string;
  period?: string;
  tp?: string;
  dilution?: string;
};

export type OtherSamplesConfig = {
  ses: boolean; sp: boolean; blkBlk: boolean; lloq: boolean; uloq: boolean;
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
  runName?: string;
  locked?: boolean;
  rows?: SampleRow[];
};

export type MasterSample = {
  id: string; project: string; analyte: string;
  subject: string; period: string; tp: string;
  freezer: string; location: string; ft: number;
};

export type ApsEntry = {
  aps: string; lloq: string; uloq: string; ccLevels: number;
  ccConcs: string[]; qc: { name: string; conc: string }[];
};

// ── NEW: CC Set (prepared batch of CC calibrators in the freezer) ───────────

export type CCSetLevel = {
  tubeId: string;   // e.g. "CC-001-L1"
  level: string;    // "CC1"
  conc: string;     // nominal concentration (number only, e.g. "1.00")
  unit: string;     // "ng/mL"
};

export type CCSet = {
  id: string;       // "CC-001"
  project: string;
  analyte: string;
  apsRef: string;   // e.g. "APS042.02"
  prepDate: string;
  levels: CCSetLevel[];
  status: "active" | "expired" | "depleted";
};

// ── NEW: QC Sample (individual prepared QC batch with ID) ──────────────────

export type QCSample = {
  id: string;       // "HQC-002"
  project: string;
  analyte: string;
  qcType: "HQC" | "MQC" | "LQC" | "LLOQ QC";
  conc: string;     // nominal concentration
  remaining: number;
  prepDate: string;
  status: "available" | "depleted" | "expired";
};

// ── NEW: Other Sample Item (SES, SP, BLK/BLK, Pooled Plasma, Matrix Lot…) ──

export type OtherSampleItem = {
  id: string;
  project: string;
  analyte: string;
  type: "SES" | "SP" | "BLK/BLK" | "LLOQ" | "ULOQ" | "Pooled Plasma" | "Matrix Lot";
  label: string;
  status: "available" | "used" | "depleted";
};

// Used in buildDistributionSheet
export type SelectedQcMap = {
  hqc: string[];
  mqc: string[];
  lqc: string[];
  lloqQc: string[];
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
        { name: "HQC", conc: "150.00" }, { name: "MQC", conc: "50.00" },
        { name: "LQC", conc: "3.00" },   { name: "LLOQ QC", conc: "1.00" },
      ],
    },
    "MET-G": {
      aps: "APS043.01", lloq: "0.50", uloq: "100.00", ccLevels: 8,
      ccConcs: ["0.50","1.00","2.00","5.00","10.00","25.00","50.00","100.00"],
      qc: [
        { name: "HQC", conc: "75.00" }, { name: "MQC", conc: "25.00" },
        { name: "LQC", conc: "1.50" },  { name: "LLOQ QC", conc: "0.50" },
      ],
    },
  },
  "SID-2026-002": {
    "AML": {
      aps: "APS017.03", lloq: "0.10", uloq: "20.00", ccLevels: 8,
      ccConcs: ["0.10","0.20","0.50","1.00","2.00","5.00","10.00","20.00"],
      qc: [
        { name: "HQC", conc: "15.00" }, { name: "MQC", conc: "5.00" },
        { name: "LQC", conc: "0.30" },  { name: "LLOQ QC", conc: "0.10" },
      ],
    },
  },
};

// ── CC Sets (prepared calibrator batches stored in Freezer Room) ──────────

export const CC_SETS: CCSet[] = [
  {
    id: "CC-001", project: "SID-2026-001", analyte: "MET", apsRef: "APS042.02",
    prepDate: "02 May 2026", status: "active",
    levels: [
      { tubeId:"CC-001-L1", level:"CC1", conc:"1.00",   unit:"ng/mL" },
      { tubeId:"CC-001-L2", level:"CC2", conc:"2.00",   unit:"ng/mL" },
      { tubeId:"CC-001-L3", level:"CC3", conc:"5.00",   unit:"ng/mL" },
      { tubeId:"CC-001-L4", level:"CC4", conc:"10.00",  unit:"ng/mL" },
      { tubeId:"CC-001-L5", level:"CC5", conc:"20.00",  unit:"ng/mL" },
      { tubeId:"CC-001-L6", level:"CC6", conc:"50.00",  unit:"ng/mL" },
      { tubeId:"CC-001-L7", level:"CC7", conc:"100.00", unit:"ng/mL" },
      { tubeId:"CC-001-L8", level:"CC8", conc:"200.00", unit:"ng/mL" },
    ],
  },
  {
    id: "CC-002", project: "SID-2026-001", analyte: "MET", apsRef: "APS042.02",
    prepDate: "10 May 2026", status: "active",
    levels: [
      { tubeId:"CC-002-L1", level:"CC1", conc:"1.00",   unit:"ng/mL" },
      { tubeId:"CC-002-L2", level:"CC2", conc:"2.00",   unit:"ng/mL" },
      { tubeId:"CC-002-L3", level:"CC3", conc:"5.00",   unit:"ng/mL" },
      { tubeId:"CC-002-L4", level:"CC4", conc:"10.00",  unit:"ng/mL" },
      { tubeId:"CC-002-L5", level:"CC5", conc:"20.00",  unit:"ng/mL" },
      { tubeId:"CC-002-L6", level:"CC6", conc:"50.00",  unit:"ng/mL" },
      { tubeId:"CC-002-L7", level:"CC7", conc:"100.00", unit:"ng/mL" },
      { tubeId:"CC-002-L8", level:"CC8", conc:"200.00", unit:"ng/mL" },
    ],
  },
  {
    id: "CC-003", project: "SID-2026-001", analyte: "MET-G", apsRef: "APS043.01",
    prepDate: "02 May 2026", status: "active",
    levels: [
      { tubeId:"CC-003-L1", level:"CC1", conc:"0.50",   unit:"ng/mL" },
      { tubeId:"CC-003-L2", level:"CC2", conc:"1.00",   unit:"ng/mL" },
      { tubeId:"CC-003-L3", level:"CC3", conc:"2.00",   unit:"ng/mL" },
      { tubeId:"CC-003-L4", level:"CC4", conc:"5.00",   unit:"ng/mL" },
      { tubeId:"CC-003-L5", level:"CC5", conc:"10.00",  unit:"ng/mL" },
      { tubeId:"CC-003-L6", level:"CC6", conc:"25.00",  unit:"ng/mL" },
      { tubeId:"CC-003-L7", level:"CC7", conc:"50.00",  unit:"ng/mL" },
      { tubeId:"CC-003-L8", level:"CC8", conc:"100.00", unit:"ng/mL" },
    ],
  },
  {
    id: "CC-004", project: "SID-2026-002", analyte: "AML", apsRef: "APS017.03",
    prepDate: "05 May 2026", status: "active",
    levels: [
      { tubeId:"CC-004-L1", level:"CC1", conc:"0.10",  unit:"ng/mL" },
      { tubeId:"CC-004-L2", level:"CC2", conc:"0.20",  unit:"ng/mL" },
      { tubeId:"CC-004-L3", level:"CC3", conc:"0.50",  unit:"ng/mL" },
      { tubeId:"CC-004-L4", level:"CC4", conc:"1.00",  unit:"ng/mL" },
      { tubeId:"CC-004-L5", level:"CC5", conc:"2.00",  unit:"ng/mL" },
      { tubeId:"CC-004-L6", level:"CC6", conc:"5.00",  unit:"ng/mL" },
      { tubeId:"CC-004-L7", level:"CC7", conc:"10.00", unit:"ng/mL" },
      { tubeId:"CC-004-L8", level:"CC8", conc:"20.00", unit:"ng/mL" },
    ],
  },
  {
    id: "CC-005", project: "SID-2026-002", analyte: "AML", apsRef: "APS017.03",
    prepDate: "14 May 2026", status: "depleted",
    levels: [
      { tubeId:"CC-005-L1", level:"CC1", conc:"0.10",  unit:"ng/mL" },
      { tubeId:"CC-005-L2", level:"CC2", conc:"0.20",  unit:"ng/mL" },
      { tubeId:"CC-005-L3", level:"CC3", conc:"0.50",  unit:"ng/mL" },
      { tubeId:"CC-005-L4", level:"CC4", conc:"1.00",  unit:"ng/mL" },
      { tubeId:"CC-005-L5", level:"CC5", conc:"2.00",  unit:"ng/mL" },
      { tubeId:"CC-005-L6", level:"CC6", conc:"5.00",  unit:"ng/mL" },
      { tubeId:"CC-005-L7", level:"CC7", conc:"10.00", unit:"ng/mL" },
      { tubeId:"CC-005-L8", level:"CC8", conc:"20.00", unit:"ng/mL" },
    ],
  },
];

// ── QC Samples (prepared QC batches with IDs; fast/fasted scenario shown) ─

export const QC_SAMPLES: QCSample[] = [
  // SID-2026-001 / MET — HQC (HQC-001 used up in first study period)
  { id:"HQC-001", project:"SID-2026-001", analyte:"MET", qcType:"HQC",     conc:"150.00", remaining:0,  prepDate:"01 Apr 2026", status:"depleted"  },
  { id:"HQC-002", project:"SID-2026-001", analyte:"MET", qcType:"HQC",     conc:"150.00", remaining:12, prepDate:"01 May 2026", status:"available" },
  { id:"HQC-003", project:"SID-2026-001", analyte:"MET", qcType:"HQC",     conc:"150.00", remaining:24, prepDate:"10 May 2026", status:"available" },
  // MQC
  { id:"MQC-001", project:"SID-2026-001", analyte:"MET", qcType:"MQC",     conc:"50.00",  remaining:0,  prepDate:"01 Apr 2026", status:"depleted"  },
  { id:"MQC-002", project:"SID-2026-001", analyte:"MET", qcType:"MQC",     conc:"50.00",  remaining:8,  prepDate:"01 May 2026", status:"available" },
  { id:"MQC-003", project:"SID-2026-001", analyte:"MET", qcType:"MQC",     conc:"50.00",  remaining:20, prepDate:"10 May 2026", status:"available" },
  // LQC
  { id:"LQC-001", project:"SID-2026-001", analyte:"MET", qcType:"LQC",     conc:"3.00",   remaining:0,  prepDate:"01 Apr 2026", status:"depleted"  },
  { id:"LQC-002", project:"SID-2026-001", analyte:"MET", qcType:"LQC",     conc:"3.00",   remaining:6,  prepDate:"01 May 2026", status:"available" },
  { id:"LQC-003", project:"SID-2026-001", analyte:"MET", qcType:"LQC",     conc:"3.00",   remaining:18, prepDate:"10 May 2026", status:"available" },
  // LLOQ QC
  { id:"LLOQQC-001", project:"SID-2026-001", analyte:"MET", qcType:"LLOQ QC", conc:"1.00", remaining:0,  prepDate:"01 Apr 2026", status:"depleted"  },
  { id:"LLOQQC-002", project:"SID-2026-001", analyte:"MET", qcType:"LLOQ QC", conc:"1.00", remaining:5,  prepDate:"01 May 2026", status:"available" },
  { id:"LLOQQC-003", project:"SID-2026-001", analyte:"MET", qcType:"LLOQ QC", conc:"1.00", remaining:15, prepDate:"10 May 2026", status:"available" },
  // SID-2026-001 / MET-G
  { id:"HQC-G-001", project:"SID-2026-001", analyte:"MET-G", qcType:"HQC",     conc:"75.00", remaining:10, prepDate:"02 May 2026", status:"available" },
  { id:"MQC-G-001", project:"SID-2026-001", analyte:"MET-G", qcType:"MQC",     conc:"25.00", remaining:10, prepDate:"02 May 2026", status:"available" },
  { id:"LQC-G-001", project:"SID-2026-001", analyte:"MET-G", qcType:"LQC",     conc:"1.50",  remaining:10, prepDate:"02 May 2026", status:"available" },
  { id:"LLOQQC-G-001", project:"SID-2026-001", analyte:"MET-G", qcType:"LLOQ QC", conc:"0.50", remaining:8, prepDate:"02 May 2026", status:"available" },
  // SID-2026-002 / AML
  { id:"HQC-A-001", project:"SID-2026-002", analyte:"AML", qcType:"HQC",     conc:"15.00", remaining:16, prepDate:"05 May 2026", status:"available" },
  { id:"HQC-A-002", project:"SID-2026-002", analyte:"AML", qcType:"HQC",     conc:"15.00", remaining:20, prepDate:"14 May 2026", status:"available" },
  { id:"MQC-A-001", project:"SID-2026-002", analyte:"AML", qcType:"MQC",     conc:"5.00",  remaining:16, prepDate:"05 May 2026", status:"available" },
  { id:"LQC-A-001", project:"SID-2026-002", analyte:"AML", qcType:"LQC",     conc:"0.30",  remaining:12, prepDate:"05 May 2026", status:"available" },
  { id:"LLOQQC-A-001", project:"SID-2026-002", analyte:"AML", qcType:"LLOQ QC", conc:"0.10", remaining:10, prepDate:"05 May 2026", status:"available" },
];

// ── Other Sample Items (SES, SP, BLK/BLK, LLOQ, ULOQ, Pooled Plasma, Matrix Lot) ──

export const OTHER_SAMPLE_ITEMS: OtherSampleItem[] = [
  // SID-2026-001 / MET
  { id:"SES-001", project:"SID-2026-001", analyte:"MET", type:"SES",         label:"SES-001",                    status:"available" },
  { id:"SES-002", project:"SID-2026-001", analyte:"MET", type:"SES",         label:"SES-002",                    status:"available" },
  { id:"SES-003", project:"SID-2026-001", analyte:"MET", type:"SES",         label:"SES-003",                    status:"available" },
  { id:"SP-001",  project:"SID-2026-001", analyte:"MET", type:"SP",          label:"SP-001",                     status:"available" },
  { id:"SP-002",  project:"SID-2026-001", analyte:"MET", type:"SP",          label:"SP-002",                     status:"available" },
  { id:"BLK-001", project:"SID-2026-001", analyte:"MET", type:"BLK/BLK",     label:"BLK/BLK-001",               status:"available" },
  { id:"BLK-002", project:"SID-2026-001", analyte:"MET", type:"BLK/BLK",     label:"BLK/BLK-002",               status:"available" },
  { id:"LLOQS-001",project:"SID-2026-001",analyte:"MET", type:"LLOQ",        label:"LLOQ-001",                   status:"available" },
  { id:"LLOQS-002",project:"SID-2026-001",analyte:"MET", type:"LLOQ",        label:"LLOQ-002",                   status:"available" },
  { id:"ULOQS-001",project:"SID-2026-001",analyte:"MET", type:"ULOQ",        label:"ULOQ-001",                   status:"available" },
  { id:"PP-001",  project:"SID-2026-001", analyte:"MET", type:"Pooled Plasma",label:"PP-001 (Lot PP-2026-A)",    status:"available" },
  { id:"PP-002",  project:"SID-2026-001", analyte:"MET", type:"Pooled Plasma",label:"PP-002 (Lot PP-2026-B)",    status:"available" },
  { id:"ML-001",  project:"SID-2026-001", analyte:"MET", type:"Matrix Lot",   label:"ML-001 (Lot BIO-2026-03)",  status:"available" },
  { id:"ML-002",  project:"SID-2026-001", analyte:"MET", type:"Matrix Lot",   label:"ML-002 (Lot BIO-2026-04)",  status:"available" },
  // SID-2026-001 / MET-G
  { id:"SES-G-001",project:"SID-2026-001",analyte:"MET-G",type:"SES",        label:"SES-G-001",                  status:"available" },
  { id:"BLK-G-001",project:"SID-2026-001",analyte:"MET-G",type:"BLK/BLK",   label:"BLK/BLK-G-001",             status:"available" },
  { id:"PP-G-001", project:"SID-2026-001",analyte:"MET-G",type:"Pooled Plasma",label:"PP-G-001 (Lot PP-2026-C)",status:"available" },
  // SID-2026-002 / AML
  { id:"SES-A-001",project:"SID-2026-002",analyte:"AML",  type:"SES",        label:"SES-A-001",                  status:"available" },
  { id:"SES-A-002",project:"SID-2026-002",analyte:"AML",  type:"SES",        label:"SES-A-002",                  status:"available" },
  { id:"BLK-A-001",project:"SID-2026-002",analyte:"AML",  type:"BLK/BLK",   label:"BLK/BLK-A-001",             status:"available" },
  { id:"PP-A-001", project:"SID-2026-002",analyte:"AML",  type:"Pooled Plasma",label:"PP-A-001 (Lot PP-2026-D)",status:"available" },
  { id:"ML-A-001", project:"SID-2026-002",analyte:"AML",  type:"Matrix Lot",  label:"ML-A-001 (Lot BIO-2026-05)",status:"available"},
];

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
    approvedBy:"J. Chen", approvedAt:"17 Apr 2026", retrievalReqId:"RET-2026-003",
  },
  {
    id:"DS-2026-001-005", project:"SID-2026-001", projectName:"Metformin BE Study",
    analyte:"MET", aps:"APS042.02", runNo:5,
    ccLevels:8, qcSamples:4, subjectSamples:6, totalPositions:21,
    status:"retrieved", createdBy:"R. Patel", createdAt:"16 Apr 2026",
    approvedBy:"J. Chen", approvedAt:"16 Apr 2026", retrievalReqId:"RET-2026-002",
  },
  {
    id:"DS-2026-002-001", project:"SID-2026-002", projectName:"Amlodipine BE Study",
    analyte:"AML", aps:"APS017.03", runNo:1,
    ccLevels:8, qcSamples:4, subjectSamples:4, totalPositions:19,
    status:"approved", createdBy:"R. Patel", createdAt:"17 Apr 2026",
    approvedBy:"J. Chen", approvedAt:"17 Apr 2026",
  },
];

// ── New Distribution Sheet builder (uses CC set IDs + QC sample IDs) ───────

export function buildDistributionSheet(
  ccSet: CCSet,
  selectedCcTubeIds: Set<string>,
  qcIds: SelectedQcMap,
  subjects: MasterSample[],
  selectedOtherItemIds: string[],
  allQcSamples: QCSample[],
  allOtherItems: OtherSampleItem[],
  qcSets: number,
): SampleRow[] {
  const rows: SampleRow[] = [];
  let pos = 1;

  // 1. CC levels from the selected CC set
  for (const lvl of ccSet.levels) {
    if (!selectedCcTubeIds.has(lvl.tubeId)) continue;
    rows.push({
      pos: pos++, id: lvl.tubeId,
      name: `${lvl.level} (${ccSet.id})`,
      type: "CC", level: lvl.level,
      conc: `${lvl.conc} ${lvl.unit}`,
    });
  }

  // 2. QC blocks interspersed with subjects
  const sets   = Math.max(1, qcSets);
  const perSet = Math.max(1, Math.ceil(subjects.length / sets));

  for (let set = 0; set < sets; set++) {
    const chunk = subjects.slice(set * perSet, (set + 1) * perSet);

    const hqcId    = qcIds.hqc[set % Math.max(1, qcIds.hqc.length)]    ?? null;
    const lloqQcId = qcIds.lloqQc[set % Math.max(1, qcIds.lloqQc.length)] ?? null;
    const lqcId    = qcIds.lqc[set % Math.max(1, qcIds.lqc.length)]    ?? null;

    const hqcSmp    = hqcId    ? allQcSamples.find(q => q.id === hqcId)    : null;
    const lloqQcSmp = lloqQcId ? allQcSamples.find(q => q.id === lloqQcId) : null;
    const lqcSmp    = lqcId    ? allQcSamples.find(q => q.id === lqcId)    : null;

    if (hqcSmp)    rows.push({ pos: pos++, id: hqcId!,    name: `HQC (${hqcId})`,     type:"QC", level:"HQC",     conc:`${hqcSmp.conc} ng/mL` });
    if (lloqQcSmp) rows.push({ pos: pos++, id: lloqQcId!, name: `LLOQ QC (${lloqQcId})`, type:"QC", level:"LLOQ QC", conc:`${lloqQcSmp.conc} ng/mL` });

    chunk.forEach((s, i) => {
      rows.push({ pos: pos++, id: s.id, name: `Subject ${s.subject} / ${s.period} / ${s.tp}`, type:"Subject", subject: s.subject, period: s.period, tp: s.tp, conc: null, dilution: "1" });

      const mqcIdx = Math.floor(i / 6);
      const mqcId  = qcIds.mqc[mqcIdx % Math.max(1, qcIds.mqc.length)] ?? null;
      const mqcSmp = mqcId ? allQcSamples.find(q => q.id === mqcId) : null;
      if (mqcSmp && (i + 1) % 6 === 0 && i < chunk.length - 1) {
        rows.push({ pos: pos++, id: mqcId!, name: `MQC (${mqcId})`, type:"QC", level:"MQC", conc:`${mqcSmp.conc} ng/mL` });
      }
    });

    if (lqcSmp) rows.push({ pos: pos++, id: lqcId!, name: `LQC (${lqcId})`, type:"QC", level:"LQC", conc:`${lqcSmp.conc} ng/mL` });
  }

  // 3. Other samples (in selection order)
  for (const itemId of selectedOtherItemIds) {
    const item = allOtherItems.find(o => o.id === itemId);
    if (!item) continue;
    rows.push({ pos: pos++, id: itemId, name: item.label, type: item.type as SampleRow["type"], conc: null });
  }

  return rows;
}

// ── Legacy builder (kept for backward compat with existing records) ────────

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

  const hqc    = apsData.qc.find(q => q.name === "HQC");
  const mqc    = apsData.qc.find(q => q.name === "MQC");
  const lqc    = apsData.qc.find(q => q.name === "LQC");
  const lloqQc = apsData.qc.find(q => q.name === "LLOQ QC");
  const sets   = Math.max(1, qcSets);
  const perSet = Math.max(1, Math.ceil(selectedSamples.length / sets));

  for (let set = 0; set < sets; set++) {
    const chunk  = selectedSamples.slice(set * perSet, (set + 1) * perSet);
    const suffix = String(set + 1).padStart(3, "0");
    if (hqc)    rows.push({ pos: pos++, id:`QC-HQC-${suffix}`,    name:`HQC (set ${set+1})`,     type:"QC", level:"HQC",     conc:`${hqc.conc} ng/mL` });
    if (lloqQc) rows.push({ pos: pos++, id:`QC-LLOQQC-${suffix}`, name:`LLOQ QC (set ${set+1})`, type:"QC", level:"LLOQ QC", conc:`${lloqQc.conc} ng/mL` });
    chunk.forEach((s, i) => {
      rows.push({ pos: pos++, id:s.id, name:`Subject ${s.subject} / ${s.period} / ${s.tp}`, type:"Subject", subject:s.subject, period:s.period, tp:s.tp, conc:null, dilution:"1" });
      if (mqc && (i+1) % 6 === 0 && i < chunk.length-1)
        rows.push({ pos: pos++, id:`QC-MQC-${suffix}-${i+1}`, name:`MQC (set ${set+1}, interspersed)`, type:"QC", level:"MQC", conc:`${mqc.conc} ng/mL` });
    });
    if (lqc) rows.push({ pos: pos++, id:`QC-LQC-${suffix}`, name:`LQC (set ${set+1})`, type:"QC", level:"LQC", conc:`${lqc.conc} ng/mL` });
  }

  const OTHER_DEFS: { key: keyof OtherSamplesConfig; type: SampleRow["type"]; name: string }[] = [
    { key:"ses", type:"SES", name:"SES Sample" }, { key:"sp", type:"SP", name:"SP Sample" },
    { key:"blkBlk", type:"BLK/BLK", name:"Double Blank (BLK/BLK)" },
    { key:"lloq", type:"LLOQ", name:"LLOQ Sample" }, { key:"uloq", type:"ULOQ", name:"ULOQ Sample" },
  ];
  OTHER_DEFS.forEach(d => { if (otherSamples[d.key]) rows.push({ pos: pos++, id:`${d.type.replace("/","-")}-001`, name:d.name, type:d.type, conc:null }); });

  return rows;
}

// ── Helpers ───────────────────────────────────────────────────────────────

export function nextRunNo(records: DSRecord[], project: string, analyte: string): number {
  const ex = records.filter(d => d.project === project && d.analyte === analyte);
  return ex.length === 0 ? 1 : Math.max(...ex.map(d => d.runNo)) + 1;
}

export function nextDsId(records: DSRecord[], project: string, analyte: string, runNo: number): string {
  return `DS-${new Date().getFullYear()}-${project.slice(-3)}-${String(runNo).padStart(3,"0")}`;
}

// ── Ledger persistence (localStorage) ────────────────────────────────────

const KEY = "lims-distribution-sheets";

export function loadDsRecords(): DSRecord[] {
  if (typeof window === "undefined") return INIT_DS;
  const raw = localStorage.getItem(KEY);
  if (!raw) { localStorage.setItem(KEY, JSON.stringify(INIT_DS)); return INIT_DS; }
  try { return JSON.parse(raw) as DSRecord[]; } catch { return INIT_DS; }
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
