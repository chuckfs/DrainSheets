# S0-1 — Post-Expand Audit & Application Cutover Plan

**Status:** Audit + planning only. No code written, no files modified, Migration 28 not started.
**Position in lifecycle:** Migrations 22–27 (Expand) complete. Application still runs on the legacy model. Migration 28 (Contract) blocked pending application cutover.
**Source-of-truth docs:** `S0-1_SHEET_ENGINE_DESIGN.md`, `RE_AUDIT_Smartsheet_Replacement.md`, migrations 22–27 (the migration files themselves serve as the completion record — no separate completion-report files exist in the repo).

---

## 0. The one fact that determines the entire cutover

Migration 27 added **provisioning + sync + strict-equality guard triggers** that were *not* in the original design. Their combined effect:

- **Legacy writes auto-populate the sheet model.** `INSERT/UPDATE` on `properties`→`sheets` (+columns), `prospects`→`rows`; `documents/notes/favorites/recent_views/email_logs/contacts/property_assignments` auto-fill `sheet_id`/`row_id`/`sheet_assignments`.
- **The two models are forced equal.** Guard triggers `RAISE EXCEPTION` if `sheet_id IS DISTINCT FROM property_id` (or `row_id` ≠ `prospect_id`). Legacy `property_id`/`prospect_id` remain **NOT NULL** on `documents`, `notes`, `favorites`, `recent_views`, `contacts`.

**Consequence — the cutover is a READ/RENDER cutover, not a write cutover.** Because data in `sheets`/`rows` is *guaranteed identical* to `properties`/`prospects` (same UUIDs, trigger-synced), the application can switch **reads** to the sheet model immediately and safely, while **writes stay on the legacy actions unchanged**. The DB keeps the new tables correct. The actual write-path switch (write `sheets`/`rows` natively, allow `sheet_id ≠ property_id`) is impossible until the guard/sync/provision triggers are dropped — **that is Migration 28's job.**

This single insight massively de-risks the cutover and dictates the milestone boundaries below.

---

## 1. Expand Phase Status (pass/fail)

Audited against `S0-1_SHEET_ENGINE_DESIGN.md` §2–§8.

| # | Design requirement | Status | Evidence / Notes |
|---|--------------------|:------:|------------------|
| 1 | `column_type` enum (11 types) + `sheet_status` | ✅ Pass | Mig 22 — exact enum set incl. `contact`. |
| 2 | `sheets` (id-preservable, generated `search_vector`, workspace/folder placeholders) | ✅ Pass | Mig 22 — all columns incl. nullable `workspace_id`/`folder_id`; FTS over name+address+city+state. |
| 3 | `sheet_columns` (key/label/type/position/is_primary/is_pinned/config, UNIQUE(sheet_id,key), one-primary partial unique) | ✅ Pass | Mig 22 — incl. `sheet_columns_one_primary_per_sheet_idx`. |
| 4 | `rows` with `data JSONB` + generated `search_vector` (`jsonb_to_tsvector`) + GIN | ✅ Pass | Mig 22 — `rows_data_gin_idx`, `rows_search_vector_idx`, `(sheet_id,position)`. |
| 5 | JSONB chosen over `row_cells` | ✅ Pass | Implemented as designed. |
| 6 | RLS helpers `can_access_sheet`, `sheet_id_for_row`, `sheet_id_for_contact` | ✅ Pass | Mig 23 + 26. `can_access_sheet` correctly dual-checks `sheet_assignments` **and** `property_assignments`. |
| 7 | RLS policies on `sheets`/`sheet_columns`/`rows` mirroring properties/prospects | ✅ Pass | Mig 23. Editor may edit columns of assigned sheets (per design default). |
| 8 | Backfill `sheets`/`rows` with **ID preservation**; seed Prospect List columns | ✅ Pass | Mig 24 — `ON CONFLICT DO NOTHING`, deterministic `position`, in-migration assertions (counts, id-set equality, data-key presence). |
| 9 | Re-point dependents (`documents/notes/activity/favorites/recent_views/email_logs/contacts`), create `sheet_assignments` | ✅ Pass | Mig 25 — FKs, NOT NULL where appropriate, indexes, extensive validation. |
| 10 | Transition RLS (`can_access_property OR can_access_sheet`) on all dependents + storage | ✅ Pass | Mig 26 — dual-path on documents/notes/activity/favorites/recent_views/email_logs/contacts/storage. |
| 11 | `search_global` rewritten to sheet-era entities | ⚠️ **Pass-with-defect** | Mig 26 returns `sheet_id` + `entity_type` `sheet`/`row`/`contact`/`document`. **Two regressions (see §1.1).** |
| 12 | Integrity triggers (row⊂sheet ownership; legacy-id equality) | ✅ Pass (beyond spec) | Mig 27 — per-table validators; replaces legacy prospect/property validator. |
| 13 | Provisioning triggers (legacy write → sheet/row) | ✅ Pass (beyond spec) | Mig 27 — `provision_sheet_from_property`, `provision_row_from_prospect`, `provision_prospect_list_columns`. **Not in original design; positive addition enabling write-path backward-compat.** |
| 14 | In-migration validation gates | ✅ Pass | Migs 24/25/26/27 each end with `DO $$ … RAISE EXCEPTION` checks. |

