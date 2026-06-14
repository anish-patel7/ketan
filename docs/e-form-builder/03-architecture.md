# System Architecture

Deliverable **(3)**. Three views: logical, component, and deployment (production target).
The prototype implements the full logical and component architecture client-side; the
deployment view shows how the same components map onto a production service
topology.

## 1. Logical Architecture

```mermaid
graph TB
    subgraph "Presentation Layer (src/app/form-creation/**)"
        Library["Form Library (page.tsx)"]
        Dashboard["Dashboard"]
        Builder["Builder ([id]/page.tsx + palette/canvas/properties-panel)"]
        Instances["Issued Instances"]
        Execute["Execution ([instanceId])"]
        Print["Print / PDF ([id])"]
        Audit["Audit Trail"]
        Upload["New from Document"]
    end

    subgraph "Shared Engine Layer"
        FieldRenderer["shared/FieldRenderer.tsx\n(edit + print modes, 24 field types)"]
        FormUtils["formUtils.ts\n(lifecycle maps, evalFormula,\nweighResult/phResult, evaluateVisibility,\nsimulateInstrumentCapture, getMasterAutoFill)"]
    end

    subgraph "Domain / Data Access Layer"
        Store["store.ts\n(FormTemplate CRUD + SEED + normalizeForm)"]
        InstancesData["instances.ts\n(FormIssuedInstance CRUD + issuance numbering)"]
        FormAudit["formAudit.ts\n(append-only AuditEvent log)"]
        MasterData["masterData.ts\n(Project/Sample/Instrument/User master)"]
    end

    subgraph "Persistence (prototype)"
        LS[("localStorage:\nlims-form-templates\nlims-form-instances\nlims-form-instance-counters\nlims-form-audit")]
    end

    Library --> Store
    Library --> FormUtils
    Library --> InstancesData
    Library --> FormAudit
    Library --> MasterData

    Dashboard --> Store
    Dashboard --> InstancesData
    Dashboard --> FormAudit
    Dashboard --> FormUtils
    Dashboard --> MasterData

    Builder --> Store
    Builder --> FormUtils
    Builder --> FieldRenderer

    Instances --> InstancesData
    Instances --> FormUtils

    Execute --> InstancesData
    Execute --> FormAudit
    Execute --> FormUtils
    Execute --> FieldRenderer
    Execute --> MasterData

    Print --> Store
    Print --> InstancesData
    Print --> FormUtils
    Print --> FieldRenderer

    Audit --> FormAudit
    Audit --> Store
    Audit --> InstancesData
    Audit --> FormUtils

    Upload --> Store
    Upload --> MasterData
    Upload --> FormUtils

    FieldRenderer --> FormUtils
    FieldRenderer --> MasterData

    Store --> LS
    InstancesData --> LS
    FormAudit --> LS
```

### Key architectural decisions

- **Single shared rendering engine.** `FieldRenderer` is the only place that knows how
  to draw each of the 24 `FieldType`s. It is parameterised by `mode: 'edit'|'print'`
  and used unmodified by the Builder's Preview, the Execution screen, and the Print
  engine — eliminating triplicated rendering logic and guaranteeing visual/behavioural
  parity between "what you design", "what you fill in" and "what you print".
- **Single source of truth for taxonomies.** `formUtils.ts` centralises every
  label/colour/transition map (`STATUS_LABEL`/`STATUS_STYLE`/`STATUS_FLOW`/`TONE_STYLE`,
  `INSTANCE_STATUS_LABEL`/`INSTANCE_STATUS_STYLE`, `AUDIT_CATEGORY_LABEL`/`_COLOR`) so the
  Form Library, Builder, Dashboard, Instances and Audit Trail never disagree on what a
  status means or looks like.
- **Snapshot-on-issue.** `issueForm()` copies the template's `pages`/`header`/`footer`/
  `orientation` into the new `FormIssuedInstance`. The Print engine and Execution screen
  always prefer the **instance's own snapshot** over the live template
  (`instance?.pages ?? form?.pages`), so later template edits cannot retroactively
  change a document that has already been issued/executed/printed.
- **Append-only audit log as a side effect, not an afterthought.** Every mutating
  action in the Form Library, Builder (Page Setup), and Execution screen calls
  `logAuditEvent()` in the same handler that performs the mutation — there is no
  separate "audit sync" step to forget.

