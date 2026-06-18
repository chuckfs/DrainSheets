# DrainSheets — Re-Audit: Smartsheet Replacement Strategy

**Supersedes the strategic framing of:** `PRODUCT_AUDIT_Smartsheet_Parity.md`, `ROADMAP_PARITY.md`
**Date:** June 18, 2026
**New thesis being evaluated:** DrainSheets is *not* "a CRE CRM with Smartsheet-inspired screens." It is "a focused replacement for the subset of Smartsheet that brokers actually use." The product should think **Workspace → Folder → Sheet → Row** first, with CRM entities (Property/Prospect/Contact) surviving only as storage detail.

**Method:** Fresh read of the actual repository (git history, migrations, server actions, components, tests). The four claimed completions were verified in code, not taken from roadmap status. The broker video is treated as the source of truth for "what must exist."

---

## 0. Verification of claimed completions (P0-1 … P0-4)

All four are **real and substantively implemented** — not stubs. Evidence:

| Item | Verdict | Evidence in repo |
|------|---------|------------------|
| **P0-1 Document preview** | ✅ **Done** | Commit `56754c7`. Components: `document-preview.tsx`, `document-preview-canvas.tsx`, `document-preview-dialog.tsx`, `document-preview-layout.tsx`, `document-preview-sidebar.tsx`, `documents-list-with-preview.tsx`. Server: `generatePreviewUrl()` (inline signed URL) + `getPreviewKind()` (pdf/image/unsupported). **View logging confirmed:** `logDocumentViewed()` writes `action:"viewed"` to `activity`. |
| **P0-2 Send update by email** | ✅ **Done** | Commit `337663c`. `actions/email.ts`: Resend client, `loadEmailAttachments()` (signed content), `sendQuickUpdate()`, `getDefaultQuickUpdateSubject()`. Migration `…20_email_logs.sql` (RLS: org-member + `can_access_property`). UI: `email/send-update-dialog.tsx`. Property + prospect send flows present. |
| **P0-3 Server-backed favorites & recents** | ✅ **Done** | Migration `…21_favorites_recent_views.sql` (two tables, full RLS incl. `can_access_property`). `actions/favorites.ts` (`toggleFavorite`, `listFavorites`, …) and `actions/recents.ts` (`trackRecentView`, `listRecentViews`). localStorage path retired. Cross-device sync is real (DB-backed). |
| **P0-4 CSV/XLSX import** | ✅ **Done** | Commit `352ffbb`. `actions/import.ts`: `executeImport()` inserts properties/prospects/contacts, `previewImportKeys()`, `getExistingDedupeKeys()`, per-mode permission checks, activity logging. `lib/import/{mapping,parser,dedupe}.ts`. UI: 6 `import/*` step components. **Tests:** `tests/import/{mapping,parser,preview,dedupe,permissions}.test.ts`. |

**Net:** the previous P0 tier is genuinely cleared. The document workflow in particular is now strong. Quality is consistent with the rest of the codebase (RLS-first, Zod-validated, server actions). Good work — this is not vaporware.

But clearing P0 also exposes the real ceiling, which is **architectural, not feature-level.** That is what the rest of this document is about.

---

## 1. Architecture Reassessment

### 1.1 The single most important finding

**DrainSheets currently supports exactly one kind of sheet.** Every "sheet" in the app is a **Property**, and every Property renders the *same hard-coded grid*: `# · Company · Contact · Status · 📎 · 💬 · Use · Website · Comments` (literally fixed in `property-prospects-grid.tsx`; verified — there is no column-definition table anywhere in `supabase/migrations` or `src/`).

The broker video shows the opposite reality. In ~2 minutes we see **at least three structurally different sheets**:

| Broker sheet (from video) | Its columns | Its "rows" are… |
|---------------------------|-------------|-----------------|
| 2026 Luxury Retail Tenant Prospects | Tenant/Company · Use · Website · Contact Name · Title | tenants |
| Michael Grillo Real Estate Search | **Property Address · Purchase Price/PPSF · NNN Expenses** | properties/deals |
| A-Team Master Contact Database | (a contact list) | contacts |

Today, only the first one maps cleanly onto DrainSheets. The deal sheet (price/PPSF/NNN) and the contact database **cannot be represented as first-class sheets** — their columns don't exist in the schema and can't be created without a code change. That is the gap that caps Smartsheet parity no matter how many features get polished.