### 1.1 Deviations, shortcuts, and structural risks

**Deviations (all intentional and mostly positive):**
- **D1 — Provisioning + sync triggers added (Mig 25/27).** Enables the read-only cutover strategy in §3. Positive, but see R1.
- **D2 — Strict expand-phase equality guards (Mig 27).** `sheet_id` must equal `property_id`, etc. Excellent safety net during Expand; **becomes a hard blocker to any sheet-native write** — must be dropped in Migration 28 (R1).
- **D3 — `documents_insert` tightened** to require `uploaded_by = auth.uid()` (Mig 26). Verified compatible: `uploadDocument` sets `uploaded_by: profile.id` (`actions/documents.ts:192`). No regression, but it is a behavior change vs the original policy.

**Defects (must be tracked into the cutover):**
- **DEF1 — `search_global` return-shape mismatch (live).** Mig 26 renamed the result column `property_id` → `sheet_id`, but `actions/search.ts` still reads `row.property_id` (`search.ts:13,62`) and `lib/search/format.ts` builds links from `property_id`. Result: search links resolve to `/properties/undefined`. **Search is degraded right now**, before app cutover, because the RPC was changed under the running app.
- **DEF2 — Notes dropped from search.** The new `search_global` UNION omits notes; the old (milestone 7) version included them. `actions/search.ts` still special-cases `entity_type === "note"`. Net: **note search regressed**. Must be restored in the search cutover.

**Structural risks before cutover:**
- **R1 — Trigger directionality.** Provision/sync/guard triggers are **legacy → new, one-directional**, and enforce equality. If any app code writes `sheet_id`/`row_id` directly (or inserts a row without a backing prospect) during Migrate, guards will reject it. **Rule for the Migrate phase: never write the new columns/tables from the app.** Writes stay 100% legacy until Migration 28 drops these triggers.
- **R2 — Provision-on-UPDATE clobbers row data.** `provision_row_from_prospect` fires `AFTER INSERT OR UPDATE` and rewrites `rows.data` from prospect fields. Harmless now (legacy is source of truth), but means **inline row editing (S1-1) cannot ship until Migration 28** removes these triggers. In-scope-for-S0-1 reads are unaffected.
- **R3 — Dual NOT NULL.** Legacy `property_id`/`prospect_id` and new `sheet_id`/`row_id` are both NOT NULL on several tables. Writers must continue supplying legacy ids until Migration 28 relaxes them.
- **R4 — RLS cost.** Dual-path predicates (`can_access_property OR can_access_sheet`) double the policy evaluation; `can_access_sheet` itself now does up to 3 EXISTS checks. Re-baseline `db:perf` before trusting grid/search latency at scale.

**Overall Expand verdict: PASS.** Implementation meets or exceeds the design. Two search defects and one write-path constraint must be carried explicitly into cutover.

---

## 2. Remaining Legacy Surface Area (categorized inventory)

