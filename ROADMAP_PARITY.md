# DrainSheets — Smartsheet Parity Roadmap

**Companion to:** `PRODUCT_AUDIT_Smartsheet_Parity.md`
**Date:** June 18, 2026
**Structure:** Priority tiers (P0 → P3). No calendar sequencing — items within a tier can be parallelized or reordered by the team. Effort is in ideal engineering-days for one mid/senior full-stack dev on this stack (Next.js 15 + Supabase).

**Goal of this roadmap:** close the specific, nameable gaps between DrainSheets and the CRE broker's *actual* Smartsheet workflow — without rebuilding the enterprise bloat the client is paying to escape.

---

## How to read this

Each item has:
- **Why** — the user story + business value.
- **Build** — concrete, checkable scope.
- **Depends on** — hard prerequisites.
- **Effort / Complexity** — days + technical risk.
- **Touches** — real files/migrations to change.
- **Done when** — the exit criterion that proves it works.

**Status keys you can update in-place:** `[ ] todo` · `[~] in progress` · `[x] done`

---

## Tier summary

| Tier | Theme | Items | Effort (days) | Unlocks |
|------|-------|:--:|:--:|---------|
| **P0** | Pilot blockers | 5 | **17–27** | A real paying brokerage pilot |
| **P1** | High-ROI usability | 4 | **11–18** | A confident v1 that *feels* like Smartsheet |
| **P2** | Nice to have | 5 | **17–27** | Scale + client-facing polish |
| **P3** | Explicit rejects | 7 | **0 (do not build)** | Keeps the product lean |

**Recommended cut line for the brokerage pilot:** all of **P0**, plus **P1-1 (CRE deal fields)**. Everything else can follow the pilot's feedback.

---

## P0 — Must build before a broker pilot

> These five are blockers, not improvements. Without them, daily brokerage work — and the migration off Smartsheet itself — is not viable.