### 1.2 Is the Property/Prospect/Contact architecture sufficient?

**No — not for a Smartsheet replacement.** It is sufficient for *one* CRM use case (tenant prospecting). It is a **fixed-schema CRM**, and Smartsheet is a **user-defined-schema grid tool**. The mismatch is fundamental:

- A Smartsheet user creates a sheet and defines whatever columns they want.
- A DrainSheets user gets one sheet shape, decided by the developer.

Everything hangs off `property_id`: prospects, contacts, documents, notes, assignments, favorites, recents, email_logs. The Property *is* the de-facto Sheet. That's actually convenient — but it means the system can only ever have prospect-shaped sheets.

### 1.3 Should "Sheet" become a first-class concept?

**Yes — this is the central recommendation.** Reframe the hierarchy:

```
Today (CRM):        Organization → Property → Prospect → Contact
Target (Smartsheet):Organization → Workspace → Folder → Sheet → Row → Cell(column)
```

The cleanest mapping that reuses existing investment:

| Smartsheet concept | Becomes (DrainSheets) | Reuse of current code |
|--------------------|------------------------|------------------------|
| Workspace | new `workspaces` table | new |
| Folder | new `folders` (self-nesting or under workspace) | new |
| **Sheet** | generalize **Property** → `sheets` | property detail view = "open sheet" already exists |
| Columns | new `sheet_columns` (typed: text/number/contact/status/url/currency/date…) | grid renderer already exists; make it data-driven |
| **Row** | generalize **Prospect** → `rows` | prospect grid row already exists |
| Cell values | `row_cells` (or `rows.data JSONB`) | — |
| Row attachments (Row/Sheet/All) | already modeled via `prospect_id` / `property_id` | **the Attachments panel already thinks in Row/Sheet/All** |
| Row comments | Notes (already per-prospect/per-property) | reuse |

Crucially, **the UI already speaks Smartsheet.** The attachments panel has Row/Sheet/All tabs; the property detail is an "open sheet"; recents/favorites/share/manage-access/preview/email all exist. The thing that's missing is underneath: a **generic, typed sheet+column+row engine** instead of three hard-coded tables.

### 1.4 Should "Templates" become a first-class concept?

**Yes — and templates are how you keep the CRE value without hard-coding it.** Instead of baking "Prospect" into the schema, ship **Sheet Templates**: a "Tenant Prospect List" template (Company/Use/Website/Contact/Status), a "Deal Tracker" template (Address/Price/PPSF/NNN/Stage), a "Contact Database" template. The current Property/Prospect/Contact field sets become *seed templates*, not the architecture. This directly converts the previous roadmap's "P1-1 CRE Deal Fields" from a one-off schema change into a reusable template (see §5).

Templates also unlock **sheet duplication** ("duplicate this sheet, keep columns, drop rows") and **saved layouts/custom views** (per-user column order/visibility/sort/filter), both of which the broker's workflow implies (Favorites of specific sheets, repeated sheet structures across franchisees: "Harsh Shah – Kids Play / Juice House / Goddard" are clearly the same template reused).

### 1.5 Decisions that were right as a CRM but are now liabilities

| Decision (CRM-correct) | Why it's now a problem (Smartsheet-replacement) |
|------------------------|--------------------------------------------------|
| Fixed `properties`/`prospects`/`contacts` tables | Can't represent arbitrary sheets/columns; only prospect-shaped sheets exist |
| Hard-coded grid columns | No per-sheet columns; deal sheets/contact sheets impossible without code |
| `prospect_status` **enum** (researching/contacted/…) | A status *column* should be user-configurable per sheet, not a DB enum |
| Everything FK'd to `property_id` | A "sheet" can't exist outside the property concept; no workspace/folder grouping |
| Sharing = **property-level editor assignment** only | Smartsheet shares at Workspace, Folder, *and* Sheet level, with role tiers incl. Viewer |
| Flat property list (no hierarchy) | Brokers navigate Workspace→Folder trees; flat list breaks at scale |
| 3-role org-global model (owner/admin/editor) | Smartsheet roles are *per-resource* (Owner/Admin/Editor/Viewer/Commenter on a given sheet) |

