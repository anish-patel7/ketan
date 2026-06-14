# API Specification

Deliverable **(7)**. REST API design for the production Forms service that the
prototype's `store.ts` / `instances.ts` / `formAudit.ts` / `masterData.ts` /
`formUtils.simulateInstrumentCapture` emulate client-side via `localStorage`. All
endpoints are namespaced under `/api/forms` (except master data, which is a read-through
proxy to other LIMS modules, and instrument capture, which is proxied via Instrument
Middleware).

## Conventions

- All request/response bodies are JSON; all timestamps are ISO 8601 (`timestamptz`).
- All endpoints require an authenticated session (SSO/OIDC — [`02-srs.md`](./02-srs.md)
  NFR-S.5); the acting user/role is derived from the session, **not** from the request
  body (the prototype's `CURRENT_USER`/`actor`/`actorRole` fields are illustrative of
  what the server would stamp onto audit events).
- Mutating endpoints that change lifecycle/instance status or write a signature also
  write an `AuditEvent` **in the same transaction** ([`02-srs.md`](./02-srs.md) NFR-A.3).
- Errors use the shape `{ "error": { "code": string, "message": string, "details"?: object } }`
  with standard HTTP status codes (400 validation, 401/403 auth, 404 not found, 409 conflict).

## 1. Form Templates

### `GET /api/forms/templates`

List/search templates. Corresponds to `store.ts: loadForms()` + Form Library's
client-side filtering.

Query params: `q` (matches `name`/`formNo`), `category`, `department`, `status`,
`page`, `pageSize`.

```json
200 OK
{
  "items": [ { "id": "f-ba-002", "formNo": "F-BA-002", "name": "Solution Preparation Log",
                "category": "Log Sheet", "department": "Bioanalytical", "version": "1.3",
                "status": "live", "pages": 1, "updatedAt": "2026-03-18" } ],
  "total": 4, "page": 1, "pageSize": 12
}
```

### `POST /api/forms/templates`

Create a new blank template (Form Library → New Form) or a draft from document
conversion (`upload/page.tsx: buildDraftForm`). Body = full `FormTemplate` minus
server-assigned `id`.

```json
201 Created
{ "id": "form-1781234567890", "formNo": "F-GE-005", "status": "draft", ... }
```

### `GET /api/forms/templates/{id}`

Full `FormTemplate` (`pages`, `header`, `footer`, `orientation`, `revisionHistory`,
etc.) — corresponds to `store.ts: getForm(id)`.

### `PUT /api/forms/templates/{id}`

Save the full template (Builder "Save Draft"). Body = full `FormTemplate`. Server sets
`updatedAt`. 200 with the saved template, or 409 if `status` is not editable (e.g.
`live`/`obsolete`/`archived` — production would reject direct edits to non-draft
templates; the prototype allows editing any status for evaluation simplicity).

### `POST /api/forms/templates/{id}/status`

Apply a lifecycle transition (`page.tsx: updateStatus` / Builder top bar). Body:
`{ "next": "<FormStatus>" }`.

- 200 with the updated template if `next` is a valid `STATUS_FLOW[current]` transition
  **and** the caller's role is authorised for it ([`05-workflows-and-approvals.md`](./05-workflows-and-approvals.md) §1).
- Side effects: sets `updatedAt`; sets `effectiveDate`/`obsoleteDate` as applicable;
  writes a `form-status` `AuditEvent`.
- 409 if `next` is not in the allowed set for the current status.
- 403 if the caller's role cannot perform this transition.

### `POST /api/forms/templates/{id}/versions`

Create a new draft version (Page Setup → "Create New Version"). Body:
`{ "version": "2.2", "change": "...", "changeControlRef"?: "CC-2026-020" }`.

- 201 with the new template (`status: "draft"`, `previousVersionId: id`).
- Also updates `{id}` with `nextVersionId` pointing at the new draft.
- Writes a `form-version` `AuditEvent`.
- 409 if `{id}` already has a `nextVersionId`.

### `POST /api/forms/templates/{id}/duplicate`

Form Library "Duplicate" (`handleDuplicate`). Returns a new `draft` v1.0 template with
`formNo` suffixed `-COPY`, a single-entry `revisionHistory` noting the source, and
`effectiveDate`/`obsoleteDate`/`previousVersionId`/`nextVersionId` cleared.

