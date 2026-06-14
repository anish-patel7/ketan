# Audit Trail Design & 21 CFR Part 11 / ALCOA+ Compliance Mapping

Deliverables **(8)** Audit trail design and **(9)** 21 CFR Part 11 / ALCOA+ compliance
mapping.

## 1. Audit Event Model

```ts
type AuditEvent = {
  id: string;            // "aud-<timestamp>-<rand4>"
  timestamp: string;      // ISO 8601, set at write time — never client-supplied
  actor: string;          // user name (CURRENT_USER.name in the prototype)
  actorRole: string;       // user role at time of action
  category: AuditCategory; // one of 7 values, below
  formId?: string; formNo?: string;
  instanceId?: string; instanceNo?: string;
  field?: string;
  oldValue?: string; newValue?: string;
  reason?: string;
  detail: string;          // human-readable summary
};
```

`logAuditEvent(event)` (`formAudit.ts`) is the **only** write path: it stamps `id` and
`timestamp` server-side (client-side `Date.now()`/`Math.random()` in the prototype) and
prepends to the log — `persistAuditTrail([full, ...loadAuditTrail()])`. There is no
function to edit or remove an event.

## 2. Audit Categories

| Category | `AUDIT_CATEGORY_LABEL` | Color | Written by | Example `detail` |
|---|---|---|---|---|
| `form-status` | Status Change | `#3A6B9B` | `page.tsx: updateStatus` | "F-FR-001 status changed from Draft to Under Review." |
| `form-version` | New Version | `#7B5EA7` | `page.tsx: handleCreateVersion` | "New version v2.2 of F-BA-001 branched from v2.1 (Change Control CC-2026-020): Added stability check step." |
| `form-issued` | Form Issued | `#B05E2A` | `page.tsx: handleIssue` | "Issued F-BA-002-V01-2026-000001 for project PRJ-2026-001 — Metformin BE Study." |
| `instance-status` | Instance Status | `#2E7D32` | `execute/[instanceId]/page.tsx: logStatusChange` | "F-BA-002-V01-2026-000001 submitted for review by A. Liang." |
| `instance-value` | Value Corrected | `#B8860B` | (reserved — value-correction workflow) | "Field 'Final Volume' corrected from 9.8 to 10.0 mL — transcription error." |
| `instance-signed` | E-Signature | `#5C6E4E` | `execute/[instanceId]/page.tsx: confirmSign` | "F-BA-002-V01-2026-000001 — \"Prepared By\" signed by A. Liang (Performed By)." |
| `instrument-capture` | Instrument Capture | `#2A6B8F` | `execute/[instanceId]/page.tsx: handleCapture` | "Captured 50.12 mg from BAL-001 (Sartorius MSE Analytical Balance) for 'Active Ingredient'." |

`instance-value` is modelled in `types.ts` (`oldValue`/`newValue`/`field`/`reason`
fields exist on `AuditEvent` for this purpose) for a future explicit "correct a
previously-saved value with reason" workflow, distinct from the normal in-progress
edit flow.

## 3. Audit Trail UI

`audit/page.tsx` provides:

- **Summary counters**: Total Events, E-Signatures, Instrument Captures, Lifecycle
  Changes (`form-status` + `instance-status`).
- **Filters**: free-text search (`detail`/`actor`/`formNo`/`instanceNo`), category
  dropdown (`AUDIT_CATEGORY_LABEL`), plus URL-driven `instanceId`/`formId` focus
  (deep-linked from Execution screen, Print preview and Form Library).
- **Table**: Timestamp, Category (colour-coded `Tag`), Reference (clickable
  instance/form number → Execution/Builder), Actor + Role, Detail (with
  old→new value diff and field name where applicable).
- No edit, delete, or "clear filter and resubmit" affordance that could mutate history
  — filters are purely client-side view state.

The Dashboard's **Recent Activity** feed (`dashboard/page.tsx`) shows the 8 most recent
events using the same category labels/colours, linking to the full Audit Trail.

