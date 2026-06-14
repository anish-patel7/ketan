# Screen Designs

Deliverables **(5)** UI wireframes, **(10)** Builder screen design, **(11)** Execution
screen design. ASCII wireframes of every screen in the module, in the order a user
would typically encounter them. All screens except Print run inside `AppLayout`
(sidebar + topbar); Print is a standalone full-page layout.

## 1. Form Library — `/form-creation`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Form Creation                                          [+ New Form]           │
│ Design GxP-compliant data capture forms — worksheets, logs, ...               │
│                                                                                 │
│ [Dashboard] [Issued Instances] [Audit Trail] [New from Document]              │
│                                                                                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                          │
│ │   4      │ │   3      │ │   0      │ │   1      │                          │
│ │ TOTAL    │ │ LIVE     │ │ IN REVIEW│ │ DRAFT    │                          │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘                          │
│                                                                                 │
│ [Search by name or Form No...] [Category v] [Department v] [Status v]        │
│ ┌───────────────────────────────────────────────────────────────────────────┐│
│ │ FORM NO.  | NAME                 | CATEGORY  | DEPT | PAGES| VER | STATUS  ││
│ │ F-BA-001  | Sample Extraction... | Worksheet | BA   |  2   |2.1  | LIVE    ││
│ │           [Design] [Mark Obsolete] [Issue] [Copy] [Trash]                  ││
│ │ F-BA-002  | Solution Prep Log    | Log Sheet | BA   |  1   |1.3  | LIVE    ││
│ │           [Design] [Mark Obsolete] [Issue] [Copy] [Trash]                  ││
│ │ F-CL-001  | Sample Receipt Chk.  | Checklist | CL   |  1   |1.0  | LIVE    ││
│ │           [Design] [Mark Obsolete] [Issue] [Copy] [Trash]                  ││
│ │ F-FR-001  | Freezer Temp Log     | Log Sheet | FR   |  1   |1.0  | DRAFT   ││
│ │           [Design] [Submit for Review] [Copy] [Trash]                      ││
│ └───────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

Notes:
- Row actions are driven entirely by `STATUS_FLOW[row.status]` — the buttons shown
  above for `LIVE`/`DRAFT` rows differ accordingly (see
  [`05-workflows-and-approvals.md`](./05-workflows-and-approvals.md) §1).
- "Issue" only appears for `LIVE` rows and opens the **Issue Form to Project** modal
  (project picker over `PROJECT_MASTER`).

## 2. Dashboard — `/form-creation/dashboard`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Form Builder Dashboard                              [Form Library]            │
│ 4 form templates · 1 issued instance · 12 audit events logged                │
│                                                                                 │
│ ┌────────────┐┌────────────┐┌────────────┐┌────────────┐┌────────────┐┌─────┐│
│ │ 1          ││ 0          ││ 0          ││ 3          ││ 1          ││ 0   ││
│ │ DRAFT    → ││ PENDING  → ││ PENDING  → ││ EFFECTIVE/ ││ ISSUED   → ││OBS/ ││
│ │            ││ REVIEW     ││ QA APPROVAL││ LIVE    →  ││ INSTANCES  ││ARCH→││
│ └────────────┘└────────────┘└────────────┘└────────────┘└────────────┘└─────┘│
│                                                                                 │
│ Full Lifecycle Breakdown                                                       │
│ [Draft 1] [Under Review 0] [QA Review 0] [Approved 0] [Effective 0]          │
│ [Live 3] [Obsolete 0] [Archived 0]                                            │
│                                                                                 │
│ 🛡 Compliance Snapshot — ALCOA+ / 21 CFR Part 11                              │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                           │
│ │ Attributable │ │ Legible      │ │Contemporaneous││  (3x3 grid — 9 ALCOA+   │
│ │ 4/4 e-sig... │ │ All data...  │ │ Field values..││   principles, see       │
│ ├──────────────┤ ├──────────────┤ ├──────────────┤│   07-audit-trail-and-   │
│ │ Original     │ │ Accurate     │ │ Complete     ││   part11.md §5)         │
│ ├──────────────┤ ├──────────────┤ ├──────────────┤│                         │
│ │ Consistent   │ │ Enduring     │ │ Available    ││                         │
│ └──────────────┘ └──────────────┘ └──────────────┘                           │
│                                                                                 │
│ ⚡ Recent Activity                              [View Full Audit Trail]       │
│ ┌───────────────────────────────────────────────────────────────────────────┐│
│ │ [E-Signature]      F-BA-002-...001 — "Prepared By" signed by A. Liang...  ││
│ │ [Instr. Capture]   Captured 50.12 mg from BAL-001 ...                     ││
│ │ [Form Issued]      Issued F-BA-002-V01-2026-000001 for project PRJ-2026-001││
│ │ ...                                                            (up to 8)   ││
│ └───────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

