# LIMS App — Project Reference

This file is the single source of truth for "what this project is and what's already built."
Read this instead of asking the user for background — it should be enough to orient on any module.

## 1. What this is

A **Laboratory Information Management System (LIMS)** for a bioanalytical / clinical-trial lab
(think: bioequivalence studies — dosing subjects, collecting plasma samples, running LC-MS/MS
analysis, QC, and regulatory reporting). It is a **frontend prototype**: every module is a
real, working UI built against **mock data + localStorage**, with no backend/API/database yet.
The goal is realistic, production-quality UX that can later be wired to a real backend without
UX changes.

## 2. Stack & conventions

- **Next.js 16** (App Router, Turbopack), **React 19**, **TypeScript**, **Tailwind v4**, **Ant Design v6**, **lucide-react** icons.
- ⚠️ Next.js 16 has breaking changes vs. training data — see `AGENTS.md` / `node_modules/next/dist/docs/` before writing Next-specific code (routing, config, etc.).
- Fonts: **DM Serif Display** (headings/titles, `.section-title`, `font-family: 'DM Serif Display', serif`) + **DM Sans** (body).
- Design tokens live in `src/app/globals.css` as CSS variables (`--accent`, `--bg-card`, `--status-pass`, `--status-warn`, `--status-fail`, `--status-info`, `--text-primary/secondary/muted`, `--border`, etc.). Reuse these instead of hardcoding colors.

### Per-module pattern

Every route under `src/app/<module>/` is largely self-contained:

- `page.tsx` — `"use client"`, wrapped in `<AppLayout>`, content inside `<div className="page-container">`.
- `data.ts` (when present) — TypeScript types for that module's entities + mock seed data + (often) `loadXxx()` / `persistXxx()` localStorage helpers (key pattern: `lims-<module>-<entity>`).
- Page layout convention: header (`section-title` + `section-subtitle`) → KPI stat cards row → filters → Ant `Table` → action `Modal`s (detail view, approve/e-sign, request, etc.).
- Status badges via `<StatusTag status="..."/>` (`src/components/ui/StatusTag.tsx`) — extend `STATUS_MAP` there for new status strings.
- Utilisation bars via `src/components/ui/UtilBar.tsx`.
- Multi-step workflows use a numbered step indicator (see `distribution/new/page.tsx`).
- "E-signature" = a password `Input.Password` field with a printed "meaning" sentence — this is the recurring pattern for approvals/sign-offs everywhere (no real auth yet).

### Navigation map (`src/components/layout/AppLayout.tsx`)

The `MODULES` array is the **canonical route map** — update it whenever a route is added/renamed.

- **Home** (`/`)
- **Clinical** (`/clinical` hub) → Projects `/projects`, Time Point Mapping `/timepoints`, Sample Collection `/collection`, CPMA Processing `/cpma`
- **Bioanalytical** (`/ba-lab` hub) → Project Setup `/ba-setup`, Distribution Sheet `/distribution` (+ `/distribution/new`), Sample Preparation `/sample-prep`, Sample Request `/sample-request`, Sample Extraction `/sample-extraction`, Sample Injection `/sample-injection`, Data Review `/data-review`, LC-MS/MS Auto Review & Repeat `/lcms`, Repeat Analysis `/repeat-analysis`, ISR `/isr`, Analytics `/analytics`, Column Management `/columns`
- **Instruments** (`/instruments` hub)
- **Freezer Room** (`/freezer` hub)
- **Label Creation** (`/label-creation` hub)
- **Form Creation** (`/form-creation` hub) → Dashboard `/form-creation/dashboard`, Issued Instances `/form-creation/instances`, New from Document `/form-creation/upload`, Audit Trail `/form-creation/audit` (+ `/form-creation/builder/[id]`, `/form-creation/execute/[instanceId]`, `/form-creation/print/[id]`)
- **User Management** (`/user-management` hub) → Audit Trail `/audit-trail`

## 3. Module-by-module summary

### Clinical domain
| Module | Route | Purpose |
|---|---|---|
| Clinical hub | `/clinical` | Dashboard: active studies, enrolled subjects, today's collections, CPMA pending, alerts, activity log |
| Projects | `/projects` | Create/manage studies — protocol, sponsor, analytes, design, subjects, periods, timeline |
| Time Point Mapping | `/timepoints` | 3-step wizard: pick approved project → drug/matrix/anticoagulant → define PK collection timepoints |
| Sample Collection | `/collection` | Real-time subject blood draw tracking — barcode/tube scan, time-window deviation detection, haemolysis grading, Vacutainer lookup |
| CPMA Processing | `/cpma` | Centrifuge → aliquot → label → assign freezer location → transfer to Freezer Room |