### P0-1 · In-app document preview `[ ]`
- **Why:** Brokers open OMs, flyers, and site plans constantly — it's the single highest-frequency document action in the recording. Today every file must be downloaded to be read, which will feel broken on day one.
- **Build:**
  - [ ] Inline viewer for PDF and images (the common OM/flyer cases); graceful "Download to view" fallback for other types.
  - [ ] Render from a signed URL with inline content-disposition (don't force download).
  - [ ] Add preview to the document detail page **and** as a click-through from the attachments panel.
  - [ ] Zoom / fit controls; show existing metadata (uploader, date, size) beside the preview.
- **Depends on:** nothing (signed-URL plumbing already exists).
- **Effort / Complexity:** **3–5 days** · Medium.
- **Touches:** `src/app/(dashboard)/documents/[id]/page.tsx`, new `src/components/documents/document-preview.tsx`, `src/components/layout/attachments-panel.tsx`, `src/actions/documents.ts` (`generateDownloadUrl` → add inline variant).
- **Done when:** A broker clicks `OM 675 Oceanport Way.pdf` and reads it in-app, zoomed, without a download.

### P0-2 · Send update by email `[ ]`
- **Why:** The broker composes and sends a "Quick Update" (row data + attachment) live in the video. DrainSheets has zero email capability today, forcing a bounce to Outlook + manual attaching.
- **Build:**
  - [ ] Resend integration (server action + secret).
  - [ ] "Send update" dialog from a property/prospect: To (org users + free email), Subject (pre-filled), Message, Cc-me, choose included fields + attachments, layout option.
  - [ ] Attach files via signed URLs.
  - [ ] Persist an `email_logs` record (already a planned future table) for audit.
- **Depends on:** P0-5 (real SMTP/Resend keys in a deployed env for live sending; can be built/tested in staging).
- **Effort / Complexity:** **4–6 days** · Medium.
- **Touches:** new `src/actions/email.ts`, new `src/components/email/send-update-dialog.tsx`, new migration `email_logs`, env/secrets, `src/components/properties/property-detail-view.tsx`.
- **Done when:** Sending a "Quick Update" delivers an email (cc-me works) and writes an `email_logs` row.

### P0-3 · Server-backed Favorites + Recents `[ ]`
- **Why:** Both exist but are `localStorage`-only — they vanish on a new device and can't power team-shared favorites. This is the broker's primary navigation pattern *before* any data work.
- **Build:**
  - [ ] `favorites` and `recent_views` tables (user_id + property_id + timestamp), with RLS.
  - [ ] Replace localStorage reads/writes with server actions (keep optimistic UI).
  - [ ] Recents page + a Favorites view read from the DB.
- **Depends on:** nothing.
- **Effort / Complexity:** **2–3 days** · Low–Medium.
- **Touches:** new migration (2 tables), `src/lib/favorites.ts`, `src/lib/recent-properties.ts`, `src/app/(dashboard)/page.tsx`, `src/components/recents/*`, `src/components/properties/properties-table.tsx`.
- **Done when:** A user stars a property on one device and sees it starred on another after login.

### P0-4 · CSV / Excel import (migration) `[ ]`
- **Why:** The literal precondition to cancel Smartsheet. The project's success metric is "client stops using Smartsheet" — impossible without moving years of sheets.
- **Build:**
  - [ ] Upload CSV/XLSX → parse → column-mapping UI → preview → commit.
  - [ ] Map to Property / Prospect / Contact; validate with existing Zod schemas.
  - [ ] Duplicate detection (e.g. by company name within a property).
  - [ ] Batched inserts that respect RLS; import summary (created/skipped/errored).
- **Depends on:** nothing (parsing can use SheetJS).
- **Effort / Complexity:** **5–8 days** · Medium–High.
- **Touches:** new `src/actions/import.ts`, new `src/components/import/*`, `src/lib/validations/crm.ts`, optional staging table.
- **Done when:** Owner uploads a real Smartsheet export and the resulting properties/prospects/contacts match, with a clear dedupe/error report.

### P0-5 · Production infrastructure `[ ]`
- **Why:** Currently local/staging only (`BETA_READINESS.md` scores production readiness 40/100). Non-negotiable for a paid pilot.
- **Build:**
  - [ ] Remote Supabase project + run migrations; Vercel project + GitHub deploy.
  - [ ] Production env vars/secrets; automated DB backups.
  - [ ] Error monitoring (Sentry or equivalent).
  - [ ] Rate-limiting on auth routes.
  - [ ] CI: `typecheck`, `lint`, `build`, `test:rls`.
  - [ ] First owner account provisioned on production.
- **Depends on:** nothing (do early — P0-2 needs a deployed env to send mail).
- **Effort / Complexity:** **3–5 days** · Low–Medium (ops).
- **Touches:** infra/config, `src/lib/supabase/*`, `middleware`, CI workflow, `.env` management.
- **Done when:** The app runs on a backed-up, monitored production URL with RLS tests green in CI.

**P0 total: 17–27 days.**

---

## P1 — High-ROI usability gains

> Not blockers, but the difference between "works" and "feels like Smartsheet." Pull **P1-1** into the pilot cut.

### P1-1 · CRE deal fields on properties `[ ]` ← *recommended for pilot*
- **Why:** The deal sheet in the video (Purchase Price / PPSF / NNN Expenses) has no structured home today — those values would live in free-text. Making them first-class fields is what makes DrainSheets a *CRE* CRM, not a generic one.
- **Build:**
  - [ ] Add structured fields: purchase price, price-per-SF (PPSF), NNN expenses, deal stage (and any others confirmed with the client).
  - [ ] Surface in property form + as grid columns; include in search where useful.
- **Depends on:** nothing.
- **Effort / Complexity:** **2–3 days** · Low.
- **Touches:** new migration (columns), `src/components/properties/property-form.tsx`, properties grid/table, `src/lib/validations/crm.ts`.
- **Done when:** A property shows "$18.45 PSF / $7.70 NNN" as structured, sortable data.

### P1-2 · Inline grid cell editing `[ ]`
- **Why:** The grid *looks* like Smartsheet but every edit opens a form — the biggest behavioral gap. Brokers expect to type into cells.
- **Build:**
  - [ ] Editable cells for at least Status, Category, Comments (expand later).
  - [ ] Optimistic update + server action + RLS-safe writes; keyboard nav.
- **Depends on:** nothing.
- **Effort / Complexity:** **5–8 days** · Medium–High.
- **Touches:** `src/components/properties/prospect-grid-row.tsx`, `src/components/properties/property-prospects-grid.tsx`, `src/components/data/smartsheet-grid.tsx`, `src/actions/prospects.ts`.
- **Done when:** Editing a prospect's status in-grid saves without opening a form.

### P1-3 · Multi-condition filters `[ ]`
- **Why:** Today's filter is a single text query; brokers expect status/category facets. Data + indexes already exist.
- **Build:**
  - [ ] Faceted filters (status, category, deal stage) layered onto existing sort/search, persisted in query params.
- **Depends on:** P1-1 (for deal-stage facet).
- **Effort / Complexity:** **2–3 days** · Low.
- **Touches:** `src/components/data/list-grid-toolbar.tsx`, list pages, `src/actions/prospects.ts` / `properties.ts`.
- **Done when:** A user filters to "interested + retail" and the grid + pagination respect it.

### P1-4 · Per-row activity timeline + attachment description `[ ]`
- **Why:** Brokers like seeing "who changed what" on a deal. The `activity` table is already row-aware (`entity_id`, `property_id`) — this is mostly a UI surfacing. Add the editable attachment *Description* seen in the video.
- **Build:**
  - [ ] Per-property / per-prospect activity timeline view.
  - [ ] Editable `description` on documents (column + UI).
- **Depends on:** nothing.
- **Effort / Complexity:** **2–4 days** · Low.
- **Touches:** `src/lib/activity/*`, `src/components/activity/activity-feed.tsx`, detail views, documents migration + `src/actions/documents.ts`.
- **Done when:** A prospect detail shows its own activity history, and an attachment can carry a description.

**P1 total: 11–18 days.**

---

## P2 — Nice to have

> Valuable, but defer until after the pilot proves demand.

### P2-1 · Workspace / folder grouping `[ ]`
- **Why:** Properties are a flat list; brokers in the video navigate a nested workspace tree. Matters most past ~30–50 properties.
- **Build:** `workspaces`/`folders` table, tree UI in the rail, optional workspace-level sharing.
- **Effort / Complexity:** **5–8 days** · Medium.
- **Touches:** new migration, `src/components/layout/icon-rail.tsx` (or new tree nav), properties list, sharing.
- **Done when:** Properties can be grouped into named workspaces and browsed as a tree.

### P2-2 · Document versioning `[ ]`
- **Why:** Smartsheet stacks versions (`Version 1 ▾`); today re-uploading is an unrelated row. Low daily frequency.
- **Build:** version group on `documents` (group_id + version_no); "upload new version"; version history list.
- **Effort / Complexity:** **3–5 days** · Medium.
- **Touches:** documents migration, `src/actions/documents.ts`, attachments panel + document detail.
- **Done when:** Uploading a new version of an OM keeps history under one entry.

### P2-3 · Link sharing + Viewer role `[ ]`
- **Why:** Useful for sharing a read-only sheet with a client. Adds the missing read-only tier (current roles: owner/admin/editor only).
- **Build:** read-only `viewer` role (or per-resource grant) + tokenized read-only link with expiry.
- **Effort / Complexity:** **4–6 days** · Medium (touches RLS — test carefully).
- **Touches:** role enum/RLS migrations, `src/lib/permissions/*`, share dialog, new public read route.
- **Done when:** A client opens a link and can view (not edit) a property sheet.

### P2-4 · In-app notifications `[ ]`
- **Why:** Smartsheet's bell; pairs naturally with email (P0-2).
- **Build:** `notifications` table + bell UI + mark-read; trigger on shares/assignments/uploads.
- **Effort / Complexity:** **4–6 days** · Medium.
- **Touches:** new migration, header (`src/components/layout/site-header.tsx`), activity hooks.
- **Done when:** Being assigned a property produces an in-app notification.

### P2-5 · Polish: friendly errors + replace `window.confirm` `[ ]`
- **Why:** Noted in `BETA_READINESS.md` — some actions leak raw Supabase errors; destructive actions still use `window.confirm`.
- **Build:** map common DB errors to plain language; replace confirms with the existing dialog/toast components.
- **Effort / Complexity:** **1–2 days** · Low.
- **Touches:** `src/lib/action-result.ts`, server actions, destructive-action buttons.
- **Done when:** No raw constraint error reaches a user; destructive actions use in-app dialogs.

**P2 total: 17–27 days.**

---

## P3 — Explicitly do NOT build

> Building any of these re-creates the cost and complexity the client is paying $400/mo to escape. Every one of them appeared in the Smartsheet chrome and **none were used** by the broker.

| Rejected feature | Why it stays out |
|------------------|------------------|
| Formula engine / dynamic columns | Re-introduces spreadsheet chaos a CRM exists to remove; zero CRE payoff. |
| Cell formatting (fonts/colors/fills) | Cosmetic noise; conflicts with a clean, opinionated UI. |
| Gantt / project scheduling | Brokers track prospects, not project timelines. |
| Automation builder | Enterprise complexity — the exact cost being fled. |
| Forms / Connections / Dynamic View / WorkApps / Portfolios / Scenario Plans | Unused enterprise surfaces; each is multi-week with no observed demand. |
| Chart dashboards | Out of scope by design; counts suffice. |
| Kanban / board view | No evidence of pipeline-board use; speculative. |

If demand for any P3 item appears during the pilot, revisit with real usage data — not assumptions.

---

## Suggested execution order (within the priority constraint)

Although tiers aren't calendar-bound, a sensible build order is:

1. **P0-5 (infra)** first — it unblocks live email testing and gives a real URL to demo.
2. **P0-1 (preview)** and **P0-3 (favorites/recents)** — high visibility, low risk, immediate "feel" wins.
3. **P0-2 (email)** — depends on a deployed env.
4. **P0-4 (import)** — largest P0; start in parallel since it's independent.
5. **P1-1 (deal fields)** to complete the pilot cut, then pilot.
6. Post-pilot: remaining **P1**, then **P2** by client feedback.

**Pilot-ready when:** P0-1…P0-5 + P1-1 are `[x]` and a real Smartsheet export has been imported and verified end-to-end.
