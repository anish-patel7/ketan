// ── Types ─────────────────────────────────────────────────────────────────────

export type MasterSheetSampleStatus =
  | "available" | "reserved" | "retrieved" | "excluded" | "missing";

export type MasterSheetStatus =
  | "draft" | "submitted" | "qa-review" | "approved" | "rejected";

export type MasterSheetSample = {
  id: string;
  project: string;
  analyte: string;
  subject: string;
  period: string;
  tp: string;
  clinicId: string;
  freezer: string;
  location: string;
  ft: number;
  status: MasterSheetSampleStatus;
};

export type MasterSheet = {
  id: string;
  project: string;
  projectName: string;
  clinic: string;
  analytes: string[];
  periods: string[];
  timepoints: string[];
  subjects: string[];
  status: MasterSheetStatus;
  createdBy: string;
  createdAt: string;
  submittedAt?: string;
  submittedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  samples: MasterSheetSample[];
};

// ── Project-defined time points (source: Clinical Time Point Mapping module) ──

export const PROJECT_TIMEPOINTS: Record<string, string[]> = {
  "SID-2026-001": ["Pre", "0H", "0.5H", "1H", "2H", "4H", "8H", "12H", "24H"],
  "SID-2026-002": ["Pre", "0H", "1H",   "2H", "4H", "8H", "12H","24H", "48H"],
  "SID-2026-003": ["Pre", "0H", "0.5H", "1H", "2H", "4H", "8H", "12H", "24H", "48H"],
};

export const PROJECT_NAMES: Record<string, string> = {
  "SID-2026-001": "Metformin BE Study",
  "SID-2026-002": "Amlodipine BE Study",
  "SID-2026-003": "Combo BE Study",
};

export const PROJECT_ANALYTES: Record<string, string[]> = {
  "SID-2026-001": ["MET", "MET-G"],
  "SID-2026-002": ["AML"],
  "SID-2026-003": ["ATR"],
};

// ── Sample generator ──────────────────────────────────────────────────────────

type Ov = {
  subject: string; period: string; tp: string; analyte: string;
  status: MasterSheetSampleStatus; ft?: number;
};

export function makeSamples(
  project: string, analyte: string, subjects: string[],
  periods: string[], tps: string[], freezer: string,
  rack: number, boxStart: number, overrides: Ov[],
): MasterSheetSample[] {
  const result: MasterSheetSample[] = [];
  let idx = 0;
  for (const subject of subjects) {
    for (const period of periods) {
      for (const tp of tps) {
        const box = boxStart + Math.floor(idx / 18);
        const pos = (idx % 18) + 1;
        const aCode = analyte.replace(/-/g, "");
        const ov = overrides.find(
          o => o.subject === subject && o.period === period && o.tp === tp && o.analyte === analyte,
        );
        result.push({
          id:       `${project}-${subject}-${period}-${tp}-${aCode}-1`,
          project, analyte, subject, period, tp,
          clinicId: `CL-${project.slice(-3)}-${subject}-${period.replace("P", "")}-${tp}`,
          freezer,
          location: `R${rack}-B${box}-P${String(pos).padStart(2, "0")}`,
          ft:     ov?.ft ?? 0,
          status: ov?.status ?? "available",
        });
        idx++;
      }
    }
  }
  return result;
}

// ── SID-2026-001 (Metformin BE Study — 2 analytes, 6 subjects, 9 time points) ─

const SUBJ_001 = ["007", "008", "009", "010", "011", "012"];
const TPS_001  = ["Pre", "0H", "0.5H", "1H", "2H", "4H", "8H", "12H", "24H"];

const OV_001: Ov[] = [
  // Already retrieved in earlier DS runs
  { subject:"007", period:"P1", tp:"2H",   analyte:"MET",   status:"retrieved" },
  { subject:"007", period:"P1", tp:"4H",   analyte:"MET",   status:"retrieved" },
  { subject:"007", period:"P1", tp:"1H",   analyte:"MET",   status:"available", ft:2 },
  { subject:"008", period:"P1", tp:"2H",   analyte:"MET",   status:"retrieved" },
  { subject:"008", period:"P1", tp:"4H",   analyte:"MET",   status:"retrieved" },
  { subject:"008", period:"P1", tp:"1H",   analyte:"MET",   status:"available", ft:1 },
  { subject:"009", period:"P1", tp:"2H",   analyte:"MET",   status:"retrieved" },
  // Excluded due to protocol deviation
  { subject:"009", period:"P1", tp:"0.5H", analyte:"MET",   status:"excluded"  },
  { subject:"010", period:"P1", tp:"8H",   analyte:"MET",   status:"excluded"  },
  // Not collected / lab error
  { subject:"011", period:"P1", tp:"4H",   analyte:"MET",   status:"missing"   },
  { subject:"012", period:"P1", tp:"24H",  analyte:"MET",   status:"missing"   },
  // MET-G
  { subject:"007", period:"P1", tp:"2H",   analyte:"MET-G", status:"retrieved" },
  { subject:"008", period:"P1", tp:"2H",   analyte:"MET-G", status:"retrieved" },
  { subject:"010", period:"P1", tp:"Pre",  analyte:"MET-G", status:"excluded"  },
  { subject:"011", period:"P1", tp:"24H",  analyte:"MET-G", status:"missing"   },
  { subject:"012", period:"P1", tp:"8H",   analyte:"MET-G", status:"available", ft:2 },
];