The application is **100% legacy** today: **no** server action references `sheets`/`rows`/`sheet_columns`/`sheet_assignments` yet (verified by grep). Heat = count of legacy table/column references.

### 2.1 Server actions (read **and** write paths)

| Action | Legacy refs | Cutover role | Notes |
|--------|:--:|------|------|
| `import.ts` | 21 | Write (legacy OK) | Inserts `properties/prospects/contacts`; dedupe reads legacy. Triggers propagate to sheet model. Low Migrate priority. |
| `documents.ts` | 21 | **Read + Write** | Read joins `properties(...)`, `prospects(...)`; `generatePreviewUrl`/list scoped by `property_id`/`prospect_id`. Read cutover → `sheet_id`/`row_id`. Writes stay legacy. |
| `contacts.ts` | 20 | Read + Write | `prospect_id`-scoped; satellite stays. Read joins to prospect/property. |
| `email.ts` | 13 | Read + Write | `loadEmailAttachments` scopes by `property_id`; `email_logs` insert legacy. |
| `notes.ts` | 10 | Read + Write | `property_id`/`prospect_id` scoped reads. |
| `recents.ts` | 8 | **Read** | `listRecentViews` reads by `property_id`; should read `sheet_id`. Write stays legacy. |
| `prospects.ts` | 7 | Read + Write | `listProspects`/`getProspect` feed the grid → become row reads. Writes legacy. |
| `properties.ts` | 7 | Read + Write | `listProperties`/`getProperty` → sheet reads. Writes legacy. |
| `favorites.ts` | 6 | Read | reads/writes by `property_id`; read → `sheet_id`. |
| `assignments.ts` | 6 | Read + Write | `listPropertyAssignments`; reads → `sheet_assignments`; writes legacy (trigger syncs). |
| `search.ts` | 5 | **Read (broken)** | DEF1/DEF2 — must fix RPC consumer shape + restore notes. |
| `dashboard.ts` | 3 | Read | counts + recent/assigned → sheet reads. |
| `activity.ts` | 1 | Read/Write | activity feed read; logging stays legacy (auto-syncs `sheet_id`). |

### 2.2 Components (consume `Property`/`Prospect`/`propertyId`/`prospectId`)

| Component | Refs | Cutover cluster |
|-----------|:--:|------|
| `properties/property-detail-view.tsx` | 45 | **Sheet/Grid (M2)** — the "open sheet" surface |
| `layout/attachments-panel.tsx` | 40 | **Side-panel (M3)** — Row/Sheet/All reads |
| `properties/property-prospects-grid.tsx` | 19 | **Sheet/Grid (M2)** — hard-coded columns → data-driven |
| `properties/property-prospects-grid-with-toolbar.tsx` | 18 | Sheet/Grid (M2) |
| `documents/document-upload-form.tsx` | 18 | Side-panel (M3) |
| `properties/prospect-workspace-sheet.tsx` | 15 | Sheet/Grid (M2) |
| `prospects/prospect-detail-view.tsx` | 13 | Row-detail (M2/M3) |
| `properties/properties-table.tsx` | 13 | Read-model (M1) — sheet list |
| `notes/*` (section/list/compact/form/edit/quick/delete) | ~50 across 7 | Side-panel (M3) |
| `email/send-update-dialog.tsx` | 7 | Search/Import/Email (M4) |
| `recents/recents-page-content.tsx`, `recent-property-tracker.tsx` | 10 | Read-model (M1) |
| `properties/{prospect-grid-row,property-overflow-menu,manage-access-dialog,share-property-dialog,archive-property-button}` | ~23 | M2/M3 |
| `contacts/*`, `prospects/*` tables & forms | ~25 | M2/M3 |

### 2.3 Libs / utilities

