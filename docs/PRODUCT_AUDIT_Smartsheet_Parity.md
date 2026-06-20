# DrainSheets — Product Audit & Smartsheet Competitive Analysis

**Author:** Senior product architect / UX researcher / CRE workflow analyst / software auditor
**Date:** June 18, 2026
**Inputs analyzed:** (1) Screen recording of a live CRE broker using Smartsheet (`IMG_9243.MOV`, 2:17, 137 frames examined); (2) full DrainSheets codebase (`src/`, `supabase/`, `docs/`, `scripts/`, `tests/`); (3) DrainSheets PRD, roadmap, schema, permissions model, beta readiness report.

**Method:** The video was decomposed frame-by-frame and every readable screen state was inventoried. The codebase was verified by reading the actual route tree, server actions, RLS migrations, and React components — *not* by trusting the docs. Where the docs claim a feature is "complete," that claim was checked against implementation. Findings below distinguish what is *real in code* from what is *aspirational in docs*.

> **Bottom line up front:** DrainSheets is a genuinely competent, security-hardened CRE CRM that has *already implemented far more Smartsheet-flavored UX than its own PRD scoped* (grid, attachments panel, share/manage-access dialogs, recents, favorites). It is **not** a generic spreadsheet and should not try to be. Against the broker's *actual observed workflow*, it is roughly **two-thirds of the way to parity**, blocked by three concrete, nameable gaps: **document preview, send-update-by-email, and workspace/folder organization** — plus the unglamorous but decisive **data import** problem (you cannot leave Smartsheet if you can't get your data out of it). It is ready for personal use and an internal/staging beta today; it is **not** ready for a paying brokerage pilot until those gaps and production infrastructure are closed.

---

## Phase 1 — Smartsheet Video: Complete Feature Inventory

The recording is a phone capture of a Lenovo ThinkPad running Smartsheet in Chrome. The user is a commercial real estate broker on the "RIPCO" / "A-Team" team (org domain `ripcony.com`), working tenant-prospecting and property-deal sheets. The entire session is a single coherent CRE workflow: *find a sheet → review the grid → share it → open a row's attachments → preview a marketing document → send a quick email update.*

### 1.1 Observed screens & actions, in sequence

| Time | Screen / action | What the user is doing |
|------|-----------------|------------------------|
| 0:00–0:19 | **Smartsheet Home** — tabs `Recents · Favorites · Workspaces · Portfolios (New)`; Recents list with Name + Location (workspace) + "last opened" timestamp | Locating a working sheet from recent activity |
| 0:09 | **`+ Create` menu** open — `Sheet, Report, Dashboard, Form, Import`; `New location: Workspace`; `More options`; "Select a location" | Inspecting create options (not completed) |
| ~0:20–0:27 | Opened **"2026 Luxury Retail Tenant Prospects"** sheet in **Grid view** | Reviewing a tenant-prospect list |
| ~0:24 | Grid columns: `Tenant/Company · Use · Website · Contact Name · Title` + comment column; rows: Aritzia, Burberry, Fabletics, Gucci, Sézane, Cartier, Van Cleef & Arpels, Bulgari (luxury retail tenants) with named contacts/titles | Reading CRM data (company → category → website → contact → title) |
| ~0:24 | Sheet chrome: tabs `File · Automation · Forms · Connections · Dynamic View`; toolbar `Grid view selector · Filter · font · size · B/I/U/S · fill · font color · alignment`; right icon rail (comments, attachments, proofs, card view); favorite ★ by title; green **Share** button; seat-license banner | Observing full Smartsheet sheet toolbar |
| ~0:28–0:31 | **Share dialog** — "Share '2026 Luxury Retail Tena…'"; *Add people by name, email or group*; *Manage access* (avatars + "Alexis Fiore… and others", `Manage >`); *General access: Restricted* dropdown; *Copy link*; *Done* | Sharing a sheet |
| ~0:33–0:44 | **Manage access** panel — per-user rows with roles: `afiore@ripcony.com (Owner)`, Alexis Fiore-Wilkinson (Admin), Jacob Schneider (Admin), Joe Amecangelo (Admin), Kelly Thomas (Admin), Patricia AmecAngelo (Admin); per-row permission dropdowns; Copy link; Done | Reviewing/adjusting who has access and at what level |
| ~0:45–0:52 | Back to **Home → Workspaces** left nav tree | Navigating between sheets via workspace tree |
| ~0:53–0:96 | **Browse** view (`/browse/workspaces/…`) — left tree `WorkApps · Scenario Plans · Sheets · Workspaces`; expanded workspace **A-TEAM Master INFO** → nested workspaces (`A-Team Franchisee Pipeline`, `A-Team Master Contact Database`); **Favorites (9)** list; workspace contents grid (`Name · Sharing · Owner · Last Updated`); right panel **Workspace Shared To** (Owner/Admin/Editor rows) | Browsing the workspace hierarchy; sharing at workspace level |
| ~0:53–0:96 | Multiple sheets opened (RIPCO-branded), more **Manage access** scrolling through a long shared-user list | Repeated collaboration / access management |
| ~1:53–2:08 | **"Michael Grillo Real Estate Search"** sheet — columns `Property Address · Purchase Price / PPSF · NNN Expenses`; row "675 Oceanport Way – The Commissary, $18.45 PSF, $7.70/SF NNN" | Reviewing a property/deal sheet (CRE deal economics) |
| ~1:53–2:08 | **Attachments panel** (right) — tabs `Row · Sheet · All`; "Row 2: 675 Oceanport Way – The Commissary"; `Actions ▾`; sort `Uploaded (newest)`; attachment rows (PDF icon, filename, `Row 2` tag, timestamp, "by Ke…"); files incl. **`OM 675 Oceanport Way.pdf`** (OM = Offering Memorandum); **`Attach Files to Row 2`** button | Managing row-level documents |
| ~2:00–2:07 | **Document preview** (full viewer) — renders the OM cover ("Cushman & Wakefield's Private Capital Group Presents For Sale: THE COMMISSARY, 675 OCEANPORT WAY"); controls `zoom-out · 100% · zoom-in · download · delete`; **`Version 1 ▾`** dropdown; metadata sidebar (*Description* editable, *Filename*, *File size 10.06 MB*, *Date uploaded Apr 28 2026*, *Created by Kelly Thomas*) | Previewing a marketing PDF inside the app, with versioning + metadata |
| ~2:09–2:17 | **Send (row by email)** dialog — `To` (with contact picker), `Subject` prefilled "Quick Update: 675 Oceanport Way – The Commissary", `Message` prefilled, `Cc me`, `Include: all columns, attachments, comments — Edit`, `Layout: Horizontal / Vertical`, `Cancel / Send` | Emailing a row's data + attachments to someone, from inside Smartsheet |