## 2. Component / Module Architecture

```mermaid
graph LR
    subgraph Builder["/form-creation/builder/[id]"]
        BP[page.tsx\nshell, DnD, top bar]
        PAL[palette.tsx\nPALETTE, createField]
        CAN[canvas.tsx\nFormCanvas, SortableFieldCard]
        PROP[properties-panel.tsx\nPropertiesPanel +\nVisibilityRuleEditor,\nDynamicTableProperties, ...]
        PREV[preview-modal.tsx]
        META[meta-modal.tsx]
        PSM[page-setup-modal.tsx]
        BP --> PAL
        BP --> CAN
        BP --> PROP
        BP --> PREV
        BP --> META
        BP --> PSM
    end

    FR[shared/FieldRenderer.tsx]
    FU[formUtils.ts]

    PREV --> FR
    CAN --> PAL

    subgraph AppShell["AppLayout (sidebar/topbar)"]
        Nav["MODULES: Form Creation\n(Dashboard, Issued Instances,\nNew from Document, Audit Trail)"]
    end

    BP -.routes.-> AppShell
```

The Builder itself is split into focused files so that the field-type matrix (palette
defaults, canvas badges, properties editors) can grow without the orchestration shell
(`page.tsx`) growing in lockstep.

## 3. Deployment Architecture (Production Target)

```mermaid
graph TB
    Browser["Analyst / Reviewer / QA Browser\n(Next.js client — same UI components\nas the prototype)"]

    subgraph "Application Tier"
        WebApp["Next.js App (App Router,\nSSR for list/detail pages)"]
        API["Forms API\n(templates, instances, audit,\nmaster-data proxy)"]
        PDFSvc["PDF Render Service\n(headless Chromium against the\nsame print route + CSS)"]
        OCRSvc["Document Conversion Service\n(OCR + layout/field classification)"]
    end

    subgraph "Platform Services"
        IdP["SSO / OIDC / LDAP\n(identity, roles)"]
        DB[("Relational DB\nforms, versions, instances,\nsignatures, audit, master data")]
        Files[("Object storage\nuploaded source docs, attachments,\narchived PDFs")]
    end

    subgraph "Lab Integration"
        Mid["Instrument Middleware\n(per-type drivers/adapters)"]
        Instr["Balances / HPLC / LC-MS/MS / GC /\nDissolution / UV / pH / Moisture"]
        LIMSCore["LIMS Core Modules\n(Projects, Samples, Instruments, Users)"]
    end

    Browser <--> WebApp
    WebApp <--> API
    Browser -. "print preview / save as PDF" .-> WebApp
    API --> PDFSvc
    API --> DB
    API --> IdP
    API --> Files
    API <--> Mid
    Mid <--> Instr
    API <--> LIMSCore
    Browser -- "upload document" --> OCRSvc
    OCRSvc --> API
    OCRSvc --> Files
```

### Mapping prototype → production

| Prototype module | Production component |
|---|---|
| `store.ts` (`localStorage` templates) | Forms API `/templates` + DB `form_templates`/`form_versions` tables |
| `instances.ts` (`localStorage` instances + counters) | Forms API `/instances` + DB `form_instances` table with a DB sequence per `(form_no, major_version, year)` |
| `formAudit.ts` (`localStorage` audit log) | Forms API `/audit-events` + append-only DB table (no UPDATE/DELETE grants) |
| `masterData.ts` (seeded arrays) | Read-through proxy to LIMS Core (Projects/Samples/Instruments/Users) |
| `simulateInstrumentCapture` | Instrument Middleware adapters (one per `InstrumentType`) — see [`09-instrument-integration.md`](./09-instrument-integration.md) |
| `upload/page.tsx` "AI" simulation | Document Conversion Service (OCR + ML field classification) producing the same draft-`FormTemplate` shape |
| `print/[id]/page.tsx` + `window.print()` | Same route rendered headlessly by the PDF Render Service for archival PDFs, in addition to interactive client print |
| Hardcoded `CURRENT_USER` | SSO/OIDC session, role drives `STATUS_FLOW`/signature-meaning availability |