| Lib | Refs | Coupling |
|-----|:--:|------|
| `types/database.ts` | 84 | Generated — **regenerate after type cutover** (adds sheets/rows/sheet_columns). |
| `lib/email/build-update-html.ts` | 29 | Renders property/prospect; M4. |
| `lib/validations/import.ts`, `lib/import/{mapping,normalizers,dedupe}.ts` | ~53 | Import pipeline shape; M4 (legacy-OK during Migrate). |
| `lib/search/format.ts` | 16 | **DEF1** — link builder uses `property_id`; M1. |
| `lib/validations/crm.ts` | 12 | Property/Prospect Zod schemas; M2 write paths (later). |
| `lib/prospects/indicators.ts` | 11 | Per-row 📎/💬 counts; M2. |
| `lib/activity/{format,filter-by-prospect}.ts` | 20 | Activity read; M3. |
| `lib/validations/email.ts` | 10 | M4. |
| `lib/property-sort.ts` | 10 | List sort; M1. |
| `lib/documents/paths.ts` | 7 | Storage path (`{org}/{property_id}/…`) — **unchanged** (id preservation); informational. |
| `lib/permissions/property.ts` | 6 | Permission helpers; reused for sheets. |
| `types/domain.ts` | 5 | **Add `Sheet`/`SheetColumn`/`SheetRow`** (M1). |
| `lib/{recent-properties,navigation,favorites}.ts` | 3 | Minor; M1/M3. |

### 2.4 Search consumers (expect `property_id`)
- `actions/search.ts` (`SearchGlobalRow.property_id`, note special-case), `lib/search/format.ts` (`/properties/${property_id}`), `components/search/search-results.tsx`. **All three** must move to `sheet_id` + `sheet`/`row` entity types; notes restored. (M1.)

### 2.5 Import pipeline (writes `prospects`, not `rows`)
- `actions/import.ts` `executeImport` inserts `properties`/`prospects`/`contacts`; `lib/import/dedupe.ts` keys off legacy fields. **During Migrate this is acceptable** — provision triggers propagate to `rows`. Native row-writing import is **Migration 28+ / S0-2** scope. (M4 = read-side alignment only.)

---

## 3. Application Cutover Plan (ordered phases)

**Strategy:** READ/RENDER cutover only. Every Migrate milestone changes reads/rendering and keeps writes on legacy actions (DB triggers keep `sheets`/`rows` in sync). Each milestone is independently shippable and reversible by reverting app code (the DB is untouched during Migrate).

### Cutover M1 — Read-Model Foundation + Search Fix `[highest leverage]`
- **Objective:** Introduce `Sheet`/`SheetColumn`/`SheetRow` domain types and read-only data access (`getSheet`, `listSheets`, `listSheetColumns`, `listRows`) that return shapes mapping onto existing component props. Point list/dashboard/recents/search **reads** at the sheet model. Fix DEF1/DEF2.
- **Files affected:** `types/domain.ts`, `types/database.ts` (regen), new `actions/sheets.ts` + `actions/rows.ts` (reads), `actions/properties.ts`/`prospects.ts` (read internals), `actions/dashboard.ts`, `actions/recents.ts`, `actions/favorites.ts` (reads), `actions/search.ts`, `lib/search/format.ts`, `components/search/search-results.tsx`, `properties/properties-table.tsx`, `recents/*`.
- **Dependencies:** none (foundation).
- **Risk:** **Low.** Reads only; IDs preserved; data trigger-guaranteed equal. Search fix is net-positive (currently broken).
- **Verification:** search returns `sheet`/`row`/`contact`/`document`(+notes) with resolvable links; list/dashboard counts match legacy; `typecheck`/`lint`/`build` green; RLS unaffected.
- **Rollback:** revert app code; DB unchanged.

### Cutover M2 — Sheet/Grid Render
- **Objective:** Convert `property-detail-view` → sheet-view and `property-prospects-grid(-with-toolbar)` → **data-driven grid** rendering headers/cells from `sheet_columns` + `rows.data` (cell renderers per `column_type`; pinned/order from columns; `contact` column derived from `contacts` satellite). Row selection yields the row id (== prospect id) that continues to drive existing legacy write actions and the panel.
- **Files affected:** `properties/property-detail-view.tsx`, `property-prospects-grid.tsx`, `property-prospects-grid-with-toolbar.tsx`, `prospect-grid-row.tsx`, `prospect-workspace-sheet.tsx`, `data/grid-pinned-columns.tsx`, `data/smartsheet-grid.tsx` (reused), `lib/prospects/indicators.ts`, new `components/data/cell-renderers/*`.
- **Dependencies:** M1.
- **Risk:** **High** (largest, most coupled cluster; the core UX). Reads only — no write changes.
- **Verification:** sheet opens with identical columns/data/order to today; 📎/💬 indicators correct; selection→panel works; visual regression vs current grid; perf within `db:perf` thresholds for `rows` by `sheet_id`.
- **Rollback:** feature-flag the new grid or revert app code; DB unchanged.