**None of this means the prior work was wrong** — it was the right MVP for a CRM. Under the new thesis, these are the things to *evolve*, not defend.

### 1.6 Architectural recommendation (opinionated)

Adopt a **hybrid generic-sheet engine**, not a rename and not a full EAV rebuild:

1. Introduce `workspaces`, `folders`, `sheets`, `sheet_columns`, `rows`, and `row_cells` (or `rows.data JSONB` for speed of delivery).
2. Migrate `properties → sheets`, `prospects → rows` under a system "Prospect List" template; preserve all existing data.
3. Re-point `documents/notes/email_logs/favorites/recent_views` from `property_id/prospect_id` to `sheet_id/row_id` (the Row/Sheet attachment model already matches).
4. Keep typed read-models/views for performance where needed, but make the **grid data-driven from `sheet_columns`.**
5. Generalize sharing to `sheet_shares` + (later) workspace/folder inheritance, and add a **Viewer** role.

This is a real migration, but it's *evolution of a clean codebase*, not a rewrite — the UI, RLS patterns, and server-action structure carry over.

> **CRM-orthodoxy callout (Assumption C):** A traditional CRM would double down on Property→Prospect→Contact with richer typed fields, pipelines, and reports. That is the *wrong* direction here: it moves toward CRM best practice and *away* from the broker's observed Smartsheet workflow (arbitrary sheets, columns, and folders). Recommend explicitly **not** investing further in deepening the fixed CRM schema.

---

## 2. Smartsheet Parity Score (updated, post P0-1…P0-4)

Scored against the broker's **observed** workflow only (enterprise features the broker never touched are excluded from the denominator by design).

| Parity dimension | Before P0 | **Now** | What moved it / what caps it |
|------------------|:--:|:--:|------------------------------|
| **Document parity** | 55% | **82%** | ▲ Preview + view-logging + secure download + Row/Sheet/All attachments. Caps: no versioning, no editable description. |
| **Collaboration parity** | 45% | **65%** | ▲ Email "Quick Update" w/ attachments + email_logs; notes-as-comments; activity feed. Caps: no threaded per-row comments, @mentions, in-app notifications. |
| **Navigation parity** | 40% | **58%** | ▲ Synced Recents + Favorites; global search. Caps: **no Workspace/Folder tree** (flat list); icon rail only. |
| **Workflow parity** (daily loop) | 65% | **74%** | ▲ The find→read→share→email loop is now mostly intact. Caps: no inline cell editing; can't recreate non-prospect sheets. |
| **Sharing parity** | 50% | **52%** | ~ Share + Manage Access exist (property/editor). Caps: no Workspace/Folder/Sheet-level sharing, no copy-link/general access, no Viewer role. |
| **Sheet parity** | 30% | **30%** | ✗ **Unchanged and now the binding constraint.** One fixed sheet schema; no custom columns, templates, duplication, or custom views. |

**Headline:**
- **Daily-loop parity (find a known sheet, work it, share, email): ~75%.** Genuinely usable.
- **Structural parity (create the sheets a broker actually keeps): ~32%.** This is the wall.
- **Blended observed-workflow parity: ~62%** (up from ~58% pre-P0). The blended number barely moved despite four solid features, *because the remaining gaps are structural, not feature-level.*

---

## 3. Feature Inventory (every workflow observed in the broker video)

Status: **Implemented · Partial · Missing · Redesign** (Redesign = exists but the CRM shape must change to match Smartsheet).

