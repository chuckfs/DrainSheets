# S0-1 — Greenfield Re-Audit & Revised Cutover Recommendation

**Status:** Architecture re-evaluation. No code written, no files modified.
**Corrected assumption:** DrainSheets has **no production users and no production data**. All existing records are dev/seed/fixture/test data, fully reproducible from `supabase/migrations/*` + `scripts/seed-beta.ts`. There is no linked remote Supabase project (`config.toml` `project_id = "DrainSheets"` is local only; `.env.local.example` targets local). **Nothing must be preserved.**
**Optimization target (per request):** architecture quality, implementation speed, future maintainability — **not** migration safety.

> **Bottom line:** Under greenfield, the Expand → Migrate → Contract strategy and ~70% of migrations 24–27 are solving a problem that does not exist (zero-downtime preservation of live data). They should be **discarded, not executed**. The fastest path to a clean Smartsheet-style Sheet → Column → Row architecture is to **re-baseline the schema so Sheet/Column/Row is native and canonical, delete the legacy Property/Prospect tables and all compatibility scaffolding, and cut the application over in a single branch (read + write)**. This is simpler, faster, and more maintainable than the production-grade migration the prior plan assumed — and it unblocks inline editing and native sheet creation immediately instead of after a separate Contract migration.

---

## 1. Is Expand → Migrate → Contract still optimal? — **No.**

Expand→Migrate→Contract exists to mutate a schema **underneath live traffic without losing data or causing downtime**. Its entire cost structure — ID preservation, additive columns, dual-write/sync triggers, dual-path RLS, equality guards, staged read-then-write cutover, reversible-at-every-step milestones — is the price of *not being allowed to stop the world*.

Greenfield removes that constraint completely:
- No users → downtime is free.
- No data → "migration" is just `db:reset` + re-seed.
- The model is "application logic and schema structure," not a dataset.

When you can drop and recreate the database at will, a multi-phase, trigger-mediated coexistence of two models is **pure overhead** that buys zero safety and imposes real cost (complexity, slower delivery, archaeology in the schema). The optimal strategy is the one the prior plan deferred to "Contract": **define the target model natively and cut over once.**

**Revised strategy name: "Re-Baseline + Single Cutover."** Make Sheet/Column/Row the canonical schema from the ground up; the legacy CRM model survives only as a *seed template definition*, not as tables.

---

## 2. Which migration safeguards are still necessary? — **Almost none.**

| Safeguard (migs 22–27) | Purpose | Greenfield verdict |
|------------------------|---------|--------------------|
| ID preservation (`sheet.id = property.id`) | Keep existing FKs/URLs/storage paths valid | **Drop.** No existing FKs/URLs/files to keep valid. Let `gen_random_uuid()` flow. |
| Additive columns + legacy retained | Avoid breaking live readers | **Drop.** No live readers. |
| Sync triggers (`sheet_id := property_id`) | Keep models equal during coexistence | **Delete.** No coexistence. |
| Provisioning triggers (property→sheet, prospect→row) | Let legacy writes feed new model | **Delete.** App will write the new model directly. |
| Equality-guard triggers (`sheet_id` must equal `property_id`) | Detect divergence during transition | **Delete.** Nothing to keep in sync; they actively block native writes. |
| Dual-path RLS (`can_access_property OR can_access_sheet`) | Authorize both code paths mid-cutover | **Replace** with sheet-only RLS. Simpler and faster. |
| Backfill + in-migration validation (migs 24/27) | Move + verify real rows | **Replace** with seed data. Keep the *assertion ideas* as test/CI checks, not migration logic. |
| FK/NOT NULL/unique on new tables (mig 25) | Integrity | **Keep** — but author them natively in the table definitions, not as `ALTER` afterthoughts. |
| Row⊂sheet ownership checks (mig 27) | Real integrity invariant | **Keep** as a permanent constraint/trigger — this protects architecture correctness, not legacy data. |

**Net:** the only safeguards worth carrying forward are the *intrinsic* ones (FKs, NOT NULL, uniqueness, row-belongs-to-sheet) — and those belong **in the native schema**, not in transitional `ALTER`/trigger layers.

---

## 3. Are dual-write / sync / provisioning / equality-guard triggers still valuable? — **No. Delete all of them.**

These eight-plus trigger functions (`sync_*_sheet_row_ids`, `provision_sheet_from_property`, `provision_row_from_prospect`, `validate_*_sheet_integrity` equality checks, `sync_sheet_assignment_from_property`) exist solely to make two models coexist safely while real data flows through the old one. With no data and no users:

- They protect **nothing**.
- They **actively harm** the goal: the equality guards (`sheet_id must match property_id`) and the provision-on-update trigger (which rewrites `rows.data` from prospect fields) **forbid native sheet/row writes and forbid inline cell editing** — i.e., they block the very Smartsheet behavior S0-1 exists to enable. The prior cutover plan correctly identified that these force a "read-only cutover"; greenfield lets us **remove the cause** instead of working around it.
- They add a large, permanent surface of plpgsql to maintain and reason about for no benefit.