### 1.2 Feature inventory with frequency / criticality / CRE-specificity

| # | Feature observed | User goal | Freq. | Core vs. secondary | CRE-specific or generic |
|---|------------------|-----------|-------|--------------------|--------------------------|
| V1 | Recents list (home) | Resume work fast | Very high | Core | Generic |
| V2 | Favorites / starred sheets | Pin frequently-used sheets | High | Core | Generic |
| V3 | Workspaces + Browse tree | Organize many sheets into a hierarchy | High | Core | Generic |
| V4 | `+ Create` menu (Sheet/Report/Dashboard/Form/Import/Workspace) | Make new artifacts | Medium | Mixed | Generic |
| V5 | Grid view of records | Read/scan CRM data | Very high | Core | Generic (data is CRE) |
| V6 | CRE columns: Company, Use, Website, Contact, Title | Tenant prospecting | Very high | Core | **CRE-specific** |
| V7 | CRE columns: Property Address, Purchase Price/PPSF, NNN Expenses | Deal underwriting | High | Core | **CRE-specific** |
| V8 | Filter / sort | Narrow large lists | High | Core | Generic |
| V9 | Cell formatting toolbar (font/size/B-I-U/colors/align) | Visual emphasis | Low–medium | Secondary | Generic (spreadsheet bloat) |
| V10 | Inline cell editing | Edit data in place | High (implied) | Core | Generic |
| V11 | Share dialog (add by email, copy link, general access) | Grant access | High | Core | Generic |
| V12 | Manage access (per-user roles: Owner/Admin/Editor/Viewer) | Control permissions | High | Core | Generic |
| V13 | Workspace-level sharing | Bulk-share a folder of sheets | Medium | Core | Generic |
| V14 | Row-level Attachments panel (Row/Sheet/All scope) | Attach files to a record | Very high | **Core** | Generic mechanism, CRE content |
| V15 | Attachment metadata (size, uploader, date, description) | Document hygiene | Medium | Secondary | Generic |
| V16 | **In-app document preview (PDF viewer + zoom)** | Read an OM/flyer without leaving the app | **Very high** | **Core** | Generic mechanism, **critical for CRE (OMs, flyers, site plans)** |
| V17 | Document versioning (`Version 1 ▾`) | Track revisions of a doc | Low–medium | Secondary | Generic |
| V18 | Download / delete attachment | File management | High | Core | Generic |
| V19 | **Send row by email (Subject/Message/Include/Layout)** | Send a "quick update" to a colleague/client | **High** | **Core** | Generic mechanism, **central to broker comms** |
| V20 | Row comment / discussion column (💬) | Per-record collaboration | Medium | Core | Generic |
| V21 | Seat/license management banner | Billing/seats | n/a (Smartsheet pain point — the *reason* for this project) | — | Generic |
| V22 | `Automation · Forms · Connections · Dynamic View · Report · Dashboard · Portfolios · WorkApps · Scenario Plans` | Enterprise power features | Not used in video | Secondary | Generic **bloat** for this user |