### Cutover M3 — Side-Panel Reads (Attachments / Notes / Activity / Favorites / Recents)
- **Objective:** Point the attachments panel + activity timeline + favorites/recents **reads** at `sheet_id`/`row_id`. Writes (upload, add/edit note, toggle favorite, track recent, log activity) stay legacy (auto-synced).
- **Files affected:** `layout/attachments-panel.tsx`, `documents/*` (read lists incl. `compact-documents-list*`, preview wiring uses `documentId` — unchanged), `notes/*` (read lists), `lib/activity/{format,filter-by-prospect}.ts`, `actions/documents.ts`/`notes.ts`/`activity.ts`/`favorites.ts`/`recents.ts` (read internals).
- **Dependencies:** M2 (selection passes `rowId`).
- **Risk:** **Medium.** Row/Sheet/All scoping already exists; map `prospect_id`→`row_id`, `property_id`→`sheet_id` on reads.
- **Verification:** Row vs Sheet vs All attachment/note scoping matches today; preview/download/email-from-panel unaffected; activity feed identical.
- **Rollback:** revert app code; DB unchanged.

### Cutover M4 — Sharing Reads + Email/Import Alignment
- **Objective:** `assignments` reads from `sheet_assignments`; Manage Access / Share read sheet shares; `send-update-dialog` + `build-update-html` read sheet/row; verify import path still propagates correctly (no native row writes yet).
- **Files affected:** `actions/assignments.ts` (read), `properties/{manage-access-dialog,share-property-dialog,shared-with-summary}.tsx`, `email/send-update-dialog.tsx`, `lib/email/build-update-html.ts`, `actions/import.ts` (read-side dedupe alignment only).
- **Dependencies:** M1 (types). Independent of M2/M3.
- **Risk:** **Low–Medium.** Sharing semantics preserved (per-sheet sharing is S1-2).
- **Verification:** Manage Access lists match; email send still logs `email_logs` with correct `sheet_id`/`row_id` (trigger-set); import still produces rows via triggers; import tests green.
- **Rollback:** revert app code; DB unchanged.

**Optimal ordering:** **M1 → (M2 ∥ M4) → M3.** M1 is the unblocker. M2 and M4 can run in parallel after M1 (different surfaces). M3 depends on M2 because the panel keys off the selected row from the new grid.

---

## 4. Recommended Cutover Boundaries — **B. Multiple milestones**

**Do not use one large branch.** Justification from the repo audit:
- The legacy surface spans ~13 actions, ~40 components, ~20 libs. A single branch would be a multi-thousand-line, high-conflict, hard-to-review change touching the highest-risk UI (`property-detail-view` 45 refs, `attachments-panel` 40) all at once.
- The read-only cutover strategy makes the work **cleanly separable by surface**, and each surface is independently shippable behind the unchanged write path. That is the textbook case for milestones over a big-bang branch.
- **DEF1/DEF2 (search) are already live defects** — they must ship early and alone-ish, not be buried in a giant branch.

