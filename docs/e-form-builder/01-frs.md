# Functional Requirements Specification (FRS)

Deliverable **(1)** of the e-Form Builder brief. Each requirement is tagged `FR-<area>.<n>`
and cross-references the as-built implementation (file/symbol) so the spec stays
verifiable against the code. See [`00-overview.md`](./00-overview.md) for the demo vs.
production assumptions referenced below.

## FR-1 — Form Template Library

| ID | Requirement | Implementation |
|---|---|---|
| FR-1.1 | The system shall list all form templates with Form No., Name, Category, Department, Page count, Version, Status and Last Updated date. | `src/app/form-creation/page.tsx` (`COLS`) |
| FR-1.2 | Users shall be able to search templates by name or Form No., and filter by Category, Department and Status. | `page.tsx` (`search`, `filterCat`, `filterDept`, `filterStatus`) |
| FR-1.3 | The system shall show summary counters for Total Forms, Live, In Review and Draft templates. | `page.tsx` stats row |
| FR-1.4 | Users shall be able to create a new blank template (`/form-creation/builder/new`), open an existing one in the Builder, duplicate a template (resets to `draft` v1.0 with a `(Copy)` name and `-COPY` Form No.), or delete a template after confirmation. | `handleDuplicate`, `handleDelete`, delete confirmation `Modal` |
| FR-1.5 | Categories shall include Worksheet, Log Sheet, Checklist, Batch Record, SOP, Protocol, Method, Method Validation, General; Departments shall include Clinical, Bioanalytical, Freezer Room, General. | `formUtils.ts` (`CATEGORIES`, `DEPARTMENTS`) |
| FR-1.6 | Quick links shall provide one-click navigation to the Dashboard, Issued Instances, Audit Trail and "New from Document" pages. | `page.tsx` quick-links row |

## FR-2 — Form Builder (Designer)

| ID | Requirement | Implementation |
|---|---|---|
| FR-2.1 | The Builder shall provide a three-panel layout: field palette (left), canvas (centre, drag-and-drop ordering), properties panel (right) for the selected field. | `builder/[id]/page.tsx`, `palette.tsx`, `canvas.tsx`, `properties-panel.tsx` |
| FR-2.2 | The palette shall group fields into **Basic**, **Lab Specific**, **Smart Fields**, **Layout** and **Compliance** categories (24 field types total — see FR-3). | `palette.tsx` (`PALETTE`) |
| FR-2.3 | Fields shall be added via drag-and-drop from the palette onto the canvas, and reordered within/between pages via drag-and-drop, using `@dnd-kit`. | `page.tsx` `DndContext`, `canvas.tsx` |
| FR-2.4 | A template shall support multiple pages; pages can be added, renamed inline, reordered and deleted (the last remaining page cannot be deleted). | `PageTab`, page-management handlers in `page.tsx` |
| FR-2.5 | Selecting a field shall open its type-specific properties (label, required flag, placeholder/help text, and type-specific settings — options, target/tolerance, formula, columns, steps, master binding, instrument type, etc.). | `properties-panel.tsx` |
| FR-2.6 | The Builder shall provide a live **Preview** mode that renders the form exactly as `FieldRenderer` would in execution, including formula evaluation, weigh/pH outcome badges, and signature placeholders, for design-time QA. | `preview-modal.tsx` (built on `shared/FieldRenderer.tsx`) |
| FR-2.7 | The Builder top bar shall show the form name, Form No. and current lifecycle status badge, page/version counts, and provide **Page Setup**, **Preview**, **Save Draft**, and the status-appropriate lifecycle action button(s) (FR-6). | `TopBar` in `page.tsx` |
| FR-2.8 | Form metadata (name, Form No., category, department, description) shall be editable via a dedicated modal. | `meta-modal.tsx` |

## FR-3 — Field Types

The palette shall provide the following 24 field types, grouped as shown
(`palette.tsx`, `types.ts: FieldType`):

| Group | Field types |
|---|---|
| **Basic** | `text`, `number`, `date`, `datetime`, `dropdown`, `radio`, `checkbox`, `textarea` |
| **Lab Specific** | `weigh-slip`, `ph-slip`, `calculation`, `barcode` |
| **Smart Fields** | `sample-id`, `project-id`, `instrument`, `instrument-capture`, `user-field`, `attachment`, `qrcode`, `dynamic-table` |
| **Layout** | `section-header`, `instruction`, `divider`, `table`, `step-section` |
| **Compliance** | `e-signature`, `timestamp`, `initials` |

