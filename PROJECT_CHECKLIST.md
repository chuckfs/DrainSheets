# DrainSheets — Where We Are (Plain-English Checklist)

A simple running list of what's built and what's left, measured against what the broker actually did in the Smartsheet video. Tick boxes as things get done. No jargon.

**How to read the sizes:** 🟢 quick (hours–a day) · 🟡 medium (a few days) · 🔴 big (a week+).

_Last updated: June 19, 2026_

---

## The foundation (the hard part — done)

- [x] Real spreadsheet structure: **Workspaces → Folders → Sheets → Rows**
- [x] Each sheet can have its **own columns** (a tenant list and a deal sheet are different shapes)
- [x] The old "CRM-only" guts are gone — it's a genuine Smartsheet-style engine now
- [x] Templates so a new sheet starts with the right columns (Tenant Prospect List, Deal Tracker, Contact Database)

---

## Works today (matches the video)

- [x] Home screen with **Recents** (recently opened sheets)
- [x] **Favorites** (star a sheet, it stays starred across devices)
- [x] **Workspaces + folders** with a browse tree (like "A-TEAM Master INFO" in the video)
- [x] **Create a new sheet** (blank or from a template)
- [x] Open a sheet and see the **grid of rows**
- [x] **Edit cells right in the grid** + copy/paste, fill-down, undo/redo
- [x] **Share a sheet** and **Manage Access** with roles (Owner / Admin / Editor / Viewer / Commenter)
- [x] Sharing a whole **workspace flows down** to its sheets
- [x] **Attach files** to a row or the whole sheet (the Row / Sheet / All tabs)
- [x] **Preview a document** in-app (open the PDF, zoom, see size/uploader/date + a description)
- [x] **Notes / comments** on rows
- [x] **Activity timeline** (who changed what)
- [x] **Search everything** + a quick command palette
- [x] **Import from CSV / Excel** (the way to move off Smartsheet)
- [x] **Contacts** directory

---

## Needs finishing (the gaps that actually matter)

- [x] ✅ **Send a "Quick Update" email from a row** — DONE (Jun 19). Rebuilt for the new sheet model: there's now a **"Send update" button** in the row drawer that opens a dialog (To / Subject / Message / pick which columns to include / attach files / Cc me / Send). Sends through Resend and logs every send. _Note: needs the Resend keys set in the app's settings to actually deliver — the code shows a clear message if they're missing._
- [x] ✅ **Sort and filter columns** — DONE (Jun 19). A toolbar bar above the grid now lets you **sort** by any column (A→Z / Z→A, and numbers/dates sort correctly, not as text) and **filter** rows by one or more conditions (e.g. "Status is interested", "Company contains retail", "is empty"). Shows a live "Showing X of Y" count. _Two notes: (1) a filtered/sorted view loads up to 2,000 rows at once — fine for normal sheets, ties into the "big sheets load in chunks" item for anything larger; (2) verified by typecheck + lint, but should get a quick click-test in the running app since I couldn't run the database here._
- [x] ✅ **Fix the file-delete permission bug** — DONE (already fixed in the project as database migration `0013`). A viewer can no longer delete files; only a sheet admin or the person who uploaded the file can. Verified the fix actually closes the hole. _(Tiny known edge: if a file upload fails midway, its leftover file may not auto-clean for non-admins — harmless wasted space, not a security or data issue. Optional to tidy later.)_
- [ ] 🔴 **Make big sheets load in chunks** — today the grid loads *every* row at once. Fine for a few hundred or a couple thousand (most CRE sheets), but it'll struggle in the tens of thousands. Only worth doing when sheet sizes get large.
- [ ] 🟡 **Add tests for the in-grid editing** — copy/paste, fill-down, and undo/redo work but have no automated safety net, so they're the most likely spot for hidden bugs.

---

## Nice to have later (minor / not in the broker's core flow)

- [ ] 🟡 **Document version history** (the "Version 1" dropdown in the video)
- [ ] 🟡 **"Copy link" / shareable links** — sharing is person-by-person only right now; no link-based access
- [ ] 🟢 **Pagination on long notes/document lists**
- [ ] 🔴 **Production setup** — real hosting, backups, error monitoring (not set up yet)

---

## Skipped on purpose (don't build these)

These showed up in Smartsheet's menus but the broker never used them — they're the bloat the whole project exists to avoid:

- [ ] ~~Reports~~
- [ ] ~~Chart dashboards~~
- [ ] ~~Forms~~
- [ ] ~~Automations / workflow builder~~
- [ ] ~~Formulas~~
- [ ] ~~Cell color/font formatting~~
- [ ] ~~Gantt charts~~

---

## If we only do a few things next (suggested order)

1. [x] ~~Fix the file-delete permission bug~~ ✅ done Jun 19 (migration 0013)
2. [x] ~~Reconnect the email update button~~ ✅ done Jun 19
3. [x] ~~Add column sort + filter~~ ✅ done Jun 19
4. [ ] Add tests around the grid editing (🟡, lock in what already works)
5. [ ] Chunked loading for big sheets (🔴, when sheets get large)

After those five, a CRE broker could realistically run their daily Smartsheet workflow in DrainSheets.
