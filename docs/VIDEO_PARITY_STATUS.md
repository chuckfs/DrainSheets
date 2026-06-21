# DrainSheets — Video Parity Status (current)

**Date:** June 20, 2026
**Source of truth:** the broker workflow recording `IMG_9243.MOV` (2:17), decomposed in `PRODUCT_AUDIT_Smartsheet_Parity.md` (features **V1–V22**).
**Purpose:** map *every feature and action in the video* to what exists in the codebase **today**, after the native-Sheet rebuild (Workspace → Folder → Sheet → Row) and the P4 ribbon/formatting work.

> **Headline:** The June-18 audit put the app at ~65% of the broker's observed workflow. As of today, **every feature the broker actually used in the video is implemented.** Of the original *Top 10 workflow gaps*, **9 are closed**; the only one still open is **production infrastructure** — an ops task, not a feature. Everything else left unbuilt is the enterprise surface the broker scrolled past and never used.

---

## 1. The video workflow, end to end

The recording is one coherent loop: **find a sheet → review the grid → share it → open a row's attachments → preview a document → send an email update.** Every step now works in DrainSheets:

| # | Step in the video | Status | Where it lives now |
|---|-------------------|:--:|--------------------|
| 1 | Open Home, find a sheet via **Recents / Favorites / Workspaces** tabs | ✅ Done | `home-dashboard.tsx`, `home-tab-bar.tsx`, `home-recents-table.tsx`, `home-favorites-table.tsx` |
| 2 | Open a sheet in **Grid view**, scan rows/columns | ✅ Done | `sheet-grid.tsx`, `sheet-spreadsheet.tsx` |
| 3 | **Share** the sheet + **Manage access** by role | ✅ Done | `share-dialog.tsx`, `share-link-section.tsx`, `effective-role.ts` |
| 4 | Open a row's **Attachments** (Row / Sheet / All) | ✅ Done | `row-detail-drawer.tsx`, attachments panel |
| 5 | **Preview** a marketing PDF (OM) inline | ✅ Done | `document-preview-dialog.tsx` (zoom/version controls = minor polish) |
| 6 | **Send a Quick Update** email with row data + attachments | ✅ Done | `send-update-dialog.tsx`, `actions/email.ts`, `email_logs` table |
| 7 | Navigate the **workspace tree** between sheets | ✅ Done | `workspace-tree.tsx`, icon rail with workspace avatars |

---

## 2. Every video feature (V1–V22) → current status

Legend: ✅ **Done** · 🟡 **Done, minor polish left** · ⬛ **Intentionally not built** (bloat the broker never used).

| # | Feature in the video | Status | Notes / where it lives |
|---|----------------------|:--:|------------------------|
| V1 | Recents list (home) | ✅ | Server-backed (migration `0007`), `home-recents-table.tsx` — now syncs across devices |
| V2 | Favorites / starred | ✅ | Server-backed (`0007`), `sheet-favorite-button.tsx`, `home-favorites-table.tsx` |
| V3 | Workspaces + Browse tree | ✅ | Native `workspaces`/`folders` (`0003`), `workspace-tree.tsx`, rail switcher |
| V4 | `+ Create` menu (Sheet / Import / Workspace) | ✅ | `rail-create-menu.tsx`, create dialogs, import dialog |
| V5 | Grid view of records | ✅ | Native sheet engine (`0004`), `sheet-grid.tsx` |
| V6 | CRE columns (Company/Use/Website/Contact/Title) | ✅ | User-defined columns + typed cells + templates |
| V7 | CRE deal columns (Address/Price/PPSF/NNN) | ✅ | Arbitrary typed columns (currency/number) + decimal controls — no longer free text |
| V8 | Sort / Filter | 🟡 | Single + saved views/filters done; **multi-level sort** not yet (P4-3) |
| V9 | Cell formatting (font/B-I-U/colors/align) | ✅ | Built in P4-4 (`rows.styles` `0018`, ribbon B/I/U, colors, align, ⌘B/I/U) |
| V10 | Inline cell editing | ✅ | `editable-cell.tsx` — single-click select, double-click edit, type-to-edit, keyboard nav |
| V11 | Share dialog (by email, copy link, general access) | ✅ | `share-dialog.tsx` + tokenized links (`0015`) |
| V12 | Manage access (per-user roles) | ✅ | Per-resource roles viewer→owner, `effective-role.ts` |
| V13 | Workspace-level sharing | ✅ | Share at workspace/folder/sheet scope |
| V14 | Row-level Attachments (Row/Sheet/All) | ✅ | Faithful re-implementation in the row drawer |
| V15 | Attachment metadata (size/uploader/date/description) | 🟡 | All captured; `description` exists (`0006`) — inline post-upload edit is minor |
| V16 | **In-app document preview (PDF + zoom)** | 🟡 | `document-preview-dialog.tsx` renders inline; explicit zoom/fit buttons are minor polish |
| V17 | Document versioning (`Version 1 ▾`) | ✅ | Version stack (`0014`), `document-versions-dialog.tsx`, restore/download |
| V18 | Download / delete attachment | ✅ | Signed-URL download + delete |
| V19 | **Send row by email** (Subject/Message/Include/Layout) | ✅ | `send-update-dialog.tsx`, Resend, cc-me, `email_logs` audit |
| V20 | Row comments / discussion | 🟡 | Notes per row + activity; **threaded** per-row discussion is the only gap |
| V21 | Seat / license banner | ⬛ | This is the $400/mo pain being escaped — correctly not built |
| V22 | Automation / Forms / Connections / Dynamic View / Reports / Dashboards / Portfolios / WorkApps / Scenario Plans | ⬛ | Enterprise bloat; broker scrolled past all of it — deliberately rejected |