**The milestones, by audited coupling/risk (not assumed):** M1 Read-Model+Search · M2 Sheet/Grid · M3 Side-Panel · M4 Sharing/Email/Import. This differs from the example ordering deliberately: search is pulled **into M1** (it's broken now and shares the read-model types), and sharing is grouped with email/import in **M4** (all low-risk read alignments) rather than bundled with attachments/activity (M3), which are the higher-risk panel reads gated on the grid.

---

## 5. Migration 28 Gate — required conditions

Migration 28 (Contract) is the moment the write path flips: drop provision/sync/guard triggers, switch write actions to native `sheets`/`rows`, relax legacy NOT NULL, then drop legacy columns/tables. It may begin **only when all of the following hold:**

**Code**
- M1–M4 merged: **every display/read path sources from `sheets`/`rows`/`sheet_columns`/`sheet_assignments`**; no component reads `properties`/`prospects` for rendering.
- A written, reviewed **write-path switch plan** exists enumerating each mutating action (`createProspect→createRow`, `updateProspect→updateRow`, `createProperty→createSheet`, document/note/favorite/recent/email/assignment writers) and the exact trigger drops they depend on.
- `types/database.ts` regenerated; `typecheck`/`lint`/`build` green on the integrated branch.

**Tests**
- RLS integration suite (`tests/rls/integration.test.ts`) extended to `sheets`, `sheet_columns`, `rows`, `sheet_assignments`, incl. editor isolation (unassigned sheet → 0 rows/columns) and storage access via `can_access_sheet`; **all green**.
- `tests/import/*` green against the (still legacy-routed) import.
- New tests: data-driven grid render parity; `search_global` consumer shape (`sheet_id`, entity types, notes restored).
- `npm run db:integrity` extended with the §3.4 design checks (id-set equality, `rows.data` key completeness, sheet/row ownership) — **green**.

**RLS**
- Dual-path policies validated in tests *before* 28; a reviewed plan to **remove the legacy `can_access_property` predicate** and `property_assignments` branch from `can_access_sheet` *in* 28, with the RLS suite re-run after.

**Search**
- DEF1/DEF2 closed: links resolve, notes present. `search_global` confirmed as the sole search path; no consumer references `property_id`.

**Import**
- Verified end-to-end: an import produces correct `rows`/`sheet_columns` (via triggers now; natively in 28). Dedupe correct against the new model. Decision recorded on whether import writes natively in 28 or remains trigger-propagated until S0-2.

**Performance**
- `npm run db:perf` re-baselined on the beta seed: grid read (`rows` by `sheet_id` + JSONB), `search_global`, and dual-path RLS all within thresholds. R4 (RLS cost) explicitly checked.

**Rollback**
- A tested **down migration** for 28 (or a documented restore-from-backup runbook), dry-run on staging.
- Production **backup taken immediately before 28**.
- Confirmation that until 28 merges, every Migrate milestone remains reversible by reverting app code with the DB untouched.

---

## 6. Recommended Next Cursor Sprint

**Build Cutover M1 — Read-Model Foundation + Search Fix.**

**Why this is the single highest-leverage target:**
1. **It unblocks everything.** M2/M3/M4 all depend on the `Sheet`/`SheetColumn`/`SheetRow` types and read-access layer M1 establishes.
2. **It fixes a live defect.** DEF1/DEF2 mean search currently produces broken links and has lost note results — introduced by Migration 26 ahead of cutover. M1 is the natural home for the fix and ships user-visible value immediately.
3. **It is the lowest-risk possible start.** Reads only; IDs are preserved; data is trigger-guaranteed identical to legacy; no write paths touched; fully reversible by reverting code.
4. **It proves the strategy end-to-end** (read sheet model, render, links) on small surfaces (lists, dashboard, search) before the high-risk grid in M2.

**Concrete M1 scope:** add `Sheet`/`SheetColumn`/`SheetRow` to `types/domain.ts`; create read-only `actions/sheets.ts`/`actions/rows.ts`; repoint `dashboard.ts`, `recents.ts`, `favorites.ts`, `properties-table` and the search trio (`actions/search.ts`, `lib/search/format.ts`, `search-results.tsx`) to `sheet_id` + `sheet`/`row` entity types with notes restored; regenerate `types/database.ts`. **Do not touch any write path** (guard triggers will reject sheet-native writes — that is Migration 28).

**Exit criteria for the sprint:** sheet-model reads power lists/dashboard/recents/search; search links resolve and notes appear; `typecheck`/`lint`/`build` green; no write-path or RLS changes; everything reversible by code revert.