The user touched **none** of the enterprise power-feature surfaces (Automation, Forms, Connections, Dynamic View, Reports, Dashboards, Portfolios, WorkApps, Scenario Plans) except to scroll past them. This is the single most important signal in the video: **the broker's real job is grid + attachments + sharing + email — not spreadsheet automation.** That validates DrainSheets' core thesis.

---

## Phase 2 — DrainSheets Audit (verified against implementation)

Everything below was confirmed by reading source, not docs.

### 2.1 Routes / pages (App Router — verified in `src/app`)

- **Auth** (`(auth)/`): `login`, `signup`, `forgot-password`, `reset-password`, `auth/callback` (OAuth). Google + email/password both wired.
- **Dashboard group** (`(dashboard)/`) with `layout.tsx` (icon rail + header), `loading.tsx`, `error.tsx`:
  - `/` → **Recents** page (landing) — *not* a stats dashboard; the KPI/activity dashboard content lives in components but the home route is Recents-first, mirroring Smartsheet.
  - `/properties` (list), `/properties/new`, `/properties/[id]` (the "open sheet" experience), `/properties/[id]/edit`, `/properties/[id]/prospects/new`
  - `/prospects` (list), `/prospects/[id]`, `/prospects/[id]/edit`, `/prospects/[id]/contacts/new`
  - `/contacts` (global list), `/contacts/[id]`, `/contacts/[id]/edit`
  - `/documents` (global list), `/documents/[id]` (metadata detail — **no preview**)
  - `/search`
  - `/settings`, `/settings/users`
- **API:** `/api/health`.

### 2.2 Database schema (verified in `supabase/migrations`, 20 migrations)

Tables: `organizations, profiles, properties, prospects, contacts, documents, notes, property_assignments, invitations, activity`. Enums: `user_role (owner|admin|editor)`, `user_status (active|invited|disabled)`, `property_status (active|archived)`, `prospect_status (researching|contacted|interested|passed|closed)`. CRE fields present on `properties` (address/city/state) and `prospects` (company_name/category/website/status/comments). Full-text search (GIN) + `search_global` RPC. Private `documents` storage bucket with storage RLS. Auth triggers enforce invite-only signup. Migrations include three RLS bug-fixes and one security fix (`prevent_editor_archive_rls`), indicating real iterative hardening.

### 2.3 Permissions (verified in migrations + `src/lib/permissions/*` + `tests/rls`)

Three roles enforced at **three layers**: Postgres RLS (`has_role`, `is_org_member`, `can_access_property`), server-action guards (`requireProfile`, `requireOwner`), and UI hiding. Editors are scoped to assigned properties via `property_assignments`. An RLS integration suite (`tests/rls/integration.test.ts`) is reported passing 13/13. This is materially more rigorous than typical MVPs.

### 2.4 CRUD flows (verified in `src/actions/*`)

| Entity | Create | Read/List | Update | Delete/Archive |
|--------|:--:|:--:|:--:|:--:|
| Property | ✅ | ✅ | ✅ | Archive only (no hard delete) |
| Prospect | ✅ | ✅ | ✅ | No delete (status → passed/closed) |
| Contact | ✅ | ✅ (global + per-prospect) | ✅ | ✅ delete |
| Document | ✅ upload (signed) | ✅ list/get | — | ✅ delete |
| Note | ✅ | ✅ | ✅ | ✅ delete |
| Assignment | ✅ assign | ✅ list | — | ✅ unassign |
| User | ✅ invite | ✅ list | ✅ role/status | Disable only |

### 2.5 UI / "sheet" experience (verified components)