## 4. Immutability

| Layer | Prototype | Production |
|---|---|---|
| API surface | No update/delete function exists in `formAudit.ts` | No `PUT`/`PATCH`/`DELETE` route for `/api/forms/audit-events` ([`06-api-specification.md`](./06-api-specification.md) §3) |
| Storage | Single `localStorage` array, always appended via `[full, ...existing]` | Dedicated `audit_events` table with **no UPDATE/DELETE grants** for the application role; only `INSERT` |
| Tamper evidence | None (out of scope for a client-only prototype) | Optionally hash-chain each event (`hash = H(prev_hash ‖ event)`) for cryptographic tamper-evidence |
| Retention | Lives as long as the browser's `localStorage` | Subject to the organisation's record-retention policy (typically ≥ study retention period, often 15+ years for GxP) |

## 5. ALCOA+ Compliance Snapshot

The Dashboard computes nine live metrics — one per ALCOA+ principle — directly from
current template/instance/audit data (`dashboard/page.tsx: ALCOA_ITEMS`). This section
documents what each metric means and which Part 11 clause it evidences.

| Principle | Dashboard metric | Implementation evidence | Part 11 reference |
|---|---|---|---|
| **Attributable** | "`X`/`Y` e-signature field(s) require password confirmation, binding every entry to a named, authenticated user." | `e-signature` fields with `requirePassword: true`; `SignatureRecord.userId/userName/role` | §11.50 (signature manifestation includes printed name); §11.100/11.200 (unique ID/password) |
| **Legible** | "All data is captured in structured digital fields with controlled vocabularies — no handwriting to interpret." | 24 typed `FieldType`s with `options`/`columns`/master-data bindings instead of free text where controlled values apply | §11.10(a) |
| **Contemporaneous** | "Field values, signatures and instrument readings are timestamped automatically at the moment of capture." | `SignatureRecord.timestamp`, `instrument-capture` `__timestamp`, `AuditEvent.timestamp` — all server/`Date.now()`-derived, never user-editable | §11.10(e) |
| **Original** | "`X`/`Y` form template(s) carry a full revision history linking every version back to its predecessor." | `revisionHistory: RevisionEntry[]`, `previousVersionId`/`nextVersionId` chain | §11.10(c) |
| **Accurate** | "`X`/`Y` weigh/pH/instrument-capture field(s) enforce target & tolerance limits · `M`/`N` instruments due for calibration within 30 days." | `weighResult`/`phResult` Pass/Fail/Reweigh evaluation against `targetWeight`/`toleranceMin/Max` and `targetPH`/`phMin/Max`; `INSTRUMENT_MASTER.calibrationDue` | §11.10(a), §11.10(h) (device checks) |
| **Complete** | "`X`/`Y` issued instance(s) are fully completed and approved with no missing required fields." | `getMissingRequiredFields()` gate on Submit for Review; `instance.status in {completed, approved}` count | §11.10(b) |
| **Consistent** | "Every template renders through one shared field engine, so capture, validation and print output are identical across all forms." | `shared/FieldRenderer.tsx` used by Builder Preview, Execution and Print — see [`03-architecture.md`](./03-architecture.md) | §11.10(a) |
| **Enduring** | "Every status change, signature, issuance and instrument capture is written to an append-only audit log." | `formAudit.ts: logAuditEvent`, called from every mutating handler | §11.10(e) |
| **Available** | "`N` audit event(s) recorded — fully searchable and retrievable on demand." | `audit/page.tsx` search/filter over `getAuditTrail()` | §11.10(c) |

## 6. 21 CFR Part 11 §11.10 — Controls for Closed Systems

