# DrainSheets — Independent Engineering Audit (G1 Native Architecture)

**Auditor stance:** Principal Software Architect, independent. Every completion claim treated as overstated until verified in code. Verdicts cite real files.
**Date:** June 19, 2026.
**What I could verify directly:** schema/migrations, RLS, server actions, components, `npm run typecheck` (**passes, exit 0**).
**What I could NOT verify here:** the test *suite* did not execute in this sandbox (native binding/arch mismatch in `node_modules`, `rolldown-binding.linux-arm64` missing — an environment issue, not a code defect). So "tests passing" is **claimed-but-not-independently-reproduced**; I assessed test *files* for coverage and depth instead. Production performance is unverified (benchmarks are local-SQL only — see Part 7).

> **One-line verdict:** This is a **real, surprisingly competent native rebuild** — the CRM is genuinely gone, the schema/RLS/sharing model is well-built, the grid is real (TanStack virtualization, server-persisted edits, working undo/redo). But the completion report is **optimistic in three specific, important ways**: (1) the grid loads **all rows with no server pagination**, so "virtualization" hides a hard scalability ceiling; (2) the **hardest interactive code (clipboard/fill-down/undo/keyboard) has zero tests**; (3) **benchmarks measure raw localhost SQL**, not system latency, and "collaboration" is async panels, not multiplayer. None are fatal; all are misrepresented-by-omission.

---

## Part 1 — Roadmap Verification

No phase-map document exists in the repo, so the G5-A…H letters below are my **inferred** grouping of the claimed application features, graded on code evidence.