Type-specific requirements:

| ID | Requirement |
|---|---|
| FR-3.1 | `weigh-slip` shall capture an actual weight against a configurable `targetWeight`/`weightUnit` and `toleranceMin`/`toleranceMax` (% of target), and display a Pass/Fail/Reweigh outcome badge with configurable labels (`weighResult` in `formUtils.ts`). |
| FR-3.2 | `ph-slip` shall capture a pH value against a configurable `targetPH`/`phMin`/`phMax` and display a Pass/Fail outcome badge (`phResult`). |
| FR-3.3 | `calculation` shall evaluate a formula referencing other fields by `{Label}` placeholders (e.g. `({Actual Weight} / {Target Weight}) * 100`), display the result with configurable decimals and unit, and reject any formula containing characters outside `[0-9+\-*/().\s%]` (`evalFormula`). |
| FR-3.4 | `table` shall render a fixed-row data table from configurable columns (`text`/`number`/`dropdown`/`subtable`); `dynamic-table` shall additionally support add/remove rows at runtime within `minRows`/`maxRows` bounds when `allowAddRows` is set, and a `subtable` column renders a nested 2-row mini-table per cell. |
| FR-3.5 | `step-section` shall render an ordered list of procedural steps, each with its own instruction text, optional inline fields, an optional attachment, and — when `hasSignDate` is set — an inline e-signature sign-off (role "Analyst", no password). |
| FR-3.6 | `e-signature` shall require a named user, a meaning of signature (from `SIGNATURE_MEANINGS`), an optional reason, and — when `requirePassword` is set — a password confirmation; on confirmation it records a `SignatureRecord` and logs an `instance-signed` audit event (FR-11). |
| FR-3.7 | `sample-id`, `project-id`, `instrument`, `user-field` ("Smart Fields") shall render as a searchable picker over the corresponding master-data list (`SAMPLE_MASTER`/`PROJECT_MASTER`/`INSTRUMENT_MASTER`/`USER_MASTER`) and, on selection, auto-fill other fields on the form whose label matches a known related attribute (`getMasterAutoFill`). |
| FR-3.8 | `instrument-capture` shall render a "Capture from Instrument" button that records value, unit, instrument ID/name and timestamp from `simulateInstrumentCapture`, plus the operator who triggered it, and logs an `instrument-capture` audit event. |
| FR-3.9 | `attachment` shall accept a file selection (edit mode) and render "Attached: `<filename>`" or "(no attachment)" in print mode. |
| FR-3.10 | `qrcode` and `barcode` shall render placeholder patterns (`QrPattern`/`BarcodePattern`) seeded from a context reference (instance number or `<FormNo> Rev <Version>`), used both inline and in the print footer. |
| FR-3.11 | `section-header`, `instruction`, `divider` shall render as layout-only elements (no value, excluded from required-field validation). |
| FR-3.12 | `timestamp` and `initials` shall capture an auto/manual timestamp and the user's initials respectively, for lightweight compliance annotations distinct from a full e-signature. |

## FR-4 — Conditional Visibility

| ID | Requirement | Implementation |
|---|---|---|
| FR-4.1 | Any field may carry an optional `visibilityRule: { fieldId, operator, value? }` referencing another field on the same template. | `types.ts: VisibilityRule`, `properties-panel.tsx: VisibilityRuleEditor` |
| FR-4.2 | Supported operators: `equals`, `not-equals`, `contains`, `gt`, `lt`, `is-checked`, `is-empty`, `not-empty`. | `formUtils.ts: evaluateVisibility`, `VIS_OPERATOR_LABEL` |
| FR-4.3 | In Preview, Execution and Print, a field whose visibility rule evaluates to `false` against the current `values` shall not be rendered at all (and shall not be required). | `FieldRenderer` (`evaluateVisibility(f.visibilityRule, values)` short-circuit) |
| FR-4.4 | In the Builder canvas, fields with a visibility rule shall be visually marked (eye-off badge) so authors can see conditional logic at design time. | `canvas.tsx` |

## FR-5 — Page Setup, Header/Footer & Orientation

