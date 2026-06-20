# DrainSheets — Maintenance & Future-Proofing Notes

A short, honest record of the project's tooling health and how to keep it current
without destabilizing it. Updated June 20, 2026.

## TL;DR — the stack is modern, not legacy

Despite being assembled across a few tools/platforms, DrainSheets is already on
**current major versions**. There is no big "modernization" debt. Keep it healthy
with small, safe updates; do the big version jumps deliberately, one at a time.

| Tool | Installed | Notes |
|------|-----------|-------|
| Node | 22.x | Current LTS line. Good. |
| Next.js | 15.5.x | Current 15 line. (Next 16 exists — see "defer" below.) |
| React / React DOM | 19.1 | Latest major. |
| TypeScript | 5.9 | Current. (TS 6 exists — defer.) |
| Tailwind CSS | 4.x | Latest major. |
| Zod | 4.x | Latest major. |
| ESLint | 9.x (flat config) | Current. (ESLint 10 exists — defer.) |
| Vitest | 4.x | Latest major. |
| Supabase JS / CLI | current | — |

## Code health

- `npm run typecheck` → **clean (0 errors)**.
- `npm run lint` → **0 errors, 5 warnings**, all `react-hooks/exhaustive-deps`.
- All unused-import/variable warnings were cleaned up on 2026-06-20.

### About the 5 remaining lint warnings (intentional — do not "fix" blindly)
They are all `exhaustive-deps` on effects that are meant to run only when specific
values change (e.g. the windowed grid loader, the notes/document list loaders).
Most live in `use-sheet-grid.ts` / `sheet-grid.tsx` / `sheet-spreadsheet.tsx`,
which are the most complex and least-tested parts of the app. Force-adding the
flagged dependencies there risks render loops or duplicate fetches. Leave them
unless you're deliberately refactoring those effects *with* tests in place.
Do **not** silence them with blanket `eslint-disable` — that would hide real
future bugs.

## Updating dependencies

### Safe now (semver-compatible — low risk)
Run locally, then smoke-test the app:

```bash
npm update          # pulls compatible patch/minor bumps (react 19.1→19.2, pg, supabase CLI, base-ui, etc.)
npm run typecheck && npm run lint && npm run build
```

### Defer — do these one at a time, deliberately, with testing (NOT as routine cleanup)
These are **major** version jumps. Each is its own small project with real
breakage potential. Don't bundle them into hygiene passes.

- **Next.js 15 → 16** and **eslint-config-next 16** — biggest blast radius; read the
  upgrade guide, expect config/route changes.
- **TypeScript 5 → 6** — can surface new type errors across the codebase.
- **ESLint 9 → 10** — flat-config/plugin compatibility.
- **lucide-react 0.x → 1.x** — icon import/name changes possible.
- **@types/node 20 → 22** — align with the Node 22 runtime (low risk; do alongside a Node check).

## Known environment gotcha (not a code issue)

If `npm run test` (Vitest) fails with a native-binding error like
`rolldown-binding.<platform>.node` not found, it means `node_modules` was
installed on a different OS/CPU than the machine running it. Fix with a clean
reinstall on the target machine:

```bash
rm -rf node_modules package-lock.json   # or just node_modules
npm install
```

## After pulling DB changes

Several recent features added database tables/columns. After pulling, run:

```bash
npm run db:reset      # apply migrations (rebuilds local DB)
npm run db:types      # regenerate src/types/database.ts from the live schema
npm run db:seed-beta  # reload demo data (optional)
```

`db:types` is the source of truth for `src/types/database.ts`. Some recent type
entries were hand-edited so the app would compile before a DB was available;
running `db:types` replaces them with the authoritative generated version.

## Principle

Future-proofing ≠ "everything on latest." It means: stay on supported majors,
take safe updates routinely, keep typecheck/lint green, and schedule the big
jumps intentionally. This project is in good shape on all counts.