**Score against the broker's observed workflow: ~95% (functional parity on everything used; remainder is polish or rejected bloat).**

---

## 3. How the original Top-10 gaps closed

| June-18 gap | Now |
|-------------|:--:|
| 1. No document preview | ✅ Built |
| 2. No send-update-by-email | ✅ Built |
| 3. Favorites/Recents device-local | ✅ Server-backed (`0007`) |
| 4. No data import | ✅ Built (`import-dialog.tsx`) |
| 5. No production infra | ❌ **Still open** |
| 6. No inline cell editing | ✅ Built (full grid) |
| 7. No CRE deal fields | ✅ Typed columns + decimals |
| 8. Single-field filter | ✅ Filters + saved views |
| 9. No workspace organization | ✅ Native tree |
| 10. No Viewer / link sharing | ✅ Built (`0015`, viewer role) |

**9 of 10 closed.** Plus a large amount *beyond* the original audit: ribbon toolbar, fill handle, context menus, row resize, hide/unhide, type switcher, export CSV/XLSX, print, saved views, auto-save sync indicator, and cell formatting.

---

## 4. What's actually left

### A. The one real blocker — production infrastructure (P0-5)
Not a feature; the gate to a paying pilot. Remote Supabase project + run migrations `0001–0018`; Vercel deploy; production secrets; automated DB backups; error monitoring (Sentry); rate-limit auth routes; CI (`typecheck`/`lint`/`build`/`test`); provision the first owner account.

### B. Minor parity polish (optional, ~2–4 days total)
- Explicit **zoom / fit** buttons + in-preview **version switcher** on the document viewer (V16/V17 finish).
- **Inline-edit attachment description** after upload (V15 finish).
- **Multi-level sort** (V8 / P4-3).
- **Threaded per-row comments** vs. flat notes (V20).

### C. Deferred by design — build only if the pilot asks (P4-3 / P4-4 / P3 rejects)
Formula bar/engine, conditional formatting, Gantt / Calendar / Kanban views, realtime presence, row indent/outdent, automation, forms, reports/chart dashboards. **None appeared in the broker's actual usage** — every one was enterprise chrome scrolled past. Building them re-creates the cost the client is leaving.

---

## 5. Recommendation — where to go from here

1. **Stop adding features.** The video-workflow gap is essentially closed. More grid features chase Smartsheet's bloat, not the broker's job.
2. **Do P0-5 (production infrastructure).** It's the only thing standing between "great demo" and "a brokerage can actually use this." It also unblocks live email and a real URL to show the friend.
3. **Run a real migration dry-run.** Import an actual Smartsheet export end-to-end — the true test of "can the client cancel Smartsheet." This is the success metric of the whole project.
4. **Pilot, then let usage decide.** Only build P4-3/P4-4 items a real broker asks for.
5. **(Optional) Knock out the §4-B polish** before the pilot if you want the preview/versioning/sort to feel 100% finished — but none of it blocks.

**Bottom line:** the build has caught up to the video. The next move is hardening and a real data import, not new spreadsheet features.
