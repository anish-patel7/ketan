import type {
  ProjectMasterEntry, SampleMasterEntry, InstrumentMasterEntry, UserMasterEntry,
} from './types';

/* Read-only seeded master data, mirroring the IDs/conventions used elsewhere
   in the LIMS demo (Projects page, User Barcode modal, etc.) */

export const PROJECT_MASTER: ProjectMasterEntry[] = [
  { id: 'sid-2026-001', projectNo: 'PRJ-2026-001', studyNo: 'SID-2026-001', name: 'Metformin BE Study',  sponsor: 'PharmaCo Ltd' },
  { id: 'sid-2026-003', projectNo: 'PRJ-2026-003', studyNo: 'SID-2026-003', name: 'Combo BE Study',       sponsor: 'BioGen Inc'  },
  { id: 'sid-2026-004', projectNo: 'PRJ-2026-004', studyNo: 'SID-2026-004', name: 'Drug X Single Dose',   sponsor: 'NovaMed'     },
  { id: 'sid-2025-012', projectNo: 'PRJ-2025-012', studyNo: 'SID-2025-012', name: 'Amlodipine BE',        sponsor: 'GenPharma'   },
];

export const SAMPLE_MASTER: SampleMasterEntry[] = [
  { id: 's1', sampleId: 'SMP-2026-00101', projectNo: 'PRJ-2026-001', matrix: 'Plasma', status: 'Received'    },
  { id: 's2', sampleId: 'SMP-2026-00102', projectNo: 'PRJ-2026-001', matrix: 'Plasma', status: 'In Analysis' },
  { id: 's3', sampleId: 'SMP-2026-00301', projectNo: 'PRJ-2026-003', matrix: 'Plasma', status: 'Received'    },
  { id: 's4', sampleId: 'SMP-2026-00401', projectNo: 'PRJ-2026-004', matrix: 'Urine',  status: 'Pending'     },
];

export const INSTRUMENT_MASTER: InstrumentMasterEntry[] = [
  { id: 'i1', instrumentId: 'BAL-001',  name: 'Sartorius MSE Analytical Balance',     type: 'balance',           location: 'Weighing Room 1', calibrationDue: '2026-09-15' },
  { id: 'i2', instrumentId: 'BAL-002',  name: 'Mettler Toledo XS205',                 type: 'balance',           location: 'Weighing Room 2', calibrationDue: '2026-08-01' },
  { id: 'i3', instrumentId: 'HPLC-01',  name: 'Agilent 1260 Infinity II',             type: 'hplc',              location: 'HPLC Lab',         calibrationDue: '2026-10-20' },
  { id: 'i4', instrumentId: 'LCMS-01',  name: 'Sciex Triple Quad 6500+',              type: 'lcms',              location: 'LCMS Suite',        calibrationDue: '2026-07-30' },
  { id: 'i5', instrumentId: 'GC-01',    name: 'Agilent 8890 GC System',               type: 'gc',                location: 'GC Lab',            calibrationDue: '2026-11-05' },
  { id: 'i6', instrumentId: 'DISS-01',  name: 'Distek 2500 Dissolution Tester',       type: 'dissolution',       location: 'Dissolution Lab',   calibrationDue: '2026-09-01' },
  { id: 'i7', instrumentId: 'UV-01',    name: 'Shimadzu UV-1900i Spectrophotometer',  type: 'uv',                location: 'QC Lab',            calibrationDue: '2026-08-18' },
  { id: 'i8', instrumentId: 'PH-01',    name: 'Mettler Toledo SevenCompact pH Meter', type: 'ph-meter',          location: 'Sample Prep',       calibrationDue: '2026-07-10' },
  { id: 'i9', instrumentId: 'MOI-01',   name: 'Sartorius MA37 Moisture Analyzer',     type: 'moisture-analyzer', location: 'QC Lab',            calibrationDue: '2026-09-25' },
];

export const USER_MASTER: UserMasterEntry[] = [
  { id: 'u1', userId: 'LIMS-USR-0042', name: 'A. Liang',     role: 'Analyst',              department: 'Bioanalytical'      },
  { id: 'u2', userId: 'LIMS-USR-0017', name: 'Dr. S. Mehta', role: 'Principal Investigator', department: 'Clinical'          },
  { id: 'u3', userId: 'LIMS-USR-0028', name: 'Dr. R. Patel', role: 'Study Director',         department: 'Bioanalytical'     },
  { id: 'u4', userId: 'LIMS-USR-0035', name: 'T. Okafor',    role: 'QA Reviewer',            department: 'Quality Assurance' },
  { id: 'u5', userId: 'LIMS-USR-0050', name: 'M. Chen',      role: 'QA Approver',            department: 'Quality Assurance' },
];

/* The "logged in" demo user, consistent with AppLayout's User Barcode modal */
export const CURRENT_USER = USER_MASTER[0];

export const SIGNATURE_MEANINGS = [
  'Performed By', 'Reviewed By', 'Approved By', 'Witnessed By', 'Verified By', 'Authorised By',
] as const;