| ID | Requirement | Implementation |
|---|---|---|
| FR-5.1 | Each template shall have a `header: { companyName, showLogo, watermarkText? }`, a `footer: { showPageNumbers, showQrCode, showAuditRef }`, and an `orientation: 'portrait'|'landscape'`, editable via the Page Setup modal. | `types.ts`, `page-setup-modal.tsx` |
| FR-5.2 | An explicit `watermarkText` shall override the automatic status-based watermark on print output. | `print/[id]/page.tsx: getWatermark` |
| FR-5.3 | Page Setup shall display the full **Revision History** table (Version, Date, Author, Change Description, Change Control Ref). | `page-setup-modal.tsx` (`revCols`) |
| FR-5.4 | Page Setup shall allow creating a **New Version**: the author enters a suggested next version (default: minor-version bump via `suggestNextVersion`), a change description, and an optional change-control reference. | `page-setup-modal.tsx` (`newVerOpen`, `onCreateVersion`) |
| FR-5.5 | While a newer version exists in draft, Page Setup shall show a notice instead of allowing another new version to be started. | `page-setup-modal.tsx` (`form.nextVersionId` branch) |

## FR-6 — Lifecycle & Approval Workflow

| ID | Requirement | Implementation |
|---|---|---|
| FR-6.1 | A template shall progress through an 8-stage lifecycle: `draft → under-review → qa-review → approved → effective → live → obsolete → archived`, with a defined `draft`/`qa-review` reject path back to `draft`. | `formUtils.ts: STATUS_FLOW`, `STATUS_LABEL`, `STATUS_STYLE` |
| FR-6.2 | The Form Library and Builder top bar shall present only the valid forward/backward transitions for the template's current status, each labelled with its action verb (Submit for Review, Send to QA, Return to Draft, QA Approve, Reject to Draft, Make Effective, Activate (Go Live), Mark Obsolete, Archive) and a tone (info/success/warning/danger). | `STATUS_FLOW`, `TONE_STYLE`, `TONE_ICON` |
| FR-6.3 | Every status change shall update `updatedAt`, set `effectiveDate` when transitioning to `effective` and `obsoleteDate` when transitioning to `obsolete`, and log a `form-status` audit event recording old → new status label. | `page.tsx: updateStatus` |
| FR-6.4 | Only templates with status `live` may be issued to a project (FR-8). | `page.tsx` (Issue button gated on `row.status === 'live'`) |

## FR-7 — Versioning & Revision History

| ID | Requirement | Implementation |
|---|---|---|
| FR-7.1 | Every template shall carry a `revisionHistory: RevisionEntry[]`; the seed templates demonstrate multi-entry histories including a change-control reference (`CC-2026-014`). | `store.ts: SEED` |
| FR-7.2 | Creating a new version shall append a `RevisionEntry`, link the new draft and the prior version bidirectionally (`previousVersionId`/`nextVersionId`), and log a `form-version` audit event. | `page-setup-modal.tsx`, `formAudit.ts` |
| FR-7.3 | Issued instances shall record the **major version** of the template they were issued from (encoded in the instance number — FR-8.2) and shall **not** change if the template is later revised, preserving "what was actually executed" (`pages`/`header`/`footer`/`orientation` are snapshotted at issuance). | `instances.ts: issueForm` |

## FR-8 — Form Issuance

| ID | Requirement | Implementation |
|---|---|---|
| FR-8.1 | From the Form Library, a `live` template may be **Issued** to a Project selected from `PROJECT_MASTER`, creating a `FormIssuedInstance` and logging a `form-issued` audit event. | `page.tsx: handleIssue`, `instances.ts: issueForm` |
| FR-8.2 | The instance number shall be generated as `<FormNo>-V<MajorVersion, 2-digit>-<Year>-<6-digit sequence>` (e.g. `F-BA-002-V02-2026-000001`), with the per-`(formNo, majorVersion, year)` sequence persisted so numbers are never reused. | `instances.ts: buildInstanceNo`, `nextSequence`, `loadCounters`/`persistCounters` |
| FR-8.3 | On successful issuance, the user shall be shown the generated instance number with a link to Issued Instances. | `page.tsx: handleIssue` (success `message`) |
| FR-8.4 | An issued instance shall snapshot the issuing template's `pages`, `header`, `footer` and `orientation`, plus `formId`, `formNo`, `formName`, `version`, `projectNo`/`projectName`/`studyNo`, `issuedAt`/`issuedBy`, with empty `values`/`signatures` and status `issued`. | `instances.ts: issueForm` |

