# e-Form Builder Module — Overview

## 1. Purpose

The e-Form Builder is a module of the Aurora CRO LIMS that lets laboratory and quality
staff design, version, approve, issue, execute, print and audit electronic forms —
worksheets, log sheets, checklists, batch records, protocols, methods, method
validations and SOPs — without engineering involvement.

It replaces paper forms with controlled, versioned **Form Templates** that are issued
as numbered **Form Instances** against a study/project, filled in by analysts (with
instrument-assisted data capture and e-signatures), and rendered to a print/PDF layout
for filing or inspection.

This document set describes both:

- the **as-built prototype** in `src/app/form-creation/` (a fully client-side,
  `localStorage`-backed implementation that demonstrates the complete user experience), and
- the **production design** that the prototype is modelled on (REST API, relational
  data model, real instrument middleware, SSO, etc.), so the prototype can be
  industrialised without UX changes.

Every place the two diverge is called out explicitly — see [§6](#6-demo-vs-production-assumptions).

## 2. Document Map

| # | File | Covers (deliverable) |
|---|---|---|
| 0 | `00-overview.md` | Scope, glossary, user types, demo vs. production assumptions |
| 1 | `01-frs.md` | **(1)** Functional Requirements Specification |
| 2 | `02-srs.md` | **(2)** Software Requirements Specification (non-functional) |
| 3 | `03-architecture.md` | **(3)** System architecture — logical, component & deployment views |
| 4 | `04-data-model.md` | **(4, 15)** Data model — ERD and table/record specifications |
| 5 | `05-workflows-and-approvals.md` | **(6, 12)** Lifecycle states, approval workflow, issuance numbering |
| 6 | `06-api-specification.md` | **(7)** REST API specification |
| 7 | `07-audit-trail-and-part11.md` | **(8, 9)** Audit trail design & 21 CFR Part 11 / ALCOA+ mapping |
| 8 | `08-screen-designs.md` | **(5, 10, 11)** Screen wireframes — builder, execution, library, dashboard |
| 9 | `09-instrument-integration.md` | **(13)** Instrument integration architecture |
| 10 | `10-print-engine.md` | **(14)** Print / PDF engine architecture |

## 3. Module Map (Routes)

All routes live under `src/app/form-creation/` and are rendered inside the shared
`AppLayout` sidebar (module **Form Creation**, color `#7A4F3A`), except the print view
which is a standalone full-page layout.

| Route | Page | Purpose |
|---|---|---|
| `/form-creation` | Form Library | Browse/search/filter templates, lifecycle actions, Issue to project |
| `/form-creation/dashboard` | Dashboard | KPIs, full lifecycle breakdown, ALCOA+/Part 11 snapshot, recent activity |
| `/form-creation/builder/[id]` | Builder | Drag-and-drop WYSIWYG designer (`id` = `new` for a blank form) |
| `/form-creation/instances` | Issued Instances | List of issued `FormIssuedInstance`s, Execute/Print/Audit actions |
| `/form-creation/execute/[instanceId]` | Execution | Fill in an issued instance — capture, sign, submit, approve |
| `/form-creation/print/[id]` | Print / PDF | Generic print layout for a template (`?instance=<id>` for an issued instance) |
| `/form-creation/audit` | Audit Trail | Immutable form-domain audit log, filterable |
| `/form-creation/upload` | New from Document | Simulated "AI conversion" of an uploaded document into a draft template |

## 4. User Types / Personas

The prototype runs as a single signed-in user (`CURRENT_USER` = **A. Liang**,
`LIMS-USR-0042`, *Analyst*, *Bioanalytical* — see `masterData.ts`), but the lifecycle
and execution workflows are designed around the following roles, seeded in
`USER_MASTER`:

| Role | Example user | Responsibilities in this module |
|---|---|---|
| **Analyst** | A. Liang (LIMS-USR-0042) | Authors/edits draft templates; executes issued instances; captures instrument readings; signs as *Performed By* |
| **Principal Investigator** | Dr. S. Mehta (LIMS-USR-0017) | Reviews clinical forms during *Under Review* |
| **Study Director** | Dr. R. Patel (LIMS-USR-0028) | Reviews bioanalytical forms; signs as *Reviewed By / Verified By* |
| **QA Reviewer** | T. Okafor (LIMS-USR-0035) | Moves templates *Under Review → QA Review*; signs as *Witnessed By* |
| **QA Approver** | M. Chen (LIMS-USR-0050) | *QA Approve*s templates, makes them *Effective*; final instance *Approve* |

In production, the active user and their role would come from SSO/LDAP and would gate
which `STATUS_FLOW` transitions and signature meanings are available (see
[`05-workflows-and-approvals.md`](./05-workflows-and-approvals.md)).

## 5. Glossary

| Term | Meaning |
|---|---|
| **Form Template** (`FormTemplate`) | A versioned, designed form definition — pages, fields, header/footer/orientation, lifecycle status, revision history. Lives in the Form Library. |
| **Form Instance** (`FormIssuedInstance`) | A numbered, immutable **snapshot** of a Template's pages/header/footer/orientation, issued against a project/study, that an analyst fills in. Carries its own status, captured `values` and `signatures`. |
| **Field** (`FormField`) | A single input/display element on a page — one of 24 `FieldType`s (text, weigh-slip, e-signature, dynamic-table, instrument-capture, …). |
| **Page** (`FormPage`) | An ordered group of fields with a title; templates/instances can have multiple pages, each independently portrait/landscape via the template's `orientation`. |
| **Palette** | The categorised list of field types an author can drag onto the canvas (Basic, Lab Specific, Smart Fields, Layout, Compliance). |
| **Revision History** (`RevisionEntry[]`) | Append-only list of `{version, date, author, change, changeControlRef?}` entries on a template, shown in Page Setup. |
| **Issuance** | The act of generating a numbered `FormIssuedInstance` from a `live` template for a specific project, via `issueForm()`. |
| **Instance No.** | Unique identifier of an issued instance, format `<FormNo>-V<MajorVersion>-<Year>-<6-digit-seq>`, e.g. `F-BA-002-V02-2026-000001`. |
| **Smart Field** | A field bound to master data (`masterBinding: 'project'|'sample'|'instrument'|'user'`) that acts as a picker and auto-fills related fields by label match. |
| **Instrument Capture** | A field type that pulls a (simulated) live reading from a connected instrument, recording value/unit/instrument ID/timestamp/operator. |
| **Conditional Visibility** (`VisibilityRule`) | A rule (`fieldId`, `operator`, `value?`) that hides/shows a field at runtime based on another field's value. |
| **E-Signature** | A field type requiring a named user, a "meaning of signature" (Performed By / Reviewed By / …), an optional reason, and — if `requirePassword` — a password confirmation. Produces a `SignatureRecord`. |
| **Audit Event** (`AuditEvent`) | An immutable, timestamped record of a status change, version, issuance, signature, instrument capture, or value correction. One of 7 `AuditCategory` values. |
| **ALCOA+** | Attributable, Legible, Contemporaneous, Original, Accurate (+ Complete, Consistent, Enduring, Available) — the data-integrity principles underpinning 21 CFR Part 11, surfaced as a live "Compliance Snapshot" on the Dashboard. |
| **Watermark** | A diagonal overlay on the print output indicating non-final status (`DRAFT`, `OBSOLETE`, `ARCHIVED`, `DRAFT — NOT FINAL` for in-progress instances), or a custom header override. |

## 6. Demo vs. Production Assumptions

The prototype is **entirely client-side** (Next.js App Router + React, no backend, no
database, no auth server). To make the UX honest while still demonstrating every
capability of the brief, several pieces are **simulated**. These are the only
intentional gaps between the prototype and the production design described in this
document set:

| Area | In this prototype | In production |
|---|---|---|
| **Persistence** | `localStorage` (`lims-form-templates`, `lims-form-instances`, `lims-form-instance-counters`, `lims-form-audit`) | Relational database via REST API — see [`04-data-model.md`](./04-data-model.md) and [`06-api-specification.md`](./06-api-specification.md) |
| **Authentication / identity** | Single hardcoded `CURRENT_USER` (A. Liang); no login screen | SSO/LDAP/OIDC; role-based access control gates `STATUS_FLOW` transitions and signature meanings per user |
| **E-signature password** | A single demo password (`"demo"`) for any field with `requirePassword: true` | Re-authentication against the identity provider, with configurable step-up (password / MFA) |
| **Document → draft conversion** (`/form-creation/upload`) | Filename and chosen category drive a deterministic "starter field set" generator (`buildStarterFields`); no OCR/NLP actually runs | OCR + layout analysis + ML field-type classification against the uploaded PDF/Word/image, producing the same draft-template shape |
| **Instrument integration** (`instrument-capture` fields) | `simulateInstrumentCapture()` returns a randomised value within tolerance, plus a randomly-selected instrument from `INSTRUMENT_MASTER` of the matching type | Real-time acquisition from instrument middleware/drivers — see [`09-instrument-integration.md`](./09-instrument-integration.md) |
| **Master data** (projects, samples, instruments, users) | Static seeded arrays in `masterData.ts` | Synced from LIMS core modules (Projects, Sample Management, Instrument Management, User Management) |
| **PDF generation** | Browser `window.print()` against a dedicated print stylesheet (`@page`, `.print-sheet`, etc.) | Same HTML/CSS rendered server-side to PDF (e.g. headless Chromium) for archival, in addition to interactive print |
| **QR / barcode** | CSS-grid placeholder patterns (`QrPattern`, `BarcodePattern`) seeded from a context reference string | Real QR/barcode rendering (e.g. encoding the instance URL or audit reference) |
| **Audit trail** | Append-only `localStorage` array; no tamper-evidence beyond "no edit/delete UI" | Database-enforced append-only table (no UPDATE/DELETE grants), optionally hash-chained |

Everything else — field types, lifecycle states, visibility rules, formula evaluation,
dynamic tables, page setup, versioning, issuance numbering, dashboards, and the print
layout — is **fully implemented** and behaves as described in the rest of this
document set.