| Phase | Scope (inferred) | Verdict | Evidence |
|-------|------------------|---------|----------|
| **G1** | Native schema squash | ✅ **Completed** | Migrations `0001–0012`; CRM tables (`properties/prospects/property_assignments`) **absent**; 18 native tables incl. `workspaces/folders/sheets/sheet_columns/rows/shares/sheet_templates/sheet_template_versions/contacts`. |
| **G2** | Access model + RLS | ✅ **Completed** | `0010` — `org_role`+`access_role`, `effective_role_for_{sheet,folder,workspace}`, recursive `folder_ancestor_ids` (depth-capped 8), `max_access_role`, `has_sheet_access`; RLS enabled on **all 18** tables (verified create-set == enable-set). |
| **G3** | Templates | ✅ **Completed** | `0009` `sheet_templates`+`sheet_template_versions`; `actions/templates.ts`; `template-picker.tsx`, `create-sheet-dialog.tsx`; `tests/templates/seed-validation.test.ts`; CRE seed templates. |
| **G4** | Native server actions | ✅ **Completed** | `actions/{sheets,rows,columns,folders,workspaces,shares,templates,access,contacts,documents,notes,search,activity,import}.ts`; all writes use `requireProfile` + Zod (`validations/row.ts` etc.). |
| **G5-A** | Spreadsheet grid + typed cell renderers | ✅ **Completed** | `sheet-grid.tsx`, `sheet-spreadsheet.tsx`, `editable-cell.tsx`, `cell-renderers/`, `column-header.tsx`, `column-resize-handle.tsx`. Edits persist via `updateRow`/`batchUpdateRows`. |
| **G5-B** | Virtualization | ⚠️ **Completed-with-risk** | Real `@tanstack/react-virtual` windowing (`sheet-grid.tsx:41`, overscan 12, spacer rows). **But `listRows()` fetches every row — no server pagination** (`actions/rows.ts:21`). Virtualization is render-only over a fully-loaded dataset → see Part 4. |
| **G5-C** | Clipboard / fill-down / undo-redo | ⚠️ **Completed-but-untested (High risk)** | `use-sheet-clipboard.ts`, `use-sheet-history.ts` (typed 50-entry undo+redo, server-reverting via `applyHistoryEntry`), `use-sheet-keyboard.ts`, `batchUpdateRows`. **Zero tests** for any of it (see Parts 6 & 7). |
| **G5-D** | Sharing UI | ✅ **Completed** | `shares/share-dialog.tsx`, `user-picker.tsx`, `access-badge.tsx`; wired to `actions/shares.ts` + `access.ts`. |
| **G5-E** | Template creation | ✅ **Completed** | `create-sheet-dialog.tsx`, `template-picker.tsx`, `sheet-template-provenance.tsx`. |
| **G5-F** | Import (CSV/XLSX) | ✅ **Completed** (best-tested) | `actions/import.ts`, `components/import/*`, `lib/import/*`; tests: mapping/parser/preview/dedupe/permissions/validation/**large-import** + CSV fixtures. |
| **G5-G** | Search + command palette | ✅ **Completed** | `search/search-command.tsx`, `search-dialog.tsx`, `use-search.ts`; `search_global` RPC (sheet/row/contact/document/note). `tests/search/{access,format}.test.ts`. |
| **G5-H** | Notes / attachments / activity ("collaboration") | ✅ **Completed (async, not multiplayer)** | `collaboration-rail.tsx` = tabs over `AttachmentsPanel`+`NotesPanel`+`ActivityFeed`. **No realtime/presence/co-editing** (zero `channel/postgres_changes/presence` in repo). |

**Nothing is fabricated.** No phase is "Misrepresented" in the sense of claiming code that doesn't exist. The misrepresentation is **by omission of caveats** (G5-B scalability, G5-C test coverage) and **terminology** (G5-H "collaboration").

---

## Part 2 — Architecture Drift

The pivot is **clean** — better than most rewrites. Findings:

- **Lingering CRM concepts:** None structural. `properties/prospects/property_assignments` tables and `prospect_status`/`property_status` enums are **gone**. The CRM survives only as intended — a **Tenant Prospect List template** and the `prospect_status` values as a `select` column config (correct per G1 design).
- **Leftover naming:** Minor. `documents_storage_path_sheet_id` etc. are correctly sheet-keyed. No `property_id`/`prospect_id` columns remain (verified — re-pointed to `sheet_id`/`row_id` only).
- **Duplicated access systems:** **Resolved, not duplicated.** The old `can_access_property` is gone; a single `effective_role_for_*` / `has_*_access` family is authoritative. `can_access_sheet` is a thin viewer-level wrapper over `has_sheet_access` — consistent, not a second system.
- **Orphaned abstractions / dead code:** `validate_share_resource` contains a no-op self-share branch (`IF NEW.grantee_id = NEW.created_by … NULL`) with a "blueprint recommends reject" comment — **dead/indecisive code**; harmless (insert already requires admin) but should be removed or implemented.
- **Migration inconsistencies:** `shares_select` is defined in `0010` then **dropped and redefined** in `0011`; `shares_update` only appears in `0011`. Works, but the split across two files is mild archaeology in a freshly-squashed baseline — fold into `0010`.
- **Schema/app mismatch:** None blocking — `typecheck` passes, so generated `database.ts` matches the schema. The one functional mismatch is **storage DELETE vs table DELETE permissions** (Part 3).

**Drift grade: Low.** This is a genuine native architecture, not a reskinned CRM.

---

## Part 3 — Security Audit (assume malicious authenticated user)

**Overall: strong.** The RLS/sharing core is well-designed. Concrete checks:

**Privilege escalation — largely closed:**
- `shares_insert` / `shares_update` / `shares_delete` all require `has_*_access(resource_id, 'admin')` — **you can only share what you administer.** An editor/viewer cannot mint shares (default-deny + admin gate). ✅
- `validate_share_resource` trigger **rejects `role = 'owner'`** on shares and enforces grantee+resource **same-org** as `org_id`. Cross-org grant blocked. ✅
- `effective_role_*` **caps non-org-admins at the max of their grants** and org-admins at `admin` (never `owner` via content). No path to `owner` through sharing. ✅
- Residual: a content-`admin` can grant another user `admin` (bounded, expected Smartsheet behavior) — acceptable, not escalation.

**Ownership bypass / SECURITY DEFINER:**
- All helper functions are `SECURITY DEFINER` **with `SET search_path = public`** — mitigates the classic search-path hijack. ✅
- Row/sheet/column writes gated by `has_sheet_access(..., 'editor')`; deletes by `'admin'`; notes insert by `'commenter'`+author. Coherent. ✅

**🔴 Finding S1 — Storage DELETE is under-gated (real bug).**
`documents_delete` (table) requires `has_sheet_access(sheet_id,'admin') OR uploaded_by = self`. But `documents_storage_delete` (on `storage.objects`) only requires `can_access_sheet(...)` = **viewer-level**. A malicious **viewer** can delete the underlying file object from storage even though they cannot delete the document row → orphaned rows, broken downloads, data loss. **Fix:** gate storage DELETE with `has_sheet_access(...,'editor')` (or mirror the table's admin/uploader rule).

**🟡 Finding S2 — Over-broad grants.** `0010` issues `GRANT SELECT ON ALL TABLES … TO anon` and `GRANT EXECUTE ON ALL FUNCTIONS … TO anon`. Reads are backstopped because RLS is enabled on all 18 tables and policies are `TO authenticated` (anon matches none → deny) — **verified**. But granting `EXECUTE` on every `SECURITY DEFINER` function to `anon` is a footgun: any future function that doesn't null-check `auth.uid()` becomes an unauthenticated vector. **Fix:** least-privilege grants; do not grant function EXECUTE to `anon` by default.

**🟡 Finding S3 — Signed-URL TTL / validation.** Downloads/previews use signed URLs (consistent with prior P0-1). Not re-verified in depth here; confirm TTL is short and that `generatePreviewUrl`/`generateDownloadUrl` re-check `has_sheet_access` server-side before signing (RLS on `storage.objects` helps, but server-action defense-in-depth is wanted).

**🟡 Finding S4 — Server actions vs RLS.** Actions use the user-scoped Supabase client + `requireProfile` + Zod, so RLS applies. Confirm **no mutating path uses the service-role/admin client** (`lib/supabase/admin.ts`) without an explicit role check — service-role bypasses RLS entirely. (Import + email are the usual suspects; not exhaustively traced here.)

**Net:** one real bug (S1), three hardening items (S2–S4). No catastrophic escalation path found.

---

## Part 4 — Scalability Audit

**The defining issue: client-side virtualization over a fully-loaded dataset.** `listRows(sheetId)` selects **all** rows for a sheet with no `.range()`/cursor (`actions/rows.ts:21`). Rendering is windowed (TanStack); **fetching/serialization/memory are not.**

| Subsystem | 5k rows | 50k rows | 500k rows |
|-----------|---------|----------|-----------|
| **Row load / grid open** | ✅ OK (~MBs JSON; DB ~0.6s per their bench) | 🟡 **Degraded** — tens of MB JSON per open, multi-second query+serialize+transfer, high browser memory; every open pays full cost | 🔴 **Fails** — hundreds of MB, OOM/timeout risk; architecture cannot reach this without server-side windowed fetch |
| **Row render** | ✅ virtualized | ✅ virtualized (render fine; data load is the bottleneck) | ✅ render fine *if* data could load (it can't) |
| **Search** | ✅ (LIMIT-bounded) | 🟡 `can_access_sheet` evaluated per candidate row in the union; watch cost | 🔴 needs dedicated index strategy/materialization |
| **Activity** | ✅ paginated (`limit 50`) | ✅ | 🟡 needs keyset pagination + retention |
| **Notes / documents** | ✅ | 🟡 no explicit pagination observed on list reads | 🔴 unbounded reads |
| **Import** | ✅ batched + `large-import` test | 🟡 single-transaction batch — chunk it | 🔴 needs streaming/COPY |

**Realistic ceilings as built:** comfortable to **~5k–10k rows/sheet**; **~50k** is the practical wall for the load-all grid; **500k** is out of reach without re-architecting the data path. CRE sheets are usually small (hundreds–low thousands), so this is acceptable **for the target use case today** — but the "virtualization ⇒ scales" implication is misleading. **Top scalability fix:** server-side windowed/keyset row fetch feeding the virtualizer (fetch-on-scroll), plus pagination on notes/documents.

---

## Part 5 — Product Completeness

| Subsystem | Status | Rationale |
|-----------|:------:|-----------|
| Native schema / migrations | 🟢 Green | Clean squashed baseline, RLS everywhere, typecheck green. |
| Access / sharing model (RLS) | 🟢 Green | Correct inheritance, least-privilege gates, no escalation path (modulo S1). |
| Server actions (CRUD) | 🟢 Green | Auth + Zod + RLS on all writes. |
| Import (CSV/XLSX) | 🟢 Green | Well-tested incl. large-import + fixtures. |
| Templates | 🟢 Green | Tables/versions/UI/seed test present. |
| Spreadsheet grid (read/edit/virtualize) | 🟡 Yellow | Real and persisted, but load-all data path + **untested** interactive logic. |
| Clipboard / fill-down / undo-redo | 🟡 Yellow | Implemented, server-reverting, but **zero tests** on the most bug-prone code. |
| Search + command palette | 🟡 Yellow | Works; ranking/scale unproven; per-row access check cost. |
| Notes / attachments / activity | 🟡 Yellow | Functional async panels; list pagination thin. |
| Storage security | 🔴 Red | DELETE under-gated (S1) until fixed. |
| Real-time collaboration | 🔴 Red (absent) | No multiplayer/presence; "collaboration" = async only. Red only if it was implied to exist. |
| Performance evidence | 🔴 Red | Benchmarks don't measure the real system (Part 7). |
| Production infra | 🔴 Red | No linked remote/backups/monitoring (per prior audits). |

---

## Part 6 — Hidden Technical Debt (skeptical read)

1. **Tests cluster on the easily-assertable layer; the hard layer is untested.** Every test is DB-access/RLS/import/search-format/templates. **No test touches the grid, virtualization, clipboard, fill-down, undo/redo, or keyboard** — exactly the code most likely to have subtle bugs (off-by-one ranges, paste bounds, undo/redo ordering, position drift). This is the classic "green tests that miss the risk" pattern. **Highest-value debt.**
2. **Load-all row fetch (Part 4)** — the single biggest architectural shortcut; virtualization papers over it.
3. **Storage DELETE gap (S1)** — security debt.
4. **Undo/redo correctness risk:** `applyHistoryEntry` replays mutations against the server (`createRow`/`deleteRow`/`updateColumnLabel`); concurrent edits, failed reverts, or `position` recomputation can desync undo state vs server. No tests guard this.
5. **Row `position` integrity:** `reorderRow` rewrites positions row-by-row (`update … position = index` in a loop, `rows.ts:324`) — N updates, no transaction guarantee shown; interruption leaves gaps/dupes. No uniqueness constraint on `(sheet_id, position)` observed.
6. **`batchUpdateRows` merge semantics:** merges partial cell data into `rows.data` JSONB; concurrent cell edits to the same row can last-write-wins clobber sibling cells. No optimistic-concurrency token.
7. **Over-broad grants (S2)** — latent footgun.
8. **Migration archaeology already creeping in** (`shares` policies split 0010/0011) in a *fresh* baseline.
9. **Dead code** in `validate_share_resource` (no-op self-share branch).
10. **Weak typing surface:** `rows.data` is `JSONB`/`Json` — cell values are effectively untyped at the DB boundary; correctness depends entirely on app-layer Zod + `sheet_columns.type`. Acceptable (the JSONB decision), but means **a column type change does not migrate existing cell values** — stale/mistyped values can linger silently.

---

## Part 7 — Benchmark Review

**Methodology (from `scripts/perf-benchmark.ts`):** direct `pg` connection to **local** Supabase; simulates a user via `set_config('request.jwt.claim.sub', …)` + `SET LOCAL ROLE authenticated` (good — measures **under RLS**); `timed()` runs each query **once**; thresholds 200/500/1500ms.

**What the reported numbers actually are:** raw **single-query SQL latency on localhost under RLS**. The "100 rows = 32ms / 1000 = 152ms / 5000 = 628ms / search = 4ms / import = 6ms" are **database-layer timings only**.

**What they do NOT measure (and therefore overstate readiness):**
- **No Next.js server-action / PostgREST-HTTP / network / serialization overhead** — real user latency is a multiple of these.
- **No client render / virtualization cost** — the actual 5k-row browser experience is unmeasured.
- **No warmup, single run** — no p50/p95/p99; one-shot timings are noisy and cache-sensitive.
- **Local hardware/DB**, not production; **no concurrency/load** testing.
- **5000 is the top data point** — the interesting failure region (50k+) is untested, masking the Part 4 ceiling.

**Verdict:** useful as a **DB sanity check**, **not** as system-performance evidence. **Required additions:** end-to-end latency through a deployed server action (p50/p95) ; client render/scroll FPS for 1k/5k/20k rows; 50k+ data points; concurrent-user load test; warmup + N-iteration statistics.

---

## Part 8 — Beta Readiness Score (0–10)

| Dimension | Score | Rationale |
|-----------|:-----:|-----------|
| **Architecture** | **8.5** | Clean native model; correct sharing inheritance; one storage-policy bug. |
| **Security** | **7.0** | Strong RLS/sharing; deductions for S1 (storage delete), S2 (anon grants), unverified service-role paths. |
| **Scalability** | **5.0** | Fine for CRE-sized sheets; load-all data path caps it; benchmarks don't probe limits. |
| **Developer Experience** | **7.5** | Typecheck green, coherent action/validation structure, clear module layout; thin tests on hard paths hurt. |
| **Product Completeness** | **6.5** | Most subsystems green/yellow; storage bug + no real perf/infra evidence. |
| **Maintainability** | **7.5** | Good separation, Zod validation, RLS-first; JSONB untyped boundary + untested grid logic are the risks. |

**Weighted overall** (Arch 20%, Sec 25%, Scale 15%, DX 10%, Completeness 15%, Maint 15%):
0.20·8.5 + 0.25·7.0 + 0.15·5.0 + 0.10·7.5 + 0.15·6.5 + 0.15·7.5 = **7.05 / 10**.

**Interpretation:** solid controlled-beta foundation for **CRE-sized sheets**; **not** yet a proven large-scale or production-hardened system. The score is held back by scalability evidence and the untested interactive layer, not by architecture.

---

## Part 9 — Revised Roadmap (top 10, by value — not assuming current roadmap is right)

1. **Fix storage DELETE gating (S1).** *Impact: High (data-loss/security) · Risk: Low · Effort: 0.5d.* A viewer can delete files today. Ship before any external user. **First because it's a live security defect.**
2. **Test the interactive grid (clipboard/fill-down/undo-redo/keyboard/position).** *Impact: High · Risk: Low · Effort: 4–6d.* The highest-bug-density code is unguarded; every later grid change is risky without this. **Precedes new grid features.**
3. **Server-side windowed row fetch (keyset/cursor) feeding the virtualizer.** *Impact: High · Risk: Med · Effort: 5–8d.* Removes the load-all ceiling; unlocks 50k+ sheets. **Before marketing the grid as scalable.**
4. **Real end-to-end + client-render benchmarks (p50/p95, 1k/5k/20k/50k, concurrency).** *Impact: High (decision-quality) · Risk: Low · Effort: 2–3d.* You can't prioritize scale work without honest numbers. **Before scale claims.**
5. **Tighten grants to least-privilege (S2) + audit service-role usage (S4).** *Impact: Med-High · Risk: Low · Effort: 1–2d.* Close defense-in-depth gaps.
6. **Optimistic-concurrency for row/cell writes (version token).** *Impact: Med-High · Risk: Med · Effort: 3–4d.* Prevents last-write-wins clobber in `batchUpdateRows`/undo; precondition for any multi-user editing.
7. **Pagination on notes/documents/activity list reads.** *Impact: Med · Risk: Low · Effort: 1–2d.* Removes unbounded reads.
8. **Transactional `reorderRow` + `(sheet_id, position)` integrity.** *Impact: Med · Risk: Low · Effort: 1–2d.* Prevents position drift/dupes.
9. **Column-type-change value migration (and JSONB value validation on read).** *Impact: Med · Risk: Med · Effort: 3–4d.* Stops silent stale/mistyped cells.
10. **Production infra + monitoring (remote Supabase, backups, error tracking, CI running typecheck/lint/build/test).** *Impact: High for launch · Risk: Low · Effort: 3–5d.* Still absent.

*(Deliberately ranked: security bug → test the risky code → fix the real scale ceiling → measure honestly → harden. Net-new features intentionally rank below correctness/scale because the foundation is good enough that the risk is now in the unguarded edges, not in missing capability.)*

---

## Part 10 — Brutal Honesty: "If this were handed to a new team tomorrow, what would worry you most?"

In priority order:

1. **The scariest code has no tests.** Clipboard, fill-down, undo/redo, keyboard ranges, and row `position` math are the parts most likely to corrupt a user's sheet — and they're the only parts with **zero** coverage. A new team will break them on the first refactor and not know. **This is the #1 worry.**
2. **"Virtualization" is a half-truth.** The grid windows rendering but **loads every row**. A new team will believe the grid scales, demo it on 200 rows, then watch it melt on a real 40k-row import. The ceiling is invisible until you hit it.
3. **Benchmarks will mislead decisions.** The reported millisecond figures look production-grade but measure localhost SQL only. A team trusting them will under-invest in the real bottlenecks (HTTP, render, payload size).
4. **A live security bug ships today** (viewer can delete files). Small fix, but it means the completion report's "secure" claim wasn't independently validated — which should make you skeptical of *every* green checkmark you didn't verify yourself.
5. **"Collaboration" implies something it isn't.** There is no multiplayer/presence/live cursors. If a stakeholder expects Google-Sheets-style co-editing, that's a roadmap surprise, not a built feature.
6. **Concurrency is unmodeled.** Last-write-wins on JSONB cell merges + server-replayed undo will produce "my edit vanished" bugs the moment two brokers touch one sheet — and there are no tests or version tokens to catch it.
7. **Couldn't reproduce the test suite at all** (native-binding/arch mismatch in `node_modules`). A new team may hit the same wall; CI that actually runs the suite on clean installs does not appear to exist.

**The fair version:** the **architecture is genuinely good** and the rebuild is real — this is not a Potemkin repo. The risk is not "it's fake," it's "it's reported as more finished, more scalable, and more tested than it is." Treat G1–G4 as **trustworthy**, G5 grid/collab as **working demos that need hardening and tests**, and the performance/security claims as **unverified until you measure and patch them yourself.**

---

### Verification log (what I actually ran/read)
- `git log`, migration listing, `src/actions` + `src/components` inventory, `tests` inventory.
- Read: migrations `0008`, `0010` (access helpers, RLS, storage, grants, search), `0011`; `actions/rows.ts`; `components/sheets/{sheet-grid,use-sheet-grid,use-sheet-history,collaboration-rail}.tsx/ts`; `scripts/perf-benchmark.ts`.
- Grepped: virtualization, clipboard, fill-down, undo/redo, command palette, realtime/presence, RLS-enable coverage, pagination.
- Ran: `npx tsc --noEmit` → **pass (exit 0)**. `npx vitest` → **could not execute** (rolldown native binding missing for this arch).