## FR-9 — Form Execution

| ID | Requirement | Implementation |
|---|---|---|
| FR-9.1 | The Execution screen shall load an instance by ID, render its snapshotted pages via `FieldRenderer` in `edit` mode (or `print` mode read-only once `completed`/`approved`), with page tabs when there is more than one page. | `execute/[instanceId]/page.tsx` |
| FR-9.2 | Instance status shall progress: `issued → in-progress` (on first Save), `in-progress ⇄ under-review` (Submit for Review / Return to In Progress), `under-review → completed` (Approve, sets `completedAt`). Each transition logs an `instance-status` audit event. | `handleSave`, `handleSubmitForReview`, `handleReturnToProgress`, `handleApprove`, `logStatusChange` |
| FR-9.3 | "Submit for Review" shall be blocked while any visible, required field (per FR-4.3) lacks a value — or, for `e-signature` fields, lacks a recorded signature — and shall list the missing fields. | `getMissingRequiredFields`, `NON_VALUE_TYPES` |
| FR-9.4 | The Execution screen shall provide **Print** (opens `/form-creation/print/<formId>?instance=<id>`) and **Audit Trail** (opens `/form-creation/audit?instanceId=<id>`) actions at all times. | header action bar |
| FR-9.5 | `completed`/`approved` instances shall be fully read-only (`mode='print'`), with a banner explaining the instance is finalised. | `isReadOnly` branch |

## FR-10 — Instrument Integration

| ID | Requirement | Implementation |
|---|---|---|
| FR-10.1 | `instrument-capture` fields shall be configured with an `instrumentType` (one of 8 — balance, HPLC, LC-MS/MS, GC, dissolution tester, UV spectrophotometer, pH meter, moisture analyzer) and a `captureUnit`. | `types.ts: InstrumentType`, `palette.tsx: createField` |
| FR-10.2 | "Capture from Instrument" shall select a matching instrument from `INSTRUMENT_MASTER` (falling back to any instrument if none match the type), generate a value (within tolerance if `targetWeight` is set, else a representative random value), and write `value`, `unit`, `instrumentId`/`instrumentName`, and an ISO `timestamp` plus the capturing user as `__operator`. | `formUtils.ts: simulateInstrumentCapture`, `shared/FieldRenderer.tsx: InstrumentCaptureField` |
| FR-10.3 | A "Re-capture" affordance shall allow overwriting a prior capture, each capture logging a new `instrument-capture` audit event. | `execute/[instanceId]/page.tsx: handleCapture` |
| FR-10.4 | Instrument master data shall record an `instrumentId`, `name`, `type`, `location` and `calibrationDue` date, surfaced in the Dashboard's "Accurate" ALCOA+ metric (instruments due for calibration within 30 days). | `masterData.ts: INSTRUMENT_MASTER`, `dashboard/page.tsx` |

## FR-11 — E-Signatures

| ID | Requirement | Implementation |
|---|---|---|
| FR-11.1 | An `e-signature` field, when activated, shall open a confirmation modal capturing: signing user (defaults to `CURRENT_USER`), meaning of signature (`SIGNATURE_MEANINGS`: Performed By, Reviewed By, Approved By, Witnessed By, Verified By, Authorised By), an optional reason, and — if `requirePassword` — a password. | `execute/[instanceId]/page.tsx` sign modal |
| FR-11.2 | On confirmation, a `SignatureRecord { userId, userName, role, meaning, reason, timestamp }` shall be stored against the field's key in the instance's `signatures` map, and an `instance-signed` audit event logged. | `confirmSign`, `formAudit.ts` |
| FR-11.3 | Step-section sign-offs (`hasSignDate: true`) shall use the same `SignatureBlock` with role "Analyst" and no password requirement. | `shared/FieldRenderer.tsx: StepSection` |
| FR-11.4 | The demo password for any `requirePassword` field shall be `"demo"`; an incorrect password shall show an inline hint revealing the demo password. | `execute/[instanceId]/page.tsx: DEMO_PASSWORD` |

## FR-12 — Audit Trail