### Bioanalytical domain (under `/ba-lab`)
| Module | Route | Purpose |
|---|---|---|
| BA hub | `/ba-lab` | Dashboard for the whole analytical workflow, 12 quick-links |
| Project Setup (APS) | `/ba-setup` | Define analytical method per study: LLOQ/ULOQ, 8-level CC, QC (HQC/MQC/LQC/LLOQ-QC), stability params, SOPs |
| Distribution Sheet | `/distribution`, `/distribution/new` | Project-gated ledger of "DS" run-prep sheets; 3-step wizard builds run layout (CC/QC/Subjects/Other samples) from the Mastersheet; approval (e-sign) → retrieval request to Freezer Room. See `data.ts` for `DSRecord`, `buildRunLayout`, `MASTERSHEET`, `PROJECT_APS`. localStorage key `lims-distribution-sheets`. |
| Sample Preparation | `/sample-prep` | CC/QC standard & working-solution batches; expiry warnings |
| Sample Request | `/sample-request` | Request subject samples from Freezer Room for a run; pending/approved/fulfilled/rejected |
| Sample Extraction | `/sample-extraction` | Extraction batches (PP/LLE/SPE), recovery % tracking, warns if recovery outside 80–120% |
| Sample Injection | `/sample-injection` | LC-MS/MS injection worklist/sequence with live progress (CC/QC/Subject breakdown) |
| Data Review | `/data-review` | QA secondary review queue for runs; open QA queries with analyst responses |
| LC-MS/MS Auto Review & Repeat | `/lcms` | Auto-checks CC curve (R², equation), QC acceptance (±15%), flags (ULOQ/IS/carryover); "Accept Run" e-sign modal requires justification for flags |
| Repeat Analysis | `/repeat-analysis` | Tracks re-injection requests; original vs repeat result, ±20% acceptance, discordant → escalate to QA |
| ISR | `/isr` | Incurred Sample Reanalysis (10% of samples), original vs repeat ±20%, failures need CAPA |
| Analytics | `/analytics` | Study performance (run acceptance, QC pass rate, avg CC R²), recent runs, column utilisation, PDF export |
| Column Management | `/columns` | HPLC column inventory — register (CoA/invoice upload), issue/reserve/return, utilisation bar vs max injections |

### Instruments / Freezer / Labels
| Module | Route | Purpose |
|---|---|---|
| Instruments | `/instruments` | Calibration due-dates/status for lab equipment; overdue items blocked from use |
| Freezer Room | `/freezer` | Sample inventory & mastersheet — freezer temp/capacity, sample locations, freeze-thaw cycle warnings, external CRO IDs |
| Label Creation | `/label-creation` | Tabbed (Clinical / BA / Approvals) barcode & label printing, light-sensitivity flag, QA approval of label requests |

### Form Creation (e-Form Builder) — larger sub-feature
Full FRS/SRS/architecture/data-model docs in `docs/e-form-builder/00-overview.md` … `10-print-engine.md`. Client-side prototype of a controlled e-form system designed to map cleanly onto a future REST API + DB (21 CFR Part 11 / ALCOA+ minded).

| Module | Route | Purpose |
|---|---|---|
| Form Library | `/form-creation` | Browse/search/filter templates; status workflow `draft → under-review → qa-review → effective` (→ obsolete/archived); duplicate/delete; "Issue" → creates a numbered instance |
| Dashboard | `/form-creation/dashboard` | KPIs, lifecycle breakdown, ALCOA+ snapshot, recent activity, drafts needing review |
| Builder | `/form-creation/builder/[id]` | Drag-and-drop WYSIWYG designer — `palette.tsx` (24 field types), `canvas.tsx`, `properties-panel.tsx`, `page-setup-modal.tsx`, `meta-modal.tsx`, `preview-modal.tsx` |
| Issued Instances | `/form-creation/instances` | List of issued/executed instances (immutable numbered snapshots), status `draft/in-progress/submitted/approved/rejected` |
| Execute | `/form-creation/execute/[instanceId]` | Fill out an issued instance — field rendering via `shared/FieldRenderer.tsx`, visibility rules, e-signatures with role meaning, save/submit |
| Print | `/form-creation/print/[id]` | Print/PDF-style rendering of a form (uses `.print-*` CSS classes in `globals.css`) |
| Audit Trail | `/form-creation/audit` | Append-only log of all form-domain events (status change, issuance, signature, value capture, correction, approval/rejection) |
| New from Document | `/form-creation/upload` | Simulated OCR: upload a doc → auto-generates a draft template (`buildStarterFields()`) |

Supporting files: `store.ts`, `types.ts`, `formUtils.ts`, `formAudit.ts`, `instances.ts`, `masterData.ts`.
localStorage keys: `lims-form-templates`, `lims-form-instances`, `lims-form-instance-counters`, `lims-form-audit`.

### User Management
| Module | Route | Purpose |
|---|---|---|
| User Management | `/user-management` | User CRUD, role → rights mapping (e.g. BA Analyst → Freezer/Project Setup/Distribution/LC-MS/Columns), department, status |
| Audit Trail | `/audit-trail` | User-account lifecycle audit (created, role/rights changed, login, locked/unlocked, password reset) |

## 4. Status vocab (StatusTag)

Common values already styled in `src/components/ui/StatusTag.tsx`: `available, reserved, issued, returned, retired, expired, pass, fail, warning, pending, approved, verified, rejected, printed, included, excluded, retrieved, in use, discarded`. `draft` is not in the map (falls back to neutral grey) — add it if a module needs a distinct draft style.

## 5. Known prototype gaps (don't "fix" these unless asked — they're intentional for now)

- No backend/API/auth — all data is mock arrays + localStorage, "current user" is hardcoded (e.g. "A. Liang").
- E-signatures are just password text fields, not real auth.
- No real OCR/ML, barcode rendering, PDF generation, or instrument integration — all simulated.
- Each module's mock data is independent; cross-module data (e.g. Distribution Sheet ↔ Freezer Room ↔ Sample Request) is duplicated/mocked rather than shared.

## 6. Quick start

```bash
npm install        # node_modules is not checked in
npm run dev         # http://localhost:3000
npm run build       # production build / typecheck
npx eslint <path>   # lint
```
