// ── Types ──────────────────────────────────────────────────────────────────

export type SampleRow = {
  pos: number;
  id: string;
  name: string;
  type: "CC" | "QC" | "BLK" | "SES" | "SP" | "BLK/BLK" | "LLOQ" | "ULOQ" | "Subject" | "Pooled Plasma" | "Matrix Lot";
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
  tubeId: string;   // e.g. "SET-1-ST-1"
  level: string;    // "ST-1" — ST-1 is the highest standard, last is the lowest
  conc: string;     // nominal concentration (number only, e.g. "1.00")
  unit: string;     // "ng/mL"
};

// Every CC set carries its own blank + double-blank replicates (BLK-1/BLK-2,
// BLK/BLK-1/BLK/BLK-2) alongside the standards — not a project-wide "other sample".
export type CCSetBlank = {
  tubeId: string;   // e.g. "SET-1-BLK-1"
  label: string;    // "BLK-1" or "BLK/BLK-1"
  kind: "BLK" | "BLK/BLK";
};

export type CCSet = {
  id: string;       // "SET-1" — numbered per project + analyte, based on how many
                     // bulk-spiked CC sets are stored for that project/analyte
  project: string;
  analyte: string;
  apsRef: string;   // e.g. "APS042.02"
  prepDate: string;
  levels: CCSetLevel[];
  blanks: CCSetBlank[];
};

// "SET-1" is only unique within a project+analyte (e.g. MET and MET-G both have
// their own SET-1) — use this composite key wherever a CC set must be looked up.
export function ccSetKey(s: Pick<CCSet, "project" | "analyte" | "id">): string {
  return `${s.project}::${s.analyte}::${s.id}`;
}

// ── NEW: QC Sample (individual prepared QC batch with ID) ──────────────────
// CC and QC samples are consumables — retrieved, used in the run, then discarded.
// There is no "depleted" or remaining-count concept; each ID is simply available or not.