const s001MET  = makeSamples("SID-2026-001","MET",  SUBJ_001,["P1"],TPS_001,"FRZ-01",2,1,OV_001);
const s001METG = makeSamples("SID-2026-001","MET-G",SUBJ_001,["P1"],TPS_001,"FRZ-02",1,1,OV_001);

// ── SID-2026-002 (Amlodipine BE Study — 1 analyte, 4 subjects, 9 time points) ─

const SUBJ_002 = ["S01", "S02", "S03", "S04"];
const TPS_002  = ["Pre", "0H", "1H", "2H", "4H", "8H", "12H", "24H", "48H"];

const OV_002: Ov[] = [
  { subject:"S01", period:"P1", tp:"1H",  analyte:"AML", status:"retrieved" },
  { subject:"S01", period:"P1", tp:"2H",  analyte:"AML", status:"retrieved" },
  { subject:"S02", period:"P1", tp:"4H",  analyte:"AML", status:"excluded"  },
  { subject:"S03", period:"P1", tp:"48H", analyte:"AML", status:"missing"   },
];

const s002AML = makeSamples("SID-2026-002","AML",SUBJ_002,["P1"],TPS_002,"FRZ-02",1,5,OV_002);

// ── Master Sheet records ──────────────────────────────────────────────────────

export const INIT_MASTERSHEETS: MasterSheet[] = [
  {
    id: "MS-2026-001",
    project: "SID-2026-001", projectName: "Metformin BE Study",
    clinic: "City Clinical Research Centre",
    analytes: ["MET", "MET-G"], periods: ["P1"],
    timepoints: TPS_001, subjects: SUBJ_001,
    status: "approved",
    createdBy: "A. Liang",  createdAt:   "01 Apr 2026",
    submittedAt: "01 Apr 2026", submittedBy: "A. Liang",
    approvedBy:  "J. Chen",    approvedAt:  "02 Apr 2026",
    samples: [...s001MET, ...s001METG],
  },
  {
    id: "MS-2026-002",
    project: "SID-2026-002", projectName: "Amlodipine BE Study",
    clinic: "Horizon Clinical Site",
    analytes: ["AML"], periods: ["P1"],
    timepoints: TPS_002, subjects: SUBJ_002,
    status: "approved",
    createdBy: "R. Patel",  createdAt:   "05 Apr 2026",
    submittedAt: "05 Apr 2026", submittedBy: "R. Patel",
    approvedBy:  "J. Chen",    approvedAt:  "06 Apr 2026",
    samples: s002AML,
  },
];

// ── localStorage persistence ──────────────────────────────────────────────────

// Bumped to -v2: earlier prototype iterations cached a different sample shape
// under the unversioned key, which made already-open browser sessions read
// stale/incompatible mastersheet data instead of the current seed.
const MS_KEY = "lims-mastersheets-v2";

export function loadMastersheets(): MasterSheet[] {
  if (typeof window === "undefined") return INIT_MASTERSHEETS;
  const raw = localStorage.getItem(MS_KEY);
  if (!raw) { localStorage.setItem(MS_KEY, JSON.stringify(INIT_MASTERSHEETS)); return INIT_MASTERSHEETS; }
  try { return JSON.parse(raw) as MasterSheet[]; } catch { return INIT_MASTERSHEETS; }
}

export function persistMastersheets(sheets: MasterSheet[]): void {
  if (typeof window !== "undefined") localStorage.setItem(MS_KEY, JSON.stringify(sheets));
}

// ── Query helpers ─────────────────────────────────────────────────────────────

export function getApprovedSamples(project: string, analyte: string): MasterSheetSample[] {
  const sheet = loadMastersheets().find(s => s.project === project && s.status === "approved");
  if (!sheet) return [];
  return sheet.samples.filter(s => s.analyte === analyte && s.status === "available");
}

export function getMastersheetForProject(project: string): MasterSheet | undefined {
  return loadMastersheets().find(s => s.project === project && s.status === "approved");
}

export function formatSubjectLabel(subject: string, period: string): string {
  const num = parseInt(subject, 10);
  const subPart = isNaN(num) ? subject : String(num);
  const pPart = period.replace(/^P/, "");
  return `${subPart}.${pPart}`;
}