| ID | Requirement | Implementation |
|---|---|---|
| FR-12.1 | Every status change, version creation, issuance, instance status change, signature, instrument capture and value correction shall be recorded as an immutable `AuditEvent` (7 `AuditCategory` values — see [`07-audit-trail-and-part11.md`](./07-audit-trail-and-part11.md)). | `formAudit.ts: logAuditEvent` |
| FR-12.2 | The Audit Trail page shall show summary counts (Total Events, E-Signatures, Instrument Captures, Lifecycle Changes), and a searchable/filterable (by free text, category, instance, form) immutable table with no edit/delete affordances. | `audit/page.tsx` |
| FR-12.3 | Audit Trail entries shall deep-link to the originating instance (Execution screen) or template (Builder). | `audit/page.tsx: COLS.reference` |
| FR-12.4 | The Dashboard's "Recent Activity" feed shall show the 8 most recent audit events with a link to the full Audit Trail. | `dashboard/page.tsx` |

## FR-13 — Master Data

| ID | Requirement | Implementation |
|---|---|---|
| FR-13.1 | The module shall reference four master-data sets: Projects (`PROJECT_MASTER`), Samples (`SAMPLE_MASTER`), Instruments (`INSTRUMENT_MASTER`), Users (`USER_MASTER`). | `masterData.ts` |
| FR-13.2 | Smart Fields and the Issue-to-Project modal shall read exclusively from these master-data sets (no free text entry for bound values). | `FieldRenderer.tsx: SmartSelect`, `page.tsx: handleIssue` |

## FR-14 — Print / PDF Engine

| ID | Requirement | Implementation |
|---|---|---|
| FR-14.1 | A single generic print engine shall render **any** template or issued instance — header (company/logo, form name, Form No., version, and — for instances — instance no., project/study, status), per-page body via `FieldRenderer(mode='print')`, and footer (page numbers, QR/barcode, audit reference). | `print/[id]/page.tsx`, see [`10-print-engine.md`](./10-print-engine.md) |
| FR-14.2 | The print output shall respect the template/instance's `orientation` via `@page` CSS, and apply a watermark for non-final statuses (`DRAFT`, `OBSOLETE`, `ARCHIVED`, `DRAFT — NOT FINAL`) or an explicit `header.watermarkText`. | `getWatermark` |
| FR-14.3 | If the document has any e-signature or sign-off-capable step, an appended **Signatures & Approvals** page shall list each signature slot (label, role, signer name, meaning, timestamp), showing "— Not signed —" for unsigned slots. | `collectSignatureSlots`, signatures table |
| FR-14.4 | The print page shall provide "Print / Save as PDF" (`window.print()`) and, for instances, a link to that instance's Audit Trail. | print toolbar |

## FR-15 — Document → Draft Conversion ("New from Document")

| ID | Requirement | Implementation |
|---|---|---|
| FR-15.1 | Users shall upload a PDF/Word/image file (drag-and-drop or browse), optionally edit the derived form name (auto-derived from the filename), category, department and description. | `upload/page.tsx` |
| FR-15.2 | "Generate Draft with AI" shall show a 5-step progress simulation (Uploading → Analyzing layout → Detecting fields → Mapping to LIMS data types → Generating draft form), then create a `draft` v1.0 template pre-populated with a category-appropriate starter field set (header, Reference/Batch No., Date, Analyst, category-specific block, e-signature) and a `revisionHistory` entry noting the source document, and route to the Builder for refinement. | `EXTRACTION_STEPS`, `buildStarterFields`, `buildDraftForm` |
| FR-15.3 | A visible notice shall disclose that the uploaded document is not actually parsed in this demo (see [`00-overview.md` §6](./00-overview.md#6-demo-vs-production-assumptions)). | `upload/page.tsx` simulation notice |

## FR-16 — Dashboard & Reporting

| ID | Requirement | Implementation |
|---|---|---|
| FR-16.1 | The Dashboard shall show clickable KPI cards (Draft, Pending Review, Pending QA Approval, Effective/Live, Issued Instances, Obsolete/Archived) that pre-filter the Form Library or open Issued Instances. | `dashboard/page.tsx: KPI_CARDS` |
| FR-16.2 | The Dashboard shall show a full 8-stage lifecycle breakdown with live counts, each clickable. | `dashboard/page.tsx` lifecycle row |
| FR-16.3 | The Dashboard shall show a 9-item ALCOA+/Part 11 "Compliance Snapshot" with metrics computed live from current data (see [`07-audit-trail-and-part11.md`](./07-audit-trail-and-part11.md)). | `ALCOA_ITEMS` |
| FR-16.4 | The Dashboard shall show the 8 most recent audit events. | `recentEvents` |