export type QCSample = {
  id: string;       // "HQC-002"
  project: string;
  analyte: string;
  qcType: "HQC" | "MQC" | "LQC" | "LLOQ QC";
  conc: string;     // nominal concentration
  prepDate: string;
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

// Builds the standard ladder for a CC set, listed ST-1 (highest nominal conc)
// through ST-N (lowest) — pass concentrations lowest-to-highest, they're reversed here.
function buildStandards(setId: string, concsAscending: string[], unit = "ng/mL"): CCSetLevel[] {
  return [...concsAscending].reverse().map((conc, idx) => {
    const stNo = idx + 1; // idx 0 = highest conc = ST-1
    return { tubeId: `${setId}-ST-${stNo}`, level: `ST-${stNo}`, conc, unit };
  });
}

// Every CC set carries 2 blank replicates and 2 double-blank replicates.
function buildBlanks(setId: string): CCSetBlank[] {
  return [
    { tubeId: `${setId}-BLK-1`,     label: "BLK-1",     kind: "BLK"     },
    { tubeId: `${setId}-BLK-2`,     label: "BLK-2",     kind: "BLK"     },
    { tubeId: `${setId}-BLKBLK-1`,  label: "BLK/BLK-1",  kind: "BLK/BLK" },
    { tubeId: `${setId}-BLKBLK-2`,  label: "BLK/BLK-2",  kind: "BLK/BLK" },
  ];
}

export const CC_SETS: CCSet[] = [
  {
    id: "SET-1", project: "SID-2026-001", analyte: "MET", apsRef: "APS042.02",
    prepDate: "02 May 2026",
    levels: buildStandards("SET-1", ["1.00","2.00","5.00","10.00","20.00","50.00","100.00","200.00"]),
    blanks: buildBlanks("SET-1"),
  },
  {
    id: "SET-2", project: "SID-2026-001", analyte: "MET", apsRef: "APS042.02",
    prepDate: "10 May 2026",
    levels: buildStandards("SET-2", ["1.00","2.00","5.00","10.00","20.00","50.00","100.00","200.00"]),
    blanks: buildBlanks("SET-2"),
  },
  {
    id: "SET-1", project: "SID-2026-001", analyte: "MET-G", apsRef: "APS043.01",
    prepDate: "02 May 2026",
    levels: buildStandards("SET-1", ["0.50","1.00","2.00","5.00","10.00","25.00","50.00","100.00"]),
    blanks: buildBlanks("SET-1"),
  },
  {
    id: "SET-1", project: "SID-2026-002", analyte: "AML", apsRef: "APS017.03",
    prepDate: "05 May 2026",
    levels: buildStandards("SET-1", ["0.10","0.20","0.50","1.00","2.00","5.00","10.00","20.00"]),
    blanks: buildBlanks("SET-1"),
  },
  {
    id: "SET-2", project: "SID-2026-002", analyte: "AML", apsRef: "APS017.03",
    prepDate: "14 May 2026",
    levels: buildStandards("SET-2", ["0.10","0.20","0.50","1.00","2.00","5.00","10.00","20.00"]),
    blanks: buildBlanks("SET-2"),
  },
];

// ── QC Samples (prepared QC batches with IDs; fast/fasted scenario shown) ─
// CC and QC are consumables — retrieved, used, discarded. No remaining count.

export const QC_SAMPLES: QCSample[] = [
  // SID-2026-001 / MET — multiple HQC batches support fast/fasted two-study scenario
  { id:"HQC-001", project:"SID-2026-001", analyte:"MET", qcType:"HQC",     conc:"150.00", prepDate:"01 Apr 2026" },
  { id:"HQC-002", project:"SID-2026-001", analyte:"MET", qcType:"HQC",     conc:"150.00", prepDate:"01 May 2026" },
  { id:"HQC-003", project:"SID-2026-001", analyte:"MET", qcType:"HQC",     conc:"150.00", prepDate:"10 May 2026" },
  { id:"MQC-001", project:"SID-2026-001", analyte:"MET", qcType:"MQC",     conc:"50.00",  prepDate:"01 Apr 2026" },
  { id:"MQC-002", project:"SID-2026-001", analyte:"MET", qcType:"MQC",     conc:"50.00",  prepDate:"01 May 2026" },
  { id:"MQC-003", project:"SID-2026-001", analyte:"MET", qcType:"MQC",     conc:"50.00",  prepDate:"10 May 2026" },
  { id:"LQC-001", project:"SID-2026-001", analyte:"MET", qcType:"LQC",     conc:"3.00",   prepDate:"01 Apr 2026" },
  { id:"LQC-002", project:"SID-2026-001", analyte:"MET", qcType:"LQC",     conc:"3.00",   prepDate:"01 May 2026" },
  { id:"LQC-003", project:"SID-2026-001", analyte:"MET", qcType:"LQC",     conc:"3.00",   prepDate:"10 May 2026" },
  { id:"LLOQQC-001", project:"SID-2026-001", analyte:"MET", qcType:"LLOQ QC", conc:"1.00", prepDate:"01 Apr 2026" },
  { id:"LLOQQC-002", project:"SID-2026-001", analyte:"MET", qcType:"LLOQ QC", conc:"1.00", prepDate:"01 May 2026" },
  { id:"LLOQQC-003", project:"SID-2026-001", analyte:"MET", qcType:"LLOQ QC", conc:"1.00", prepDate:"10 May 2026" },
  // SID-2026-001 / MET-G
  { id:"HQC-G-001",    project:"SID-2026-001", analyte:"MET-G", qcType:"HQC",     conc:"75.00", prepDate:"02 May 2026" },
  { id:"MQC-G-001",    project:"SID-2026-001", analyte:"MET-G", qcType:"MQC",     conc:"25.00", prepDate:"02 May 2026" },
  { id:"LQC-G-001",    project:"SID-2026-001", analyte:"MET-G", qcType:"LQC",     conc:"1.50",  prepDate:"02 May 2026" },
  { id:"LLOQQC-G-001", project:"SID-2026-001", analyte:"MET-G", qcType:"LLOQ QC", conc:"0.50",  prepDate:"02 May 2026" },
  // SID-2026-002 / AML
  { id:"HQC-A-001",    project:"SID-2026-002", analyte:"AML", qcType:"HQC",     conc:"15.00", prepDate:"05 May 2026" },
  { id:"HQC-A-002",    project:"SID-2026-002", analyte:"AML", qcType:"HQC",     conc:"15.00", prepDate:"14 May 2026" },
  { id:"MQC-A-001",    project:"SID-2026-002", analyte:"AML", qcType:"MQC",     conc:"5.00",  prepDate:"05 May 2026" },
  { id:"LQC-A-001",    project:"SID-2026-002", analyte:"AML", qcType:"LQC",     conc:"0.30",  prepDate:"05 May 2026" },
  { id:"LLOQQC-A-001", project:"SID-2026-002", analyte:"AML", qcType:"LLOQ QC", conc:"0.10",  prepDate:"05 May 2026" },
];

// ── Other Sample Items (SES, SP, BLK/BLK, LLOQ, ULOQ, Pooled Plasma, Matrix Lot) ──

export const OTHER_SAMPLE_ITEMS: OtherSampleItem[] = [
  // SID-2026-001 / MET
  { id:"SES-001", project:"SID-2026-001", analyte:"MET", type:"SES",         label:"SES-001",                    status:"available" },
  { id:"SES-002", project:"SID-2026-001", analyte:"MET", type:"SES",         label:"SES-002",                    status:"available" },
  { id:"SES-003", project:"SID-2026-001", analyte:"MET", type:"SES",         label:"SES-003",                    status:"available" },
  { id:"SP-001",  project:"SID-2026-001", analyte:"MET", type:"SP",          label:"SP-001",                     status:"available" },
  { id:"SP-002",  project:"SID-2026-001", analyte:"MET", type:"SP",          label:"SP-002",                     status:"available" },
  { id:"LLOQS-001",project:"SID-2026-001",analyte:"MET", type:"LLOQ",        label:"LLOQ-001",                   status:"available" },
  { id:"LLOQS-002",project:"SID-2026-001",analyte:"MET", type:"LLOQ",        label:"LLOQ-002",                   status:"available" },
  { id:"ULOQS-001",project:"SID-2026-001",analyte:"MET", type:"ULOQ",        label:"ULOQ-001",                   status:"available" },
  { id:"PP-001",  project:"SID-2026-001", analyte:"MET", type:"Pooled Plasma",label:"PP-001 (Lot PP-2026-A)",    status:"available" },
  { id:"PP-002",  project:"SID-2026-001", analyte:"MET", type:"Pooled Plasma",label:"PP-002 (Lot PP-2026-B)",    status:"available" },
  { id:"ML-001",  project:"SID-2026-001", analyte:"MET", type:"Matrix Lot",   label:"ML-001 (Lot BIO-2026-03)",  status:"available" },
  { id:"ML-002",  project:"SID-2026-001", analyte:"MET", type:"Matrix Lot",   label:"ML-002 (Lot BIO-2026-04)",  status:"available" },
  // SID-2026-001 / MET-G
  { id:"SES-G-001",project:"SID-2026-001",analyte:"MET-G",type:"SES",        label:"SES-G-001",                  status:"available" },
  { id:"PP-G-001", project:"SID-2026-001",analyte:"MET-G",type:"Pooled Plasma",label:"PP-G-001 (Lot PP-2026-C)",status:"available" },
  // SID-2026-002 / AML
  { id:"SES-A-001",project:"SID-2026-002",analyte:"AML",  type:"SES",        label:"SES-A-001",                  status:"available" },
  { id:"SES-A-002",project:"SID-2026-002",analyte:"AML",  type:"SES",        label:"SES-A-002",                  status:"available" },
  { id:"PP-A-001", project:"SID-2026-002",analyte:"AML",  type:"Pooled Plasma",label:"PP-A-001 (Lot PP-2026-D)",status:"available" },
  { id:"ML-A-001", project:"SID-2026-002",analyte:"AML",  type:"Matrix Lot",  label:"ML-A-001 (Lot BIO-2026-05)",status:"available"},
];

// MASTERSHEET removed — use getApprovedSamples() from ../freezer/mastersheet instead.

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
  selectedBlankTubeIds: Set<string> = new Set(),
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

  // 1b. Blanks / double blanks belonging to this CC set
  for (const blk of ccSet.blanks) {
    if (!selectedBlankTubeIds.has(blk.tubeId)) continue;
    rows.push({
      pos: pos++, id: blk.tubeId,
      name: `${blk.label} (${ccSet.id})`,
      type: blk.kind, conc: null,
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
