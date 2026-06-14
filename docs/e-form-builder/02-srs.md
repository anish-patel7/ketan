# Software Requirements Specification (SRS)

Deliverable **(2)** of the e-Form Builder brief — non-functional requirements covering
performance, security, availability, compatibility and the technology stack. Functional
behaviour is specified in [`01-frs.md`](./01-frs.md).

## 1. Technology Stack

| Layer | Prototype | Production target |
|---|---|---|
| Framework | Next.js 16.2.4 (App Router), React 19.2.4 | Same — App Router with server components for data-fetching pages |
| UI library | Ant Design 6.3.6 (`Table`, `Modal`, `Select`, `Steps`, `Progress`, `Upload`, …) | Same |
| Drag & drop | `@dnd-kit/core`, `@dnd-kit/sortable` | Same |
| Icons | `lucide-react` | Same |
| Language | TypeScript (strict), `tsc --noEmit` clean | Same |
| Styling | Global design tokens in `globals.css` (`--accent`, `--bg-card`, DM Serif Display / DM Sans fonts), print-specific stylesheet for `@page`/`.print-sheet` | Same |
| Persistence | Browser `localStorage` (per-browser, per-origin) | PostgreSQL (or equivalent RDBMS) via REST API — see [`04-data-model.md`](./04-data-model.md), [`06-api-specification.md`](./06-api-specification.md) |
| Auth | None (hardcoded `CURRENT_USER`) | SSO/OIDC/LDAP integrated with the LIMS identity provider |
| PDF generation | `window.print()` against print CSS | Same client print path **plus** server-side headless-Chromium rendering of the identical HTML/CSS for archival PDFs |

## 2. Performance Requirements

| ID | Requirement |
|---|---|
| NFR-P.1 | The Builder canvas shall remain responsive (drag/drop, property edits, formula recalculation) for templates with up to ~10 pages and ~50 fields per page — formula evaluation (`evalFormula`) is O(fields) per keystroke and must stay sub-frame. |
| NFR-P.2 | List pages (Form Library, Issued Instances, Audit Trail) shall paginate client-side (`Table` `pagination`) at 12–15 rows per page rather than rendering unbounded result sets. |
| NFR-P.3 | The Execution screen shall persist changes (`upsertInstance`) on explicit user actions (Save/Submit/Sign/Capture) rather than on every keystroke, to bound write volume. |
| NFR-P.4 | Print rendering shall reuse the same `FieldRenderer` tree as edit mode (no duplicate templating engine), so print preview generation is O(pages × fields) with no additional network round-trips — all data is already resident. |
| NFR-P.5 (production) | List/search endpoints shall support server-side pagination and filtering once template/instance counts exceed a few hundred records. |

## 3. Security Requirements

| ID | Requirement |
|---|---|
| NFR-S.1 | Lifecycle transitions (`STATUS_FLOW`) and instance-status transitions shall, in production, be authorised per-role (Analyst may Submit for Review; QA Reviewer may Send to QA/QA Approve/Reject; only QA Approver may Make Effective/Activate). The prototype exposes all transitions to the single demo user for evaluation purposes — see [`05-workflows-and-approvals.md`](./05-workflows-and-approvals.md). |
| NFR-S.2 | E-signatures (`requirePassword: true`) shall require re-authentication. The prototype's single shared demo password (`"demo"`) is **not** a production control — production shall integrate with the identity provider's credential/MFA flow. |
| NFR-S.3 | The audit trail shall be append-only at the data layer (no UPDATE/DELETE grants on the audit table in production; the prototype enforces this only by omitting edit/delete UI — see [`07-audit-trail-and-part11.md`](./07-audit-trail-and-part11.md)). |
| NFR-S.4 | The formula evaluator (`evalFormula`) shall reject any expression containing characters outside `[0-9+\-*/().\s%]` before evaluation, preventing arbitrary code execution via user-authored formulas. |
| NFR-S.5 (production) | All template/instance/audit/master-data endpoints shall require authentication; mutating endpoints shall require the caller's role to match the action (see [`06-api-specification.md`](./06-api-specification.md) §Authorization). |
| NFR-S.6 (production) | Uploaded documents (FR-15) shall be virus-scanned and size/type-restricted before OCR processing. |

## 4. Availability & Reliability