| §11.10 clause | Requirement | How this module addresses it |
|---|---|---|
| (a) | Validation of systems to ensure accuracy, reliability, consistent intended performance, and the ability to discern invalid/altered records | Shared `FieldRenderer`/`formUtils` ensure one rendering/validation path; `evalFormula` whitelist prevents invalid formula injection; lifecycle/instance-status state machines constrain valid record states |
| (b) | Ability to generate accurate and complete copies of records, including in human-readable form, suitable for inspection | Generic Print/PDF engine ([`10-print-engine.md`](./10-print-engine.md)) renders any template/instance — header, all pages, signatures summary — to a printable/PDF document |
| (c) | Protection of records to enable their accurate and ready retrieval throughout the retention period | Append-only audit log (§4); instance snapshots are immutable once issued ([`04-data-model.md`](./04-data-model.md)) |
| (d) | Limiting system access to authorized individuals | Production: SSO/OIDC + RBAC gating `STATUS_FLOW`/instance-status transitions and signature meanings ([`02-srs.md`](./02-srs.md) NFR-S.1, NFR-S.5). **Prototype gap**: single hardcoded user — see [`00-overview.md`](./00-overview.md) §6 |
| (e) | Secure, computer-generated, time-stamped audit trails for create/modify/delete of electronic records | §1–4 above |
| (f) | Operational system checks to enforce permitted sequencing of steps and events | `STATUS_FLOW` (template lifecycle) and the instance-status state machine ([`05-workflows-and-approvals.md`](./05-workflows-and-approvals.md)) only expose valid next-states |
| (g) | Authority checks to ensure only authorised individuals can use the system, alter a record, perform an operation | Production RBAC (as (d)); formula sandboxing (`evalFormula` character whitelist) prevents unauthorised code execution via form design |
| (h) | Device (e.g. terminal) checks to determine validity of the source of data input | `instrument-capture` fields bind to `INSTRUMENT_MASTER` entries with `calibrationDue`; production Instrument Middleware ([`09-instrument-integration.md`](./09-instrument-integration.md)) would refuse captures from out-of-calibration or unregistered devices |
| (i) | Determination that persons who develop, maintain, or use the system have education/training/experience | Organisational (training records) — out of scope for the application |
| (j) | Establishment of written policies holding individuals accountable for actions under their electronic signatures | Organisational SOP, supported technically by the e-signature meaning/reason capture (§7) |
| (k) | Appropriate controls over systems documentation (distribution, access, revision/change control) | This documentation package itself is versioned under the LIMS' document control; the module's own templates use `revisionHistory`/`changeControlRef` |

## 7. 21 CFR Part 11 §11.50 / §11.70 — Signature Manifestations & Linking

| Requirement | Implementation |
|---|---|
| §11.50(a) — signed records shall contain the printed name of the signer, date/time of signing, and the **meaning** (e.g. review, approval, responsibility, authorship) | `SignatureRecord { userName, role, meaning, timestamp }`; `meaning` ∈ `SIGNATURE_MEANINGS` = Performed By, Reviewed By, Approved By, Witnessed By, Verified By, Authorised By |
| §11.50(b) — these items shall be shown on displays and printouts of the record | Print engine's "Signatures & Approvals" page renders Signature For / Role / Name / Meaning / Timestamp for every signature slot, including step-section sign-offs ([`10-print-engine.md`](./10-print-engine.md)) |
| §11.70 — electronic signatures shall be linked to their respective records such that they cannot be excised, copied, or otherwise transferred to falsify another record | `signatures: Record<fieldId, SignatureRecord>` lives **inside** the immutable instance snapshot, not as a detachable artifact; the field key (`f.id` or `${stepFieldId}_${stepId}__sign`) ties the signature to a specific field/step within a specific instance |
| §11.200 — electronic signatures shall employ at least two distinct identification components (e.g. ID + password) when first executed in a session | Production: SSO session (component 1) + step-up password/MFA at signing time (component 2) for `requirePassword: true` fields. **Prototype gap**: single shared demo password `"demo"` — see [`00-overview.md`](./00-overview.md) §6 and [`02-srs.md`](./02-srs.md) NFR-S.2 |