**Keep exactly one idea from this group**, re-homed as a permanent invariant: a document/note's `row_id` must belong to its `sheet_id`. Implement it as a lightweight constraint/trigger on the native schema (not tied to `property_id`).

---

## 4. Read-only transition or aggressive cutover? — **Aggressive: full read + write cutover in one branch.**

The prior plan's read-only Migrate phase was *forced* by the equality-guard triggers (you couldn't write the new model). Remove the triggers and that constraint vanishes. Under greenfield:

- **Cut reads and writes over together.** `createRow/updateRow`, `createSheet`, document/note/favorite/recent/email/assignment writers all target the native tables directly. No dual-write, no staged read-then-write.
- **One branch is now appropriate.** The argument against a big branch was production blast-radius and reviewability under live data. With no data and no users, the change is internally consistent and testable via `db:reset` + `seed-beta`; a single coherent branch is *more* maintainable than four interdependent milestones plus a Contract migration.
- **This also pulls future work forward.** With provision/guard triggers gone, **inline cell editing (S1-1)** and **native sheet creation/templates (S0-2)** become immediately reachable, because nothing is overwriting `rows.data` or forcing legacy equality.

(If the team still wants smaller PRs for review hygiene, split by *surface* — schema, then grid, then panels/search/import — but as a **single native cutover**, not a coexistence ladder. The milestone *coexistence* is what to drop, not the option of multiple PRs.)

---

## 5. Should Properties/Prospects remain as compatibility layers during S0-1? — **No. Delete them as tables now.**

