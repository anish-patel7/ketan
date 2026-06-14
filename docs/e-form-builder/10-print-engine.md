# Print / PDF Engine

Deliverable **(14)**. A **single generic print engine** (`/form-creation/print/[id]`)
renders **every** form template and issued instance — there is no per-form or
per-category print template. This was a deliberate design choice ("generic engine +
apply to all forms") so that any field type, any number of pages, and any
header/footer/orientation configuration produces correct print output automatically,
with zero additional code when a new form or field type is added.

## 1. Route & Inputs

```
GET /form-creation/print/[id]?instance=<instanceId>
```

- `id` (path param) — a `FormTemplate.id`.
- `instance` (optional query param) — a `FormIssuedInstance.id`. When present, the
  instance's **snapshot** is preferred for everything; the template is still loaded as
  a fallback/for status context.

This page is rendered **outside** `AppLayout` (no sidebar) — see `RootLayout`, which
only wraps children in `<AntdRegistry>` — giving a clean, full-width printable surface.

## 2. Data Resolution — Instance-Snapshot-First, Template-Fallback

```ts
const form     = getForm(id);                                  // FormTemplate | null
const instance = instanceId ? getInstance(instanceId) : null;  // FormIssuedInstance | null

const pages       = instance?.pages       ?? form?.pages       ?? [];
const header      = instance?.header      ?? form?.header      ?? DEFAULT_HEADER_FALLBACK;
const footer      = instance?.footer      ?? form?.footer      ?? DEFAULT_FOOTER_FALLBACK;
const orientation = instance?.orientation ?? form?.orientation ?? 'portrait';
const values      = instance?.values      ?? {};
const signatures  = instance?.signatures  ?? {};
const formNo      = instance?.formNo      ?? form?.formNo      ?? '';
const formName    = instance?.formName    ?? form?.name        ?? '';
const version     = instance?.version     ?? form?.version     ?? '';
const contextRef  = instance?.instanceNo  ?? `${formNo} Rev ${version}`;
```

This guarantees:

- **Printing a template directly** (`/print/<formId>`, no `instance`) shows the
  template's current `pages`/`header`/`footer`/`orientation`, with `values`/
  `signatures` empty (a blank form for issuance/reference) and `contextRef = "<FormNo>
  Rev <Version>"`.
- **Printing an issued instance** (`/print/<formId>?instance=<id>`) shows exactly what
  was issued — the instance's own `pages`/`header`/`footer`/`orientation` snapshot —
  populated with the analyst's `values`/`signatures`, and `contextRef = instanceNo`.
  Later edits to the template (even new versions) cannot change this output.
- If neither `form` nor `instance` resolves, a "Form not found" message with a link
  back to the Form Library is shown instead of the print layout.

## 3. Sheet / Page Layout

```
.print-scroll (#EFEAE2 background, scrollable)
  .print-sheet .print-sheet-{portrait|landscape}   (white, 210mm×297mm or 297mm×210mm)
    .print-page  (one per FormPage, 14mm padding)
      .print-watermark?           (absolute, centred, rotated -30deg, if applicable)
      .print-header                (company/logo + form title | Form No/Version/[Instance info])
      .print-page-title            (FormPage.title)
      .print-body                  (FieldRenderer per field, mode="print")
      .print-footer                (audit ref | page numbers + QR + barcode)
    .print-page  (Signatures & Approvals — only if any signature slots exist)
      ... same header/watermark/footer ...
      .print-sig-table
```

`sheetClass = orientation === 'landscape' ? 'print-sheet-landscape' : 'print-sheet-portrait'`.
A `<style>` tag sets `@page { size: A4 ${orientation}; margin: 10mm; }` for the actual
print/PDF output, independent of the on-screen preview sizing.

`totalPages = pages.length + (sigRows.length > 0 ? 1 : 0)` — used for "Page X of Y" in
every page's footer, including the signatures page.

## 4. Watermark Logic (`getWatermark`)

| Condition | Watermark |
|---|---|
| `header.watermarkText` is set (Page Setup override) | that text, verbatim — takes precedence over everything below |
| `instance` present, `status` is `completed` or `approved` | none |
| `instance` present, any other status | `"DRAFT — NOT FINAL"` |
| no `instance`, `form.status === 'obsolete'` | `"OBSOLETE"` |
| no `instance`, `form.status === 'archived'` | `"ARCHIVED"` |
| no `instance`, `form.status !== 'live'` (i.e. draft/under-review/qa-review/approved/effective) | `"DRAFT"` |
| no `instance`, `form.status === 'live'` | none |

Rendered via `.print-watermark`: centred, rotated -30°, 56px, uppercase,
`rgba(155,58,58,0.10)` — visible but unobtrusive, `pointer-events: none`, `z-index: 0`
(behind header/body/footer which are `z-index: 1`).

## 5. Header (`PrintHeader`)

```
┌──────────────────────────────────────────────────────────────────┐
│ [Logo]  Aurora CRO Laboratories          Form No: F-BA-002          │
│         Solution Preparation Log         Version: 1.3               │
│                                            ── if instance ──         │
│                                            Instance: F-BA-002-V01-...│
│                                            Project: PRJ-2026-001 /   │
│                                                      SID-2026-001    │
│                                            Status: In Progress       │
│                                            ── else ──                │
│                                            Status: Live              │
└──────────────────────────────────────────────────────────────────┘
```

- `.print-logo` (44×44px, accent background, company initial) renders only if
  `header.showLogo`.
- `.print-company` shows `header.companyName`; `.print-form-title` shows the form
  name in DM Serif Display.
- `.print-meta` (right-aligned) always shows Form No. and Version; for instances it
  adds Instance No., Project/Study, and `INSTANCE_STATUS_LABEL[instance.status]`; for
  bare templates it shows `STATUS_LABEL[form.status]`.
- Repeated identically on **every** page (including the signatures page) — a 2px
  bottom border under `.print-header` separates it from the page title/body.

## 6. Body — `FieldRenderer(mode="print")`

Each field on the page is rendered by the same `FieldRenderer` used in Builder Preview
and Execution, with `mode="print"`. Key differences from `mode="edit"`:

| Field type(s) | `edit` mode | `print` mode |
|---|---|---|
| Any input type (`text`, `number`, `date`, `dropdown`, …) | Interactive Ant Design control | Static `ValueBox` showing the captured value (or blank box if no instance) |
| `weigh-slip` / `ph-slip` | Editable input + live `weighResult`/`phResult` badge | Captured value + `ResultBadge` (Pass/Fail/Reweigh) computed from `values` |
| `calculation` | Read-only computed display (live) | Same computed display, evaluated against `values` |
| `table` / `dynamic-table` | Editable grid with add/remove rows | Static grid reflecting captured row data; no add/remove controls |
| `e-signature` | "Click to Sign" button / signed-state card | Signed-state card (`SignatureBlock`) if `signatures[f.id]` exists, else an empty signature box (line for wet-ink fallback) |
| `instrument-capture` | "Capture from Instrument" / captured card | Captured card (value/unit/instrument/timestamp/operator) or empty box |
| `attachment` | File picker | "Attached: `<filename>`" or "(no attachment)" |
| `qrcode` / `barcode` | `QrPattern`/`BarcodePattern` inline | Same — these are inherently "print-ready" placeholders |
| `step-section` | Editable steps with inline fields/attachment/sign-off | Static steps; each `hasSignDate` step renders its own `SignatureBlock` via `signatures["{f.id}_{step.id}__sign"]` |
| `section-header` / `instruction` / `divider` | Layout chrome | Same — these never depend on `values` |

`contextRef` is threaded into `FieldRenderer` so `barcode`/`qrcode` fields (and the
footer, §7) encode the same reference consistently across the document.

## 7. Footer (`PrintFooter`)

```
Ref: F-BA-002-V01-2026-000001          Page 1 of 2   ▤▥▦(barcode) ▤▥▦(QR)
```

- Left: `footer.showAuditRef ? "Ref: ${contextRef}" : ""`.
- Right: `footer.showPageNumbers ? "Page {pageNo} of {totalPages}" : ""`, followed by
  `footer.showQrCode ? <BarcodePattern + QrPattern> : null`.
- Repeated identically on every page (each with its own `pageNo`).

### QR / Barcode placeholders

`QrPattern({ seed, size })` and `BarcodePattern({ value })` (`shared/FieldRenderer.tsx`,
exported for reuse) generate **deterministic** CSS-grid/flex patterns from a string
seed (`contextRef`) using a simple multiplicative hash — same seed always produces the
same pattern, different documents produce visibly different patterns, without any
external QR/barcode library. `QrPattern` forces the four corner 2×2 blocks "on" (like
real QR finder patterns) for visual authenticity.

> **Production**: replace with a real QR/barcode renderer encoding, e.g., the
> instance's canonical URL (`https://lims/.../execute/<instanceId>`) or
> `contextRef`, so a phone scan or warehouse scanner resolves directly to the record.

## 8. Signatures & Approvals Page (`collectSignatureSlots`)

If `pages` contain any `e-signature` fields or `step-section` steps with
`hasSignDate: true`, an appended page lists every such slot in document order:

```ts
type SigRow = { signKey: string; label: string; role?: string };
// e-signature field f      -> { signKey: f.id, label: f.label, role: f.signatureRole }
// step-section step (hasSignDate) -> { signKey: `${f.id}_${step.id}__sign`, label: step.title, role: 'Analyst' }
```

Rendered as `.print-sig-table`:

| Signature For | Role | Name | Meaning | Timestamp |
|---|---|---|---|---|
| Prepared By | Prepared By | A. Liang | Performed By | 2026-06-10 14:05 |
| Verified By | Verified By | — Not signed — | — | — |

Unsigned slots show `"— Not signed —"` / `"—"` / `"—"` rather than being omitted —
making outstanding sign-offs visible on the printed/PDF record itself.

## 9. Toolbar & Output

```
[← Back]   Print Preview — {formName} ({instanceNo} | {formNo} v{version})   [Audit Trail]?  [🖶 Print / Save as PDF]
```

- `.no-print` — hidden entirely under `@media print` (`display: none !important`).
- **Audit Trail** button (instances only) → `/form-creation/audit?instanceId=<id>`.
- **Print / Save as PDF** → `window.print()`. Browsers' native "Save as PDF" print
  destination produces the archival PDF in the prototype.
- `@media print` also: removes the `.print-scroll` background/padding, removes the
  `.print-sheet` box-shadow/margins, and sets `break-after: page` on every `.print-page`
  except the last — one PDF page per `FormPage` (plus the signatures page).

## 10. Production Extension

The same route, with the same `id`/`instance` params, would be rendered headlessly
(e.g. via a headless-Chromium PDF service) to produce archival PDFs on:

- Issuance (a "blank issued copy" PDF attached to the instance record), and/or
- Completion (a "final executed record" PDF attached for long-term retention),

with no changes to the rendering code — only an additional invocation path that
navigates to `/form-creation/print/<id>?instance=<instanceId>` and captures the
resulting page to PDF instead of opening the browser's print dialog. This keeps the
interactive preview and the archival PDF byte-for-byte consistent
([`02-srs.md`](./02-srs.md) NFR-M.1, "single shared rendering engine").