| # | Feature (from video) | Status | Notes |
|---|----------------------|--------|-------|
| 1 | Recents (home landing) | **Implemented** | Now DB-backed + synced (`recents.ts`). |
| 2 | Favorites / starred | **Implemented** | Now DB-backed (`favorites.ts`). Missing: a dedicated "Favorites" tree view. |
| 3 | Workspaces | **Missing** | No `workspaces` table or UI. |
| 4 | Folders (nested) | **Missing** | No folder concept; properties are flat. |
| 5 | Browse tree navigation | **Missing** | Icon rail is flat; no hierarchy tree. |
| 6 | `+ Create` (Sheet/Folder/Workspace/Import) | **Partial / Redesign** | Create menu exists (Property/Prospect/Contact/Upload + Import). No Sheet/Folder/Workspace creation. |
| 7 | Open a Sheet → Grid view | **Implemented (as Property)** | Property detail = "open sheet" with grid + panel. |
| 8 | Grid columns (per-sheet, custom) | **Redesign** | Columns are hard-coded; not per-sheet. Core architectural gap. |
| 9 | CRE columns: Company/Use/Website/Contact/Title | **Implemented** | Maps to prospect+contact fields. |
| 10 | CRE columns: Address/Price/PPSF/NNN | **Missing / Redesign** | Not representable today; needs Sheet Templates + columns. |
| 11 | Rows (records) | **Implemented (as Prospects)** | Need to generalize to `rows`. |
| 12 | Inline cell editing | **Missing** | Edits go through forms, not in-grid. |
| 13 | Sort | **Implemented** | Column-preset sorts. |
| 14 | Filter | **Partial** | Single-field text filter; not multi-condition. |
| 15 | Cell formatting (fonts/colors) | **Missing (intentional)** | Spreadsheet bloat — do not build. |
| 16 | Row-level Attachments (Row/Sheet/All) | **Implemented** | Faithful; panel already scoped Row/Sheet/All. |
| 17 | Attach files to row | **Implemented** | Upload w/ prospect/property scope. |
| 18 | **Document preview (PDF/image, zoom)** | **Implemented** | P0-1 — new. View logging included. |
| 19 | Attachment metadata (size/uploader/date) | **Partial** | Has size/uploader/date; **no editable description** (seen in video). |
| 20 | Document versioning (`Version 1 ▾`) | **Missing** | One file = one row. |
| 21 | Download / delete attachment | **Implemented** | Signed-URL download; delete. |
| 22 | Row comments / discussion | **Partial** | Notes ≈ comments; no threaded per-row discussion / @mentions. |
| 23 | **Send row update by email** | **Implemented** | P0-2 — new. To/Subject/Message/Cc/include fields+attachments; email_logs. |
| 24 | Share dialog (add people) | **Partial / Redesign** | Assigns existing org editors; no email-a-new-person, no copy-link/general access. |
| 25 | Manage access (per-user roles) | **Partial / Redesign** | Org roles + property assignment; no per-sheet roles, no Viewer. |
| 26 | Workspace-level sharing | **Missing** | No workspace to share. |
| 27 | Roles Owner/Admin/Editor | **Implemented** | 3-layer RLS; verified by tests. |
| 28 | Viewer / read-only role | **Missing** | Needed for client-facing read-only sheets. |
| 29 | Global search | **Implemented** | FTS across 5 entity types. |
| 30 | Activity / audit | **Partial** | Global/property feed + now document-view events; no per-row timeline UI. |
| 31 | CSV/XLSX import (migration) | **Implemented** | P0-4 — new, with mapping/preview/dedupe/tests. |
| 32 | Sheet templates | **Missing** | No template concept. |
| 33 | Sheet duplication | **Missing** | Can't duplicate a sheet/structure. |
| 34 | Custom/saved views (column order/visibility/filter) | **Missing** | No saved layouts. |
| 35 | Enterprise: Automation/Forms/Reports/Dashboards/Dynamic View/WorkApps/Portfolios/Scenario Plans | **Missing (intentional)** | Never used by broker — keep excluded. |

---

## 4. Gap Analysis — what blocks "a broker could abandon Smartsheet today"

The test: *Could a CRE broker do their entire observed daily workflow inside DrainSheets and cancel Smartsheet?* **Not yet** — and the blockers are now mostly structural.

**Tier-1 blockers (a broker hits these in the first hour):**

1. **Can't create the sheets they actually keep.** Only prospect-shaped sheets exist. A broker cannot make the "Michael Grillo Deal Search" (Address/Price/PPSF/NNN) or a standalone "Master Contact Database." → *Needs: first-class Sheets + custom columns + templates (§1).* **This is the #1 blocker.**
2. **No Workspace/Folder organization.** Brokers live in a Workspace→Folder tree ("A-TEAM Master INFO → A-Team Franchisee Pipeline"). A flat property list is disorienting and breaks at 30–50+ sheets. → *Needs: workspaces + folders + tree nav.*
3. **No inline cell editing.** The grid looks like Smartsheet but edits require opening a form. For data-entry-heavy brokers this is the most felt day-to-day friction. → *Needs: in-grid editing.*