Keep them only as a **seed template**, not as schema:
- The "Prospect List" column set (Company/Contact/Status/Use/Website/Comments, with the status `select` options) becomes a **template definition** used to seed sheets — exactly the `provision_prospect_list_columns` payload from migration 27, relocated into application/seed code (and later the S0-2 template system).
- **Drop tables** `properties`, `prospects`, `property_assignments`; **drop enum** `prospect_status` (its values live in the status column's `config.options`).
- **`contacts`:** keep as a typed satellite (per the S0-1 design), but natively keyed to `row_id` **only** — drop `prospect_id` entirely. Greenfield lets us remove the legacy column instead of carrying it. (`contact`-type column stays derived from this satellite. Full "Contact Database as a sheet" remains S0-2.)
- **Re-pointed dependents** (`documents`, `notes`, `activity`, `favorites`, `recent_views`, `email_logs`) keep **only** `sheet_id`/`row_id`; drop `property_id`/`prospect_id` columns. No transitional dual columns.

Result: the schema reads as a clean Sheet engine with zero CRM archaeology — the long-term-maintainability win the request explicitly asks for.

---

## 6. Migrations 22–27: architecture-validation vs production-data protection

| Migration | Architecture-validation (keep) | Data-protection scaffolding (discard) |
|-----------|-------------------------------|----------------------------------------|
| **22 — enums_and_sheet_core** | **~95% keep.** `column_type`/`sheet_status` enums; `sheets`/`sheet_columns`/`rows` tables; JSONB `data`; generated `search_vector`s; indexes; one-primary partial unique. This *is* the native schema. | Minor: `workspace_id`/`folder_id` are S0-3 placeholders (fine to keep). |
| **23 — sheet_rls** | **~90% keep.** `can_access_sheet`, `sheet_id_for_row`; sheet/column/row policies. Becomes the *only* RLS layer. | The interim `can_access_sheet` referencing `property_assignments` (superseded). |
| **24 — backfill_sheets_rows** | The Prospect List **column template** payload (relocate to seed/app). | **Discard ~90%:** all backfill `INSERT … SELECT FROM properties/prospects` + in-migration count/id-equality assertions (no data to backfill; assertions become CI tests). |
| **25 — repoint_dependents** | The **target shape**: dependents carry `sheet_id`/`row_id`; `sheet_assignments` table; FKs/indexes — but authored natively. | **Discard:** add-column-then-backfill mechanics, dual NOT NULL, **all sync triggers**, parity assertions. |
| **26 — transition_rls_and_search** | **`search_global` rewrite** (sheet/row/contact/document) — keep, with notes restored; `sheet_assignments` RLS; storage policy on sheet access. | **Discard the dual-path** `can_access_property OR can_access_sheet` everywhere → collapse to `can_access_sheet` only. |
| **27 — sheet_integrity_checks** | **One invariant:** `row_id` ⊂ `sheet_id` ownership (re-home as native constraint). | **Discard ~90%:** provisioning triggers, equality guards (`sheet_id = property_id`), legacy validators, backfill verification block. |

**Summary:** 22 and 23 are the keepers (the actual architecture). 24–27 are ~85–90% production-migration scaffolding that greenfield renders dead weight. The valuable *ideas* in them (column template, dependent shape, search rewrite, ownership invariant) survive; the *mechanisms* (backfill, triggers, dual-path, guards) do not.

---

## 7. Does the fastest path to Sheet → Column → Row change under greenfield? — **Yes, substantially.**

**Recommended path: Re-Baseline the schema, then a single native cutover.**

### Phase G1 — Schema re-baseline (squash to a native baseline)
Because the database is disposable, rewrite the migration history so the schema is born native. Concretely:
- Author Sheet/Column/Row + dependents (`sheet_id`/`row_id` only) + `sheet_assignments` + sheet-only RLS + native `search_global` + the row⊂sheet ownership invariant as the **canonical schema** (reuse migrations 22/23 nearly verbatim as the foundation).
- **Remove** legacy table creation (`properties`/`prospects`/`property_assignments`) and the `prospect_status` enum from the migration set; **remove** migrations 24–27's scaffolding entirely.
- `contacts`/`documents`/`notes`/`activity`/`favorites`/`recent_views`/`email_logs` are defined once, already pointing at sheets/rows.
- Validate by `db:reset` (clean apply) + `db:seed-beta` rewritten to seed sheets/columns/rows directly.

*Primary recommendation* because it yields the cleanest long-term schema (no create-then-drop archaeology) and is **not materially slower** under greenfield — you are deleting far more than you are adding, and there is no data step.

> **Faster-but-messier alternative (G1′ — collapse-forward):** keep migrations 1–27 as-is and add a single teardown migration that drops legacy tables/columns/triggers/dual-path and finalizes sheet-only RLS. Lower edit effort, but leaves permanent "created in mig 2, dropped in mig 28" archaeology and layered CREATE/DROP RLS — worse maintainability for no data benefit. Choose this only if preserving linear migration history/tooling matters more than schema cleanliness. Given the stated priorities (architecture + maintainability), **G1 (squash) is preferred.**

### Phase G2 — Native application cutover (single branch, read + write)
- Add `Sheet`/`SheetColumn`/`SheetRow` domain types; regenerate `database.ts`.
- Rewrite actions to read **and write** the native model: `sheets.ts`/`rows.ts` (CRUD), repoint documents/notes/email/favorites/recents/assignments/search/import/dashboard. Delete property/prospect actions (or thin-alias during the branch, then remove).
- Convert `property-detail-view` → sheet-view and `property-prospects-grid` → **data-driven grid** (render from `sheet_columns` + `rows.data`; cell renderers per `column_type`; `contact` derived from satellite).
- Fix the search consumer (`sheet_id`, entity types, restore notes) — note this was a *live defect* (DEF1/DEF2) in the prior audit and is simply absorbed here.
- Rewrite `seed-beta.ts`, RLS tests, `integrity-check.ts`, `perf-benchmark.ts` against the native model.

### Phase G3 — Land S0-2/S1-1 groundwork "for free"
With no guard/provision triggers, **inline cell editing** (writes to `rows.data`) and **native sheet creation from templates** are now unblocked and can follow immediately.

### Effort comparison

| | Prior plan (production-grade) | Greenfield Re-Baseline |
|---|---|---|
| DB work | Migs 22–27 (done) **+ Migration 28 Contract** + dual-path/trigger maintenance | Squash to native baseline (reuse 22/23), delete scaffolding |
| App cutover | 4 read-only milestones **then** write-path switch at Contract | 1 native read+write branch (optionally split by surface) |
| Net remaining effort | ~Contract + 4 milestones ≈ **2–4 wks** + ongoing scaffolding cost | **~8–14 days**, cleaner result, unblocks S1-1/S0-2 |
| End-state schema | Native after Contract, with migration archaeology | Native from baseline, no archaeology |

Greenfield is **faster, cleaner, and removes the read-only constraint** — three wins, zero data risk.

---

## Revised recommendation (decision summary)

1. **Abandon Expand→Migrate→Contract.** It protects data that does not exist.
2. **Re-baseline the schema to native Sheet/Column/Row** (Phase G1, squash): reuse migrations 22/23, **delete** the legacy tables, the `prospect_status` enum, and migrations 24–27's backfill/sync/provision/guard/dual-path machinery. Keep only the intrinsic invariants (FKs, NOT NULL, uniqueness, row⊂sheet ownership) authored natively.
3. **Delete the trigger zoo.** None of the sync/provision/equality-guard triggers provide value; the guards actively block inline editing.
4. **Cut the application over in one branch, reads *and* writes**, optionally split into review-sized PRs by surface (schema → grid → panels/search/import) — but as a native cutover, not a coexistence ladder.
5. **Properties/Prospects stop existing as tables**; the Prospect List columns live on as a **seed/template definition**. `contacts` stays a satellite keyed to `row_id` only.
6. **Absorb the search defect fix** (DEF1/DEF2) into G2 — it stops being a special concern.
7. **Net:** ~8–14 days to a clean, native, maintainable Sheet engine — *faster* than finishing the production-grade plan — and it lands the groundwork for inline editing (S1-1) and templates (S0-2) at the same time.

**One decision for you:** Phase G1 squash (recommended — cleanest schema) vs G1′ collapse-forward (one teardown migration — least edit churn, but permanent archaeology). Both reach the same runtime schema; they differ only in migration-history cleanliness. Given the stated priority on long-term maintainability, I recommend the squash.