Every KPI card and lifecycle pill is a link (`router.push`) into the Form Library
(pre-filtered by `?status=`) or Issued Instances.

## 3. Builder — `/form-creation/builder/[id]`

Dark top bar over a light 3-panel workspace.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Form Library │ Solution Preparation Log  F-BA-002  [LIVE]      1 page·v1.3 │
│                                       [Page Setup] [Preview] [Save Draft]     │
│                                       [Mark Obsolete]   <- STATUS_FLOW button │
├───────────────┬─────────────────────────────────────────────┬───────────────┤
│ FIELD PALETTE │ CANVAS                                        │ PROPERTIES     │
│               │ ┌───────────────────────────────────────────┐│                │
│ Basic         │ │ [Page 1: Solution Details] [+ Add Page]    ││ (no field      │
│  Text         │ ├───────────────────────────────────────────┤│  selected —    │
│  Number       │ │ ⠿ Solution Name              [text] ✕     ││  panel empty   │
│  Date         │ │ ⠿ Lot / Batch No.            [text] ✕     ││  or shows       │
│  ...          │ │ ⠿ Preparation Date           [date] ✕     ││  "Select a      │
│ Lab Specific  │ │ ⠿ Active Ingredient    [weigh-slip] ✕     ││  field")       │
│  Weigh Slip   │ │     target 50mg · tol 98–102%              ││                │
│  pH Slip      │ │ ⠿ Solvent                [dropdown] ✕     ││ When a field   │
│  Calculation  │ │ ⠿ Final Volume             [number] ✕     ││ IS selected:   │
│  Barcode      │ │ ⠿ % Accuracy            [calculation] ✕  ││  Label         │
│ Smart Fields  │ │     = ({Actual Weight}/{Target Weight})*100││  Required      │
│  Sample ID    │ │ ⠿ Prepared By           [e-signature] ✕  ││  Placeholder    │
│  Project ID   │ │                                            ││  Help text      │
│  Instrument   │ │              (drag to reorder ⠿)           ││  ── type-       │
│  Instr.Capture│ │                                            ││  specific ──    │
│  User Field   │ │                                            ││  Visibility     │
│  Attachment   │ │                                            ││  rule (eye-off  │
│  QR Code      │ │                                            ││  badge on       │
│  Dynamic Table│ │                                            ││  canvas if set) │
│ Layout        │ │                                            ││                │
│  Section Hdr  │ │                                            ││                │
│  Instruction  │ │                                            ││                │
│  Divider      │ │                                            ││                │
│  Table        │ │                                            ││                │
│  Step Section │ │                                            ││                │
│ Compliance    │ │                                            ││                │
│  E-Signature  │ │                                            ││                │
│  Timestamp    │ │                                            ││                │
│  Initials     │ │                                            ││                │
└───────────────┴─────────────────────────────────────────────┴───────────────┘
```

- **Palette** (`palette.tsx`): 5 groups, drag source for `@dnd-kit`. Each item shows a
  drag overlay (`PaletteDragOverlay`) while dragging.
- **Canvas** (`canvas.tsx`): sortable list of `SortableFieldCard`s per page; each card
  shows label, type badge, a type-specific summary line (e.g. weigh-slip
  target/tolerance, calculation formula), a delete (✕) button, and — if
  `visibilityRule` is set — an eye-off badge.
- **Properties panel** (`properties-panel.tsx`): contextual editor for the selected
  field; always ends with the `VisibilityRuleEditor` (any field type) and, for
  `dynamic-table`, `DynamicTableProperties` (min/max rows, sub-table columns).
- **Top bar**: form name/Form No./status badge (click → `meta-modal.tsx`), page/version
  counts, **Page Setup** (`page-setup-modal.tsx`), **Preview** (`preview-modal.tsx`,
  built on `FieldRenderer`), **Save Draft**, and the live `STATUS_FLOW` action
  button(s) for the current status.

### 3a. Page Setup Modal

```
┌─ Page Setup ─────────────────────────────────────────────────────────────┐
│ Page Layout                                                                │
│  Orientation:  (●) Portrait   ( ) Landscape                               │
│                                                                             │
│ Header                                                                     │
│  Company Name: [Aurora CRO Laboratories            ]                      │
│  Show Logo:    [x]                                                        │
│  Watermark Text (overrides status watermark): [                ]          │
│                                                                             │
│ Footer                                                                     │
│  Page Numbers: [x]   QR Code: [x]   Audit Reference: [x]                  │
│                                                                             │
│ Revision History                                                           │
│ ┌─────────┬────────────┬───────────────┬───────────────────┬───────────┐ │
│ │ Version │ Date       │ Author        │ Change Description│ Chg Ctrl  │ │
│ │ 1.0     │ 2026-02-20 │ Dr. R. Patel  │ Initial release.  │ —         │ │
│ │ 1.3     │ 2026-03-18 │ Dr. R. Patel  │ Added % accuracy..│ —         │ │
│ └─────────┴────────────┴───────────────┴───────────────────┴───────────┘ │
│                                                                             │
│  [Create New Version]   — or, if a newer draft exists —                  │
│  ⓘ A newer version (v1.4) already exists in draft.                       │
│                                                                             │
│                                                       [Close]              │
└─────────────────────────────────────────────────────────────────────────┘
```

"Create New Version" opens a sub-modal: **New Version Number** (pre-filled via
`suggestNextVersion`), **Change Description**, **Change Control Reference** (optional).

## 4. Issued Instances — `/form-creation/instances`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Issued Instances                                       [Form Library]         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                          │
│ │   1      │ │   1      │ │   0      │ │   0      │                          │
│ │ TOTAL    │ │ OPEN     │ │ UNDER REV│ │ COMPLETED│                          │
│ │ ISSUED   │ │          │ │          │ │          │                          │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘                          │
│                                                                                 │
│ [Search...] [Status v]                                                        │
│ ┌───────────────────────────────────────────────────────────────────────────┐│
│ │ INSTANCE NO.              | FORM      | PROJECT     | STATUS  | ISSUED BY  ││
│ │ F-BA-002-V01-2026-000001  | F-BA-002  | PRJ-2026-001| IN PROG.| A. Liang   ││
│ │                            [Execute] [Print] [Audit Trail]                ││
│ └───────────────────────────────────────────────────────────────────────────┘│
│                                                                                 │
│ (empty state: "No issued instances yet. Go to Form Library to issue a form.") │
└─────────────────────────────────────────────────────────────────────────────┘
```

`Execute` opens the instance in the Execution screen if `status !== 'completed' &&
status !== 'approved'`, else opens it read-only ("View").

## 5. Execution Screen — `/form-creation/execute/[instanceId]`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ F-BA-002-V01-2026-000001                              [IN PROGRESS]           │
│ Solution Preparation Log · F-BA-002 v1.3 · PRJ-2026-001 — Metformin BE Study  │
│                                                                                 │
│ [Print] [Audit Trail]                    [Save Progress] [Submit for Review] │
│ ──────────────────────────────────────────────────────────────────────────── │
│ [Page 1: Solution Details]   (page tabs shown only if >1 page)               │
│                                                                                 │
│  Solution Name *        [________________________]                            │
│  Lot / Batch No. *      [________________________]                            │
│  Preparation Date *     [____-__-__]                                          │
│                                                                                 │
│  Active Ingredient *  (Weigh Slip)                                            │
│    Target: 50 mg   Tolerance: 98–102%                                         │
│    Actual Weight: [______] mg     [PASS]                                      │
│                                                                                 │
│  Solvent *  [Methanol v]                                                      │
│  Final Volume *  [______] mL                                                  │
│  % Accuracy  (Calculation, read-only)   →  98.50 %                            │
│                                                                                 │
│  Prepared By *  (E-Signature)                                                  │
│    ┌───────────────────────────────────────┐                                 │
│    │  [ Click to Sign ]                     │                                 │
│    └───────────────────────────────────────┘                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5a. E-Signature Modal

```
┌─ Sign: "Prepared By" ──────────────────────────────────────────────────────┐
│ User:               A. Liang (LIMS-USR-0042, Analyst)                       │
│ Meaning of Signature: [Performed By v]   (Performed By / Reviewed By /      │
│                                            Approved By / Witnessed By /      │
│                                            Verified By / Authorised By)      │
│ Reason (optional): [                                            ]            │
│ Password:           [••••]                                                   │
│   (shown after a failed attempt: "Demo password: \"demo\"")                  │
│                                                       [Cancel]  [Sign]        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5b. Instrument Capture (inline, for `instrument-capture` fields)

```
  Centrifuge Speed Reading  (Instrument Capture · balance · mg)
    [ Capture from Instrument ]
    ── after capture ──
    Value: 50.12 mg
    Instrument: BAL-001 — Sartorius MSE Analytical Balance
    Captured: 2026-06-10 14:01:55 by A. Liang
    [ Re-capture ]
```

### 5c. Read-only banner (completed/approved instances)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⓘ This instance is Completed and is now read-only. All values and           │
│   signatures are shown for reference / printing only.                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5d. Under-Review action bar

```
[Print] [Audit Trail]                    [Return to In Progress]  [Approve]
```

## 6. Print Preview — `/form-creation/print/[id]?instance=<id>`

Standalone (no `AppLayout` sidebar). A `.no-print` toolbar plus the printable sheet:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [← Back]   Print Preview — Solution Preparation Log (F-BA-002-V01-2026-000001)│
│                                       [Audit Trail]  [🖶 Print / Save as PDF] │
├─────────────────────────────────────────────────────────────────────────────┤
│  ░░░░░░░░░░░░░░░░░  (diagonal "DRAFT — NOT FINAL" watermark if applicable)   │
│  ┌───┐ Aurora CRO Laboratories          Form No: F-BA-002   Version: 1.3     │
│  │ A │ Solution Preparation Log         Instance: F-BA-002-V01-2026-000001   │
│  └───┘                                  Project: PRJ-2026-001 / SID-2026-001 │
│                                          Status: In Progress                  │
│  Solution Details                                                             │
│  Solution Name: Metformin Std Solution A   Lot/Batch No.: LOT-2026-0451       │
│  Preparation Date: 2026-06-10                                                 │
│  Active Ingredient (Weigh Slip): 50.12 mg  [PASS]  (target 50mg, 98-102%)     │
│  Solvent: Methanol     Final Volume: 50.8 mL     % Accuracy: 98.50 %         │
│  Prepared By: [signed — A. Liang, Performed By, 2026-06-10 14:05]            │
│  ──────────────────────────────────────────────────────────────────────────│
│  Ref: F-BA-002-V01-2026-000001         Page 1 of 2   ▤▥▦ QR ▤▥▦              │
├─────────────────────────────────────────────────────────────────────────────┤
│  (page 2 — Signatures & Approvals)                                            │
│  Signature For  | Role        | Name    | Meaning      | Timestamp           │
│  Prepared By    | Prepared By | A. Liang| Performed By | 2026-06-10 14:05    │
│  ──────────────────────────────────────────────────────────────────────────│
│  Ref: F-BA-002-V01-2026-000001         Page 2 of 2   ▤▥▦ QR ▤▥▦              │
└─────────────────────────────────────────────────────────────────────────────┘
```

See [`10-print-engine.md`](./10-print-engine.md) for the full rendering logic.

## 7. Audit Trail — `/form-creation/audit`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Audit Trail                                              [Dashboard]           │
│ Immutable, append-only record of form lifecycle changes, issuances,          │
│ e-signatures, instrument captures and value corrections                       │
│                                                                                 │
│ ┌──────────┐ ┌──────────────┐ ┌──────────────────┐ ┌──────────────────┐      │
│ │   12     │ │   2          │ │   2              │ │   3              │      │
│ │ TOTAL    │ │ E-SIGNATURES │ │ INSTRUMENT       │ │ LIFECYCLE        │      │
│ │ EVENTS   │ │              │ │ CAPTURES         │ │ CHANGES          │      │
│ └──────────┘ └──────────────┘ └──────────────────┘ └──────────────────┘      │
│                                                                                 │
│ (if filtered)  Filtered to instance F-BA-002-V01-2026-000001 (Solution Prep   │
│                 Log)                                                  [✕ Clear]│
│ [Search detail, actor, form or instance no...] [Category v]                   │
│ ┌───────────────────────────────────────────────────────────────────────────┐│
│ │ TIMESTAMP        | CATEGORY        | REFERENCE        | ACTOR  | DETAIL    ││
│ │ 2026-06-10 14:05 | E-Signature     | F-BA-002-V01-... | A.Liang| "Prepared ││
│ │                  |                 | F-BA-002          |Analyst| By" signed││
│ │ 2026-06-10 14:01 | Instr. Capture  | F-BA-002-V01-... | A.Liang| Captured  ││
│ │ ...                                                                         ││
│ └───────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

## 8. New from Document — `/form-creation/upload`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ New Form from Document                            [Back to Form Library]      │
│ Upload an existing paper form, SOP or protocol and generate a draft template  │
│                                                                                 │
│ ⓘ In this demo, the uploaded document is not parsed. Instead, a starter form │
│   structure — header, key fields, and signatures — is generated based on the │
│   category you select below, ready for refinement.                            │
│                                                                                 │
│ ┌────────────────────────────────┐  ┌──────────────────────────────────────┐│
│ │ Source Document                  │  │ Draft Form Details                   ││
│ │ ┌──────────────────────────────┐│  │ Form Name: [Sample Receipt Form    ] ││
│ │ │  ☁  Click or drag a file to   ││  │ Category: [Checklist v]  Dept:[CL v] ││
│ │ │     this area to upload       ││  │ Description (optional):              ││
│ │ │  Supports PDF, Word, scanned  ││  │ [                                  ] ││
│ │ │  images                        ││  │                                       ││
│ │ └──────────────────────────────┘│  │                                       ││
│ │ 📄 sample-receipt-form.pdf  [✕]  │  │                                       ││
│ └────────────────────────────────┘  └──────────────────────────────────────┘│
│                                                                                 │
│                                          [✨ Generate Draft with AI]           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Generation progress modal

```
┌─ Generating Draft Form… ────────────────────────────────────────────────────┐
│ [██████████████████████░░░░░░░░░░] 60%                                       │
│  ✓ Uploading document                                                         │
│  ✓ Analyzing page layout                                                      │
│  ✓ Detecting fields & sections                                                │
│  ▸ Mapping fields to LIMS data types                                          │
│    Generating draft form                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

On completion, the new draft template opens directly in the Builder for refinement.