**Tier-2 blockers (felt within the first week):**

4. **Sharing granularity & Viewer role.** Can't share a single sheet (only assign editors to a property), can't grant read-only, can't share a whole workspace. Brokers share specific sheets with specific people, including read-only client access. → *Needs: sheet-level shares + Viewer + (later) workspace inheritance + copy-link.*
5. **No sheet duplication / templates in the hands of users.** Franchise brokers clearly reuse one structure across many sites ("Kids Play / Juice House / Goddard"). Rebuilding columns each time is a non-starter. → *Needs: duplicate sheet + save-as-template.*

**Tier-3 (polish that affects trust, not viability):**

6. Document versioning + editable attachment description (both seen in video).
7. Threaded per-row comments + in-app notifications (collaboration depth).
8. Per-row activity timeline (the data exists; needs surfacing).

> **Not blockers (do not let them back onto the roadmap):** formulas, cell formatting, Gantt, automation, forms, reports/chart dashboards, WorkApps, portfolios, scenario plans. The broker used none of them.

---

## 5. Roadmap Rewrite (ordered by Smartsheet-workflow impact → broker adoption → architectural importance)

The previous roadmap was CRM-shaped. Re-cast it around the Sheet model. **Items are renumbered S-x (Sheet era).**

### Tier S0 — The architectural pivot (do this before more features)