- **Left icon rail** (`icon-rail.tsx` + `navigation.ts`): Recents, Properties, Prospects, Contacts, Documents, Settings. Flat — *not* a workspace tree.
- **Top header** (`site-header.tsx`): always-present **global search**, user name, role badge, sign-out.
- **Grid** (`data/smartsheet-grid.tsx`, `grid-pinned-columns.tsx`): styled spreadsheet table — sticky header, grid lines, zebra rows, pinned columns (#, Company, Contact, Status), 📎/💬 indicator columns, row-select highlight. **Presentation only — no inline cell editing** (confirmed: no `contentEditable`/cell-edit handlers; edits go through forms).
- **Grid toolbar** (`list-grid-toolbar.tsx`): "Grid" label, sort dropdown, text **Filter**/search, pagination. Single-field search-filter, **not** a multi-condition filter builder.
- **Attachments panel** (`layout/attachments-panel.tsx`): right-docked panel with **Row / Sheet / All** scope tabs (directly mirrors Smartsheet), combined Documents + Notes, upload, quick-note, row context header. This is a strong, faithful re-implementation of V14.
- **Share + Manage Access** (`share-property-dialog.tsx`, `manage-access-dialog.tsx`): "Share '{name}'", shared-with list with avatars, add-editor combobox, manage/remove. Property-level.
- **Create menu** (`create-menu.tsx`): Property / Prospect / Contact / Upload Document, permission-gated.
- **Detail views** wire it all together (`property-detail-view.tsx`): Share button, SharedWithSummary, Archive, Attachments panel, grid of prospects.

### 2.6 Dashboard, Notes, Activity, Documents, Search, Sharing — verified state

- **Dashboard:** stats (property/prospect/contact/document counts), assigned/recent properties, recent prospects, activity feed (`dashboard.ts`, `kpi-strip.tsx`, `compact-activity-feed.tsx`). Counts only — no charts (by design).
- **Notes:** per property/prospect, author + timestamp, full CRUD, surfaced in attachments panel and detail sections.
- **Activity:** append-only audit table, org/property-scoped, formatted feed (`activity/format.ts`). **Surfaced as a global/property feed, not as a per-row activity log** (grid shows count indicators only).
- **Documents:** upload → private bucket; download via **signed URL**; delete; metadata detail page. **No inline preview, no versioning, no description field.**
- **Search:** global FTS across properties, prospects, contacts, documents, notes via `search_global` RPC; available in header on every page + dedicated `/search`.
- **Sharing:** property-level **editor assignment** only. **No link sharing, no public/"general access," no per-resource role levels** (roles are org-global), **no external/guest sharing,** no workspace/folder-level sharing.
- **Favorites & Recents:** implemented but **localStorage-only** (`lib/favorites.ts`, `lib/recent-properties.ts`) — device-local, not synced across devices/users, not server-persisted.

### 2.7 Confirmed absent (grep-verified across `src/`)

No email/Resend/send-row code; no document preview/iframe/PDF viewer; no document versioning; no workspace/folder hierarchy table or UI; no inline cell editing; no Forms, Reports, chart Dashboards, Automation, or CSV/Excel import; no in-app notifications. (Several of these are explicitly deferred in `MVP_SCOPE.md` / `ROADMAP.md`.)

---

## Phase 3 — Feature Mapping Matrix

Status legend: **Fully Implemented** · **Partially Implemented** · **UX Gap Only** (capability exists, experience differs) · **Missing** (no implementation) · **Not Applicable** (Smartsheet bloat, intentionally excluded).

| Smartsheet Feature | In Video | DrainSheets Equivalent | Status | Notes |
|--------------------|:--:|------------------------|--------|-------|
| Recents (home landing) | ✅ | `/` Recents page + `recent-property-tracker` | **Partially Implemented** | Works, but localStorage-only → not synced; not server-backed |
| Favorites / starred | ✅ | `lib/favorites.ts` + ★ in tables | **Partially Implemented** | localStorage-only; no synced "Favorites" view across devices |
| Workspaces / folder hierarchy | ✅ | — (flat property list) | **Missing** | No workspace/folder grouping; properties are a flat list |
| Browse tree navigation | ✅ | Icon rail (flat) | **UX Gap Only** | Navigation exists; hierarchy/tree does not |
| Grid view of records | ✅ | `smartsheet-grid` + prospect grid | **Fully Implemented** | Faithful Smartsheet look; pinned cols, indicators |
| CRE columns (company/use/website/contact/title) | ✅ | prospects + contacts schema | **Fully Implemented** | Maps cleanly to Prospect→Contact model |
| CRE columns (address/price/PPSF/NNN) | ✅ | properties.address/city/state only | **Partially Implemented** | Has address; **no price/PPSF/NNN deal fields** |
| Sort | ✅ | `list-grid-toolbar` sort dropdown | **Fully Implemented** | Column-preset sorts |
| Filter | ✅ | text search filter | **Partially Implemented** | Single-field filter, not multi-condition builder |
| Inline cell editing | ✅ (implied) | form-based edit | **UX Gap Only** | Data *is* editable, but via forms/dialogs, not in-grid |
| Cell formatting (fonts/colors) | ✅ | — | **Not Applicable** | Spreadsheet bloat; irrelevant to a CRM |
| Share dialog (by email) | ✅ | `share-property-dialog` | **Partially Implemented** | Assigns existing org editors; no email-a-new-person flow |
| Copy link / general access | ✅ | — | **Missing** | No link sharing or public/restricted toggle |
| Manage access (per-user roles) | ✅ | `manage-access-dialog` | **Partially Implemented** | Org-level roles + property assignment; no per-sheet role levels/Viewer |
| Workspace-level sharing | ✅ | — | **Missing** | No workspace concept to share |
| Row-level attachments (Row/Sheet/All) | ✅ | `attachments-panel` | **Fully Implemented** | Excellent parity, incl. scope tabs |
| Attach files to row | ✅ | upload w/ prospect_id | **Fully Implemented** | — |
| Attachment metadata | ✅ | upload details (by/at, size, type) | **Partially Implemented** | Has size/uploader/date; **no editable description** |
| **In-app document preview** | ✅ | metadata page + download only | **Missing** | **No PDF/image viewer** — must download to read |
| Document versioning | ✅ | — | **Missing** | One file = one row; no version stack |
| Download / delete attachment | ✅ | signed-URL download + delete | **Fully Implemented** | Secure (private bucket + signed URLs) |
| Row comments / discussion | ✅ | Notes (per prospect) | **Partially Implemented** | Notes ≈ comments, but no threaded per-row discussion UX |
| **Send row by email** | ✅ | — | **Missing** | No email at all (Resend deferred); broker uses this live |
| Global search | ✅ (rail) | `search_global` RPC + header | **Fully Implemented** | FTS across 5 entity types incl. notes |
| Activity / audit history | partial | `activity` feed | **Partially Implemented** | Global/property feed; **no per-row activity log** |
| Roles: Owner/Admin/Editor | ✅ | RLS + guards (3 layers) | **Fully Implemented** | Verified by RLS test suite |
| Viewer / read-only role | ✅ | — | **Missing** | Only owner/admin/editor; no read-only/guest |
| Invite users | n/a (admin) | `users.ts` invite + tokens | **Fully Implemented** | Invite-only, token-hashed |
| Reports / Dashboards (charts) | seen, unused | counts-only dashboard | **Not Applicable** | Charts explicitly out of scope; not used by broker |
| Forms | seen, unused | — | **Not Applicable** | Not used by broker |
| Automation / Connections / Dynamic View / WorkApps / Portfolios / Scenario Plans | seen, unused | — | **Not Applicable** | Enterprise bloat; intentionally rejected |
| CSV/Excel import | in Create menu | — | **Missing** | **Migration blocker** — deferred to post-MVP |

---

## Phase 4 — Gap Analysis

### A. Capability exists — needs UX refinement (not "missing")

1. **Inline editing friction (UX Gap).** Data is fully editable, but every edit opens a form/dialog (`prospect-form`, `contact-form`). A broker used to typing directly into Smartsheet cells will feel the click-tax. The grid *looks* like Smartsheet but doesn't *behave* like it. — *Affected:* `prospect-grid-row.tsx`, `property-prospects-grid.tsx`, `smartsheet-grid.tsx`.
2. **Favorites/Recents not synced (refinement).** Both work, but localStorage scoping means they vanish on a new device and can't power a shared "team favorites." Promote to DB-backed. — *Affected:* `lib/favorites.ts`, `lib/recent-properties.ts`, schema.
3. **No hierarchy/grouping (UX Gap → borderline Missing).** Properties are a flat, paginated list. Brokers in the video rely on nested Workspaces to find sheets. DrainSheets can *navigate* to anything via search/recents, but cannot *organize* — a real friction at 50+ properties. (Listed again in B because at scale this crosses into a true capability gap.)
4. **Filter is single-field (refinement).** `list-grid-toolbar` filters by one text query. Smartsheet users expect status/category filters. Cheap to extend (the data + indexes already exist).
5. **Attachment metadata has no description (refinement).** Schema/UI capture uploader/size/date but not the editable *Description* field seen in the video. Small add.
6. **Activity is feed-only, not per-row (refinement).** The `activity` table is row-aware (`entity_id`, `property_id`) — surfacing a per-prospect/per-property timeline is mostly a UI query, not new plumbing.
7. **Raw DB errors leak to users (polish).** Noted in `BETA_READINESS.md`; some server actions return raw Supabase constraint messages.

### B. Genuinely does not exist (no implementation)

1. **Document preview** — *the* most-used document action in the video. No PDF/image viewer anywhere; users must download every OM/flyer to read it. (Verified: no preview/iframe/viewer code.)
2. **Send update by email** — broker composes and sends a "Quick Update" with row data + attachments live on camera. DrainSheets has **zero** email capability (Resend deferred to Milestone 9).
3. **Workspace / folder hierarchy** — no table, no UI. Flat property list only.
4. **Document versioning** — no version stack; re-uploading is a new, unrelated row.
5. **Link sharing / general (public-or-restricted) access** — sharing is assignment-only; no copy-link, no external/guest access, no Viewer role.
6. **CSV/Excel import** — no importer. This is the silent killer for a Smartsheet *replacement*: the client cannot migrate years of sheets.
7. **CRE deal fields** — properties store address/city/state but not Purchase Price, PPSF, or NNN expenses seen on the deal sheet (V7). Today those would live only in free-text description/notes.
8. **In-app notifications** — none (Smartsheet's bell icon).

---

## Phase 5 — Smartsheet Parity Assessment

Goal: *"Make DrainSheets feel as familiar as possible to CRE brokers who currently live inside Smartsheet."* Each item classified by whether brokers will **immediately miss it**.

### Required for parity (users will immediately miss this)

- **Document preview (V16).** Brokers open OMs, flyers, and site plans constantly. Download-to-read breaks the core loop and will feel broken on day one. *Why:* it's the highest-frequency document action in the entire recording.
- **Send update by email (V19).** The broker literally performs this on camera as a routine comms step. Without it they bounce back to Outlook + manual attachment, defeating "work from inside the platform." *Why:* it's a daily broker communication ritual, not a power feature.
- **Synced Favorites + Recents (V1/V2).** Brokers navigate by muscle memory to starred/recent sheets. localStorage-only silently fails the moment they switch machines. *Why:* it's the primary navigation pattern observed before any data work happens.
- **Data import (CSV/Excel) — migration parity.** Not a "feel" item but a *switching* item: you cannot cancel Smartsheet without moving the data. *Why:* the entire project's success metric is "client stops using Smartsheet."

### Helpful for parity (improves familiarity, not required)

- **Inline cell editing.** Closes the biggest behavioral gap with the grid. High delight, but form-editing is a workable substitute initially.
- **Workspace/folder grouping.** Becomes important past ~30–50 properties; survivable early via search + favorites.
- **Per-row activity + threaded comments.** Brokers like seeing "who changed what" on a deal; notes partially cover this.
- **Status/category filters (multi-condition).** Expected, but the single-field filter + sort covers the 80% case.
- **Attachment description + versioning.** Nice document hygiene; low daily frequency.
- **Viewer / link sharing.** Useful for sharing a read-only sheet with a client; medium frequency for brokers, higher for client-facing teams.

### Smartsheet-specific bloat — explicitly do NOT build

- **Formula engine / dynamic schemas.** A CRM has fixed, meaningful columns; arbitrary formulas add complexity and data-quality risk with no CRE payoff. *(The broker never touched a formula.)*
- **Cell formatting toolbar (fonts/colors/fills).** Visual spreadsheet noise; a clean, opinionated CRM layout is the selling point.
- **Gantt / project scheduling, Automation builders, Forms, Connections, Dynamic View, Reports, chart Dashboards, WorkApps, Portfolios, Scenario Plans.** *Every one of these appeared in the chrome and none were used.* Building them re-creates the exact cost/complexity bloat the client is paying $400/mo to escape. Rejecting them is a feature, not a gap.
- **Kanban/board views.** No evidence of pipeline-board usage; would be speculative.

---

## Phase 6 — Build Recommendation

Effort in ideal engineering-days for one mid/senior full-stack dev familiar with this stack. Complexity = technical risk/novelty.

### P0 — Must build before a broker pilot (workflow blockers)

**P0-1 · In-app document preview**
- *User story:* "As a broker, I click an attached OM and read it inline (zoom/scroll) without downloading."
- *Business value:* Removes the #1 friction in the most-used document loop; single biggest "feels broken" risk.
- *Complexity:* Medium. PDFs/images render from the existing signed URL; PDF.js or `<iframe>`/`<img>` for common types; fall back to download for the rest.
- *Effort:* 3–5 days.
- *Affected:* `documents/[id]/page.tsx`, new `document-preview.tsx`, `attachments-panel.tsx`, `generateDownloadUrl` (add inline-disposition signed URL).

**P0-2 · Send update by email**
- *User story:* "As a broker, I select a property/prospect, compose a quick update with chosen fields + attachments, and send it (cc me) from inside DrainSheets."
- *Business value:* Replaces the live workflow in the video; keeps brokers in-platform; enables `email_logs` audit (already a planned table).
- *Complexity:* Medium. Resend integration + compose modal + include-fields/attachments + send-log. Attachments via signed URLs.
- *Effort:* 4–6 days.
- *Affected:* new `actions/email.ts`, `components/email/send-update-dialog.tsx`, new `email_logs` migration, env/secrets, `property-detail-view.tsx`.

**P0-3 · Server-backed Favorites + Recents**
- *User story:* "My starred and recently-opened sheets follow me across devices."
- *Business value:* Restores the primary navigation pattern; precondition for any multi-device/team use.
- *Complexity:* Low–medium. New `favorites` + `recent_views` tables (or columns), RLS, swap localStorage for server reads.
- *Effort:* 2–3 days.
- *Affected:* schema/migration, `lib/favorites.ts`, `lib/recent-properties.ts`, Recents page, properties table.

**P0-4 · CSV/Excel import (migration)**
- *User story:* "As the owner, I upload our Smartsheet exports and DrainSheets creates properties/prospects/contacts with a column-mapping + preview + dedupe."
- *Business value:* The literal precondition to *cancel Smartsheet*. Without it the project cannot meet its success metric.
- *Complexity:* Medium–high. Parser, column mapper UI, validation, duplicate detection, batched inserts respecting RLS.
- *Effort:* 5–8 days.
- *Affected:* new `actions/import.ts`, `components/import/*`, validation schemas, possibly a staging table.

**P0-5 · Production infrastructure** (from `BETA_READINESS.md` launch blockers)
- *User story:* "As the team, we use a real, backed-up, monitored deployment."
- *Business value:* Non-negotiable for any paid pilot; currently local-only (prod readiness scored 40/100).
- *Complexity:* Low–medium (ops). Remote Supabase, Vercel, env/secrets, backups, error monitoring (Sentry), rate-limit auth routes.
- *Effort:* 3–5 days.
- *Affected:* infra/config, `middleware`, CI.

### P1 — High-ROI usability gains

**P1-1 · CRE deal fields on properties** (Purchase Price, PPSF, NNN, deal stage) — *2–3 days* — schema + `property-form` + grid columns. Makes the deal sheet (V7) first-class instead of free text.

**P1-2 · Inline grid cell editing** (at least Status, Category, Comments) — *5–8 days, Medium-high* — `prospect-grid-row.tsx` + optimistic update actions. Closes the biggest behavioral gap with Smartsheet.

**P1-3 · Multi-condition filters** (status/category facets) — *2–3 days* — `list-grid-toolbar` + query params; data/indexes already exist.

**P1-4 · Per-row activity timeline + attachment description** — *2–4 days* — surface existing `activity` rows per record; add description column. Low plumbing, high "Smartsheet feel."

### P2 — Nice to have

**P2-1 · Workspace/folder grouping for properties** — *5–8 days, Medium* — `workspaces`/`folders` table + tree UI + workspace-level sharing. Defer until property counts grow.

**P2-2 · Document versioning** — *3–5 days* — version stack on `documents` (group_id + version). Low daily frequency.

**P2-3 · Link sharing + Viewer role** — *4–6 days, Medium* — read-only role + tokenized link; enables client-facing read-only sheets.

**P2-4 · In-app notifications** — *4–6 days* — notifications table + bell; pairs well with email.

**P2-5 · Friendly DB-error mapping + replace `window.confirm`** — *1–2 days* — polish noted in readiness report.

### P3 — Smartsheet features to explicitly REJECT

| Feature | Why reject |
|---------|-----------|
| Formula engine / dynamic columns | Re-introduces spreadsheet chaos a CRM exists to remove; zero CRE payoff; never used in video |
| Cell formatting (fonts/colors/fills) | Cosmetic spreadsheet noise; conflicts with a clean opinionated UI |
| Gantt / scheduling | Brokers track prospects, not project timelines |
| Automation builder | Enterprise complexity; the cost the client is fleeing |
| Forms, Connections, Dynamic View, WorkApps, Portfolios, Scenario Plans | Unused enterprise surfaces; each is a multi-week build with no observed demand |
| Chart dashboards | Out of scope by design; counts suffice |
| Kanban/board view | No evidence of pipeline-board use; speculative |

Building any P3 item would increase complexity and cost without improving the CRE workflow — the opposite of the product's reason to exist.

---

## Phase 7 — Executive Summary (brutally honest)

### 1. DrainSheets completion percentage
- **Against its own MVP scope: ~92%.** Every MVP module (auth, users, properties, prospects, contacts, documents, notes, activity, search, dashboard) is implemented, RLS-tested (13/13), and integrity-checked (10/10). It has also shipped *unscoped* Smartsheet-flavored UX (grid, attachments panel, share/manage-access, recents, favorites).
- **Against a production-ready product: ~70%.** Production readiness is the hole — no remote deployment, backups, monitoring, email, import, or preview. (`BETA_READINESS.md` self-scores 82/100 but weights production at only 5%; weighting infra realistically pulls the *shippable-product* number down.)

### 2. Smartsheet parity percentage
- **On the broker's actually-observed workflow: ~65%.** Strong on grid, attachments (Row/Sheet/All), sharing, search, roles. Missing on preview, email, synced favorites, hierarchy.
- **Against Smartsheet's total feature set: ~25%** — *and that is by design.* Most of the remaining 75% is bloat the client is paying to escape. The right target is the first number, not the second.

### 3. Top 10 workflow gaps
1. No in-app document preview (must download every OM/flyer). **(P0)**
2. No send-update-by-email. **(P0)**
3. Favorites/Recents are device-local, not synced. **(P0)**
4. No data import — cannot migrate off Smartsheet. **(P0)**
5. No production deployment/backups/monitoring. **(P0)**
6. No inline cell editing (every edit is a form). **(P1)**
7. No CRE deal fields (price/PPSF/NNN) as structured data. **(P1)**
8. Single-field filter, not multi-condition. **(P1)**
9. No workspace/folder organization (flat list). **(P2)**
10. No Viewer/read-only role or link sharing for clients. **(P2)**

### 4. Top 10 strengths
1. **Correct product thesis:** rejects the enterprise bloat the broker never touches.
2. **Faithful attachments panel** with Row/Sheet/All scoping — real parity on a core loop.
3. **Serious security:** three-layer permissions (RLS + server guards + UI), private bucket + signed URLs, invite-only, RLS test suite passing.
4. **Clean data model** that maps exactly to CRE: Property → Prospect → Contact, with archive-not-delete and activity audit.
5. **Smartsheet-grade grid look** (pinned columns, indicators, zebra rows) — instantly familiar.
6. **Share + Manage Access dialogs** that mirror Smartsheet's mental model.
7. **Global full-text search** across five entity types, always in the header.
8. **Recents-first landing** matching how brokers actually start their day.
9. **Genuine engineering discipline:** migrations, typecheck/lint/build green, perf benchmarks, integrity checks, honest readiness report.
10. **Cost story is real:** replaces a $400/mo tool whose advanced features sit unused.

### 5. Readiness verdict

| Use case | Ready? | Rationale |
|----------|:--:|-----------|
| **Personal use** | ✅ **Yes** | Fully functional locally/staging; one user, no migration pressure. |
| **Internal team beta (staging)** | ✅ **Yes, with caveats** | RLS verified, seed data ready; caveat: staging only, no email/preview/import yet. Matches the report's own "controlled beta" recommendation. |
| **Small brokerage pilot (paying client)** | ⚠️ **Not yet** | Blocked by P0-1…P0-5: without preview, email, synced favorites, import, and production infra, daily brokerage work and the *migration itself* are not viable. Estimated **~3–5 focused weeks** to clear P0. |
| **Full production** | ❌ **No** | Requires all P0 + P1, hardening (rate limiting, error mapping, monitoring), and a real pilot's feedback loop first. |

**Honest conclusion:** DrainSheets is a well-built, well-scoped CRM that is *closer to a credible Smartsheet replacement than most teams get* — but it is not there yet. The distance is small, specific, and unglamorous: let brokers *read* their documents (preview), *send* their updates (email), *bring* their data (import), *keep* their navigation (synced favorites), and run it on *real* infrastructure. Close those five and a brokerage pilot is realistic; everything else on the roadmap is refinement, and most of Smartsheet's remaining surface should be deliberately left unbuilt.