### `DELETE /api/forms/templates/{id}`

Form Library "Delete" after confirmation. 204 No Content. (Production: likely
restricted to `draft` templates with no issued instances — the prototype allows
deleting any template.)

## 2. Form Instances

### `GET /api/forms/instances`

List issued instances (Issued Instances page). Query params: `q`, `status`,
`projectNo`, `page`, `pageSize`.

```json
200 OK
{ "items": [ { "id": "inst-...", "instanceNo": "F-BA-002-V01-2026-000001",
                "formNo": "F-BA-002", "formName": "Solution Preparation Log",
                "projectNo": "PRJ-2026-001", "status": "in-progress",
                "issuedAt": "2026-05-12T09:03:00Z", "issuedBy": "A. Liang" } ],
  "total": 1, "page": 1, "pageSize": 15 }
```

### `POST /api/forms/instances`

Issue a `live` template to a project (`instances.ts: issueForm`). Body:
`{ "formTemplateId": "f-ba-002", "projectNo": "PRJ-2026-001" }`.

- Server: looks up the template (must be `status === "live"`, else 409) and the
  project (else 404); computes `instanceNo` per
  [`05-workflows-and-approvals.md`](./05-workflows-and-approvals.md) §3 using an
  atomic per-`(formNo, majorVersion, year)` sequence; snapshots
  `pages`/`header`/`footer`/`orientation` from the template; sets `status: "issued"`,
  empty `values`/`signatures`.
- 201 with the new instance (including `instanceNo`).
- Writes a `form-issued` `AuditEvent`.

### `GET /api/forms/instances/{id}`

Full `FormIssuedInstance` (snapshot `pages`/`header`/`footer`/`orientation`, current
`values`, `signatures`) — corresponds to `instances.ts: getInstance(id)`. Also used by
the Print engine (`?instance=` query) and Execution screen.

### `PATCH /api/forms/instances/{id}`

Partial update of `values`/`signatures` (Execution "Save Progress"). Body:
`{ "values": {...}, "signatures": {...} }`. 200 with the merged instance
(`instances.ts: upsertInstance` merge semantics).

- If this is the **first** save (`status === "issued"`), the server also transitions
  `status` to `"in-progress"` and writes an `instance-status` `AuditEvent`
  (`handleSave`).

### `POST /api/forms/instances/{id}/status`

Instance lifecycle transition (`execute/[instanceId]/page.tsx`). Body:
`{ "next": "in-progress" | "under-review" | "completed" }`.

- `→ "under-review"`: 409 with `{ "error": { "code": "MISSING_REQUIRED_FIELDS",
  "details": { "fields": [...] } } }` if `getMissingRequiredFields()` is non-empty
  ([`05-workflows-and-approvals.md`](./05-workflows-and-approvals.md) §2).
- `→ "completed"`: sets `completedAt`; thereafter the instance is read-only
  (`isReadOnly`).
- Writes an `instance-status` `AuditEvent` with a human-readable `detail`.

### `POST /api/forms/instances/{id}/captures`

Record an instrument capture for a field (`instrument-capture` type). Body:
`{ "fieldId": "f-...", "instrumentType": "balance" }`.

- Server calls the Instrument Middleware (§5) for a live reading, or — in a
  non-integrated environment — falls back to the same simulation as
  `formUtils.simulateInstrumentCapture` (selects a matching instrument from
  `instrument_master`, generates a value within tolerance if `targetWeight` is set).
- Response merges into `values`: `{fieldId}`, `{fieldId}__unit`,
  `{fieldId}__instrument`, `{fieldId}__instrumentName`, `{fieldId}__timestamp`,
  `{fieldId}__operator` (the calling user).
- Writes an `instrument-capture` `AuditEvent`. Calling again (re-capture) overwrites
  the same keys and writes a new audit event — both captures remain visible in the
  audit trail.

### `POST /api/forms/instances/{id}/signatures`

Record an e-signature (`execute/[instanceId]/page.tsx: confirmSign`). Body:
`{ "fieldId": "f-...", "meaning": "Performed By", "reason"?: "...", "password"?: "..." }`.