**S0-1 · First-class Sheet + Column engine** *(was: nothing — this is new and now #1)*
- *Why first:* It is the binding constraint on every parity dimension. Until sheets have user-defined columns, brokers cannot recreate their world. Every later item (sharing, duplication, views) attaches to this.
- *Build:* `sheets`, `sheet_columns` (typed: text/number/currency/date/url/contact/select-status), `rows`, `row_cells` (or `rows.data JSONB`); data-driven grid renderer; migrate `properties→sheets`, `prospects→rows` under a seeded "Prospect List" template (no data loss); re-point documents/notes/email/favorites/recents to `sheet_id`/`row_id`.
- *Effort:* **15–25 days** · High (it's the foundation). *Mitigation: the UI, RLS patterns, and attachment Row/Sheet scoping already exist.*

**S0-2 · Sheet Templates (incl. CRE seed templates)** *(replaces old P1-1 "CRE Deal Fields")*
- *Why this replaces P1-1:* Hard-coding price/PPSF/NNN onto `properties` solves one sheet for one client forever. A **"Deal Tracker" template** (Address/Price/PPSF/NNN/Stage) plus **"Tenant Prospect List"** and **"Contact Database"** templates solve the *general* problem and ship the CRE value as data, not schema. Same effort, vastly more leverage.
- *Build:* `sheet_templates` + "create sheet from template" + seed CRE templates from the broker's observed sheets.
- *Effort:* **4–6 days** · Medium (depends on S0-1).

**S0-3 · Workspaces + Folders + tree navigation** *(was P2-1 — moved much earlier)*
- *Why earlier:* It's Tier-1 blocker #2 and the literal top of the broker's hierarchy. Recents/Favorites already exist but have nothing to organize. Hierarchy is identity for a Smartsheet user.
- *Build:* `workspaces`, `folders` (nestable), assign sheets to folders; replace/extend the flat rail with a Browse tree; workspace/folder in `Create` menu.
- *Effort:* **8–12 days** · Medium-High (depends on S0-1 for the sheet FK).

### Tier S1 — Make the grid behave like Smartsheet

**S1-1 · Inline cell editing** *(was P1-2 — keep, now data-driven via S0-1)* — edit cells in place w/ optimistic save + keyboard nav. **6–9 days** · Med-High.

**S1-2 · Sheet-level sharing + Viewer role + copy-link** *(replaces/expands old P2-3 + CRM share dialog)* — `sheet_shares` with per-resource roles (Owner/Admin/Editor/**Viewer**/Commenter), copy-link/general-access toggle; later inherit from folder/workspace. **6–9 days** · Medium (RLS-heavy — test hard). *CRM callout: keep org roles underneath, but sharing must become per-sheet to match Smartsheet.*

**S1-3 · Sheet duplication + save-as-template** *(new, implied by franchise reuse)* — duplicate sheet (columns ± rows); promote a sheet to a template. **3–5 days** · Medium (depends on S0-1/S0-2).

**S1-4 · Custom/saved views** *(new)* — per-user column order/visibility/sort/saved filters per sheet. **5–8 days** · Medium.

**S1-5 · Multi-condition filters** *(was P1-3)* — faceted filters on typed columns. **2–3 days** · Low.

### Tier S2 — Collaboration & document depth

**S2-1 · Threaded per-row comments + @mentions + in-app notifications** *(expands old P2-4 + collaboration gaps)* — **8–12 days** · Medium.
**S2-2 · Per-row activity timeline** *(was P1-4; data already exists)* — surface `activity` per row/sheet. **2–4 days** · Low.
**S2-3 · Document versioning + editable description** *(was P2-2 + metadata gap)* — version stack + description field. **4–6 days** · Medium.

### Tier S3 — Explicitly rejected (unchanged from prior audit)

Formula engine · cell formatting · Gantt/scheduling · automation builder · Forms · Connections · Dynamic View · WorkApps · Portfolios · Scenario Plans · chart dashboards · Kanban. *Building any of these re-creates the bloat the client pays $400/mo to escape; none appeared in the broker's actual use.*

### What changed vs. the old roadmap, and why

| Old item | New status | Reason |
|----------|-----------|--------|
| P1-1 CRE Deal Fields | **→ S0-2 Sheet Templates** | Generalize CRE fields into reusable templates instead of hard-coding one sheet. |
| P2-1 Workspace hierarchy | **→ S0-3 (moved to Tier 0)** | It's a Tier-1 broker blocker and top of the hierarchy, not a nice-to-have. |
| (none) Dynamic columns | **→ S0-1 (new #1)** | The binding constraint; without it nothing else achieves sheet parity. |
| P2-3 Link sharing/Viewer | **→ S1-2 (elevated)** | Per-sheet sharing + Viewer is core to the broker share flow, not optional. |
| P1-2 Inline editing | **→ S1-1 (kept)** | Still high-value; now rendered from `sheet_columns`. |

---

## 6. Final Recommendation

**If the objective is a focused Smartsheet replacement for CRE brokers — not a CRM — build the Sheet engine next. Specifically S0-1 → S0-2 → S0-3, in that order, before any further feature polish.**

Justification from the three sources:

- **From the codebase:** P0-1…P0-4 are done and good, yet blended observed-workflow parity barely moved (≈58% → ≈62%). That's the tell: the remaining distance is *structural*. The app has one hard-coded sheet (`property-prospects-grid.tsx`), no column-definition table, and no workspace/folder/sheet tables (verified by grep across all migrations and `src/`). You cannot feature your way to parity on top of a single fixed schema.
- **From the broker video:** In two minutes the broker used three structurally different sheets and navigated a Workspace→Folder tree with Favorites. Two of those three sheets are impossible to represent today. The video's "source of truth" is unambiguous: brokers think in **sheets and folders**, not in properties and prospects.
- **From the current state:** The expensive, parity-critical UI is *already built* — Smartsheet-style grid, Row/Sheet/All attachments, preview, share/manage-access, recents, favorites, email. They are currently wired to a CRM skeleton. Swapping that skeleton for a generic Sheet engine is the highest-leverage move available: it turns work you've already paid for into genuine Smartsheet parity.

**Concretely, the next sprint:**
1. **S0-1** generic Sheet/Column/Row engine, migrating Property→Sheet and Prospect→Row with zero data loss.
2. **S0-2** seed the broker's real sheets as **templates** (Tenant Prospect List, Deal Tracker, Contact Database) — this is where the old "CRE Deal Fields" work lands, but reusable.
3. **S0-3** Workspaces + Folders + a Browse tree so the sheets have a home.

Do that, and DrainSheets stops being "a CRM that looks like Smartsheet" and becomes "the subset of Smartsheet brokers actually use." Keep deepening Property/Prospect/Contact instead, and you'll build an excellent CRM that brokers still won't adopt — because it can't hold their sheets.

> **One honest caveat:** S0-1 is a real migration with real risk (re-pointing documents/notes/email/favorites/recents, regenerating RLS, rewriting the grid as data-driven). It should be done deliberately, behind tests, with the existing RLS suite extended to the new tables. But it is *evolution of a clean, well-tested codebase* — not a rewrite — and it is the only path to the stated goal.