| ID | Requirement |
|---|---|
| NFR-A.1 | All `localStorage` read paths (`loadForms`, `loadInstances`, `loadAuditTrail`, `loadCounters`) shall tolerate missing/corrupt data by falling back to seed data or empty arrays (`try { JSON.parse } catch { … }`), so a corrupted browser store never crashes the app. |
| NFR-A.2 | Older persisted templates (pre-dating header/footer/orientation/revisionHistory or using the legacy 5-stage `status: 'active'`) shall be transparently migrated on load (`normalizeForm`). |
| NFR-A.3 (production) | The REST API shall target ≥99.5% availability during lab operating hours; write endpoints (issuance, signatures, audit) shall be transactional — an instance status change and its audit event must commit atomically. |
| NFR-A.4 (production) | Issuance numbering (`buildInstanceNo` + per-`(formNo, version, year)` counter) shall use a database sequence or row-level lock to guarantee uniqueness under concurrent issuance — the prototype's `localStorage` counter is single-tab-safe only. |

## 5. Data Integrity Requirements

| ID | Requirement |
|---|---|
| NFR-D.1 | An issued instance shall snapshot its template's `pages`/`header`/`footer`/`orientation` at issuance time; subsequent template edits/new versions shall **never** retroactively alter an already-issued instance. |
| NFR-D.2 | Required-field validation (`getMissingRequiredFields`) shall respect conditional visibility (`evaluateVisibility`) — a hidden required field shall not block submission. |
| NFR-D.3 | Every value correction, signature, instrument capture and status change on an instance shall produce a corresponding `AuditEvent` with `oldValue`/`newValue` where applicable, supporting full reconstruction of an instance's history. |
| NFR-D.4 (production) | Master data (projects, samples, instruments, users) shall be the single source of truth shared with the rest of the LIMS — no duplicate/divergent copies. |

## 6. Usability & Accessibility

| ID | Requirement |
|---|---|
| NFR-U.1 | Status, instance-status and audit-category colour coding shall be defined once (`STATUS_STYLE`, `INSTANCE_STATUS_STYLE`, `AUDIT_CATEGORY_COLOR` in `formUtils.ts`) and reused across the Form Library, Builder top bar, Dashboard, Issued Instances and Audit Trail, so status meaning is visually consistent everywhere. |
| NFR-U.2 | Every list/empty state shall present an actionable call to action (e.g. "Create your first form", "Go to Form Library to issue a form") rather than a bare "no data" message. |
| NFR-U.3 | The Builder canvas shall visually distinguish fields with active conditional-visibility rules (eye-off badge) so authors are not surprised by runtime hide/show behaviour. |
| NFR-U.4 | Read-only states (completed/approved instances, obsolete/archived templates in print) shall be clearly banner-flagged, not merely disabled controls. |

## 7. Compatibility

| ID | Requirement |
|---|---|
| NFR-C.1 | The application targets evergreen desktop browsers (Chrome/Edge/Firefox current) — required for `window.print()`, CSS `@page`, and `@dnd-kit` pointer/keyboard sensors. |
| NFR-C.2 | Print output shall render correctly at A4 in both portrait and landscape (`@page { size: A4 <orientation>; margin: 10mm }`), per the template/instance's `orientation`. |
| NFR-C.3 | The module shall not depend on any AppLayout assumption beyond the shared sidebar/topbar pattern; the print view intentionally renders outside `AppLayout` (no sidebar) for a clean printable surface. |

## 8. Maintainability

| ID | Requirement |
|---|---|
| NFR-M.1 | Field rendering for edit, preview, execution and print shall share a single implementation (`shared/FieldRenderer.tsx`) — no per-screen duplication of the 24 field-type renderers. |
| NFR-M.2 | Lifecycle, instance-status and audit-category labels/styles/transition maps shall be defined once in `formUtils.ts` ("single source of truth") and imported everywhere they're displayed or branched on. |
| NFR-M.3 | The Builder shall be decomposed into focused modules (`palette.tsx`, `canvas.tsx`, `properties-panel.tsx`, `preview-modal.tsx`, `meta-modal.tsx`, `page-setup-modal.tsx`) rather than a single monolithic page component. |
| NFR-M.4 | New field types shall require changes in exactly three places: `types.ts` (type/shape), `palette.tsx` (`createField` default + palette entry), and `shared/FieldRenderer.tsx` (`renderBody` dispatch) — plus an optional `properties-panel.tsx` sub-panel for type-specific settings. |

## 9. Compliance

Detailed in [`07-audit-trail-and-part11.md`](./07-audit-trail-and-part11.md). In summary:

| ID | Requirement |
|---|---|
| NFR-R.1 | The module's audit trail, e-signature and revision-history design shall map to 21 CFR Part 11 §11.10 (controls for closed systems) and ALCOA+ data-integrity principles. |
| NFR-R.2 | The Dashboard's Compliance Snapshot shall expose live, computed evidence for each ALCOA+ principle rather than static claims. |