- If the target field has `requirePassword: true`, `password` must validate against
  the caller's credentials (production — re-auth via IdP; prototype —
  `DEMO_PASSWORD = "demo"`). 401 on mismatch.
- On success: writes `signatures[fieldId] = { userId, userName, role, meaning, reason,
  timestamp }` (server stamps `userId`/`userName`/`role`/`timestamp` from the session,
  not the request body); writes an `instance-signed` `AuditEvent`.
- 200 with the updated instance.

## 3. Audit Events

### `GET /api/forms/audit-events`

Append-only log (`formAudit.ts: getAuditTrail`). Query params: `category` (one of the 7
`AuditCategory` values), `formId`, `instanceId`, `q` (free text over `detail`/`actor`/
`formNo`/`instanceNo`), `page`, `pageSize`. Sorted newest-first.

```json
200 OK
{ "items": [ { "id": "aud-...", "timestamp": "2026-06-10T14:02:11Z",
                "actor": "A. Liang", "actorRole": "Analyst",
                "category": "instance-signed", "instanceId": "inst-...",
                "instanceNo": "F-BA-002-V01-2026-000001",
                "detail": "F-BA-002-V01-2026-000001 — \"Prepared By\" signed by A. Liang (Performed By)." } ],
  "total": 27, "page": 1, "pageSize": 15 }
```

No `PUT`/`PATCH`/`DELETE` is defined for this resource — see
[`07-audit-trail-and-part11.md`](./07-audit-trail-and-part11.md) §"Immutability".

## 4. Master Data (read-only proxies)

These endpoints proxy the authoritative LIMS Core modules; the Forms service does not
own this data.

| Endpoint | Source module | Mirrors |
|---|---|---|
| `GET /api/forms/master-data/projects` | Projects | `PROJECT_MASTER` (`projectNo`, `studyNo`, `name`, `sponsor`) |
| `GET /api/forms/master-data/samples?projectNo=` | Sample Management | `SAMPLE_MASTER` (`sampleId`, `projectNo`, `matrix`, `status`) |
| `GET /api/forms/master-data/instruments?type=` | Instrument Management | `INSTRUMENT_MASTER` (`instrumentId`, `name`, `type`, `location`, `calibrationDue`) |
| `GET /api/forms/master-data/users?role=` | User Management | `USER_MASTER` (`userId`, `name`, `role`, `department`) |

Used by: Smart Field pickers (`sample-id`/`project-id`/`instrument`/`user-field`),
the Issue-to-Project modal, and `getMasterAutoFill` (auto-fill of related fields by
label match on selection).

## 5. Instrument Integration

### `POST /api/instruments/{instrumentId}/capture`

Proxied through Instrument Middleware (see
[`09-instrument-integration.md`](./09-instrument-integration.md)). Body:
`{ "captureUnit"?: string, "context": { "instanceId": "...", "fieldId": "..." } }`.

```json
200 OK
{ "value": "50.12", "unit": "mg", "instrumentId": "BAL-001",
  "instrumentName": "Sartorius MSE Analytical Balance",
  "timestamp": "2026-06-10T14:01:55Z" }
```

This is the production equivalent of `formUtils.simulateInstrumentCapture(field,
instruments)`; `/api/forms/instances/{id}/captures` (§2) calls this internally and
persists the result onto the instance.

## 6. Document Conversion ("New from Document")

### `POST /api/forms/templates/convert-from-document`

Multipart upload: `file` (PDF/DOC/DOCX/PNG/JPG), `formName`, `category`, `department`,
`description?`. Production: routes to the Document Conversion Service (OCR + layout +
field-type classification). Response is a draft `FormTemplate` in the same shape as
`upload/page.tsx: buildDraftForm` produces client-side (`status: "draft"`, `version:
"1.0"`, starter `pages` derived from the document, a `revisionHistory` entry noting the
source filename).

```json
201 Created
{ "id": "form-...", "formNo": "F-GE-005", "status": "draft", "version": "1.0",
  "revisionHistory": [ { "version": "1.0", "date": "2026-06-10", "author": "A. Liang",
    "change": "Draft generated from uploaded document \"sample-receipt-form.pdf\" via AI-assisted conversion." } ],
  "pages": [ { "id": "p1", "title": "Page 1", "fields": [ "..." ] } ] }
```
