# DrainSheets

A commercial real estate CRM built to feel like **Smartsheet for property sheets** — prospects, contacts, documents, and notes on one workspace, without the spreadsheet chaos.

**What you can do today:** manage properties and prospect grids, attach files, add notes, share sheets with editors, search across records, and review activity — all in a spreadsheet-style UI.

---

## Quick install (local)

### Prerequisites

Install these first:

| Tool | Version | Notes |
|------|---------|--------|
| [Node.js](https://nodejs.org/) | 20+ | Includes `npm` |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Latest | Required for local Supabase |
| [Git](https://git-scm.com/) | Any recent | To clone the repo |

Optional: [Supabase CLI](https://supabase.com/docs/guides/cli) (the project uses `npx supabase` via npm scripts, so a global install is not required).

### 1. Clone and install

```bash
git clone <repo-url> drainsheets
cd drainsheets
npm install
```

### 2. Environment variables

```bash
cp .env.local.example .env.local
```

After Supabase is running (step 3), paste your local keys into `.env.local`:

```bash
npx supabase status -o env
```

Copy `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` into `.env.local`. Keep `NEXT_PUBLIC_APP_URL=http://localhost:3000`.

> **Do not commit `.env.local`.** It is gitignored.

### 3. Start the database

Make sure Docker Desktop is running, then:

```bash
npm run db:start    # first run may take a few minutes
npm run db:reset    # applies migrations + seeds base schema
```

### 4. (Optional) Load demo data

For a full CRE demo org with sample properties, prospects, and users:

```bash
npm run db:seed-beta
```

**Demo login** (after seeding):

| Role | Email | Password |
|------|-------|----------|
| Owner | `beta-owner@drainsheets.local` | `BetaSeed2026!` |
| Editor | `beta-editor1@drainsheets.local` | `BetaSeed2026!` |

All seeded users use the `@drainsheets.local` domain and the same password.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Useful commands

| Command | What it does |
|---------|----------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run test:rls` | RLS permission integration tests (needs local DB) |
| `npm run db:start` | Start local Supabase |
| `npm run db:stop` | Stop local Supabase |
| `npm run db:reset` | Reset DB and re-run migrations |
| `npm run db:seed-beta` | Load beta demo dataset |

---

## Project layout

```
src/           Next.js app (App Router), components, server actions
supabase/      Migrations, config, local Supabase setup
docs/          Product & architecture docs (source of truth)
scripts/       Seed and integrity scripts
tests/         RLS integration tests
```

---

## Documentation

Read these in order if you want the full picture:

1. [docs/PRD.md](docs/PRD.md)
2. [docs/MVP_SCOPE.md](docs/MVP_SCOPE.md)
3. [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)
4. [docs/WORKFLOWS.md](docs/WORKFLOWS.md)

Also useful: [docs/USER_ROLES.md](docs/USER_ROLES.md), [docs/PERMISSIONS.md](docs/PERMISSIONS.md), [BETA_READINESS.md](BETA_READINESS.md)

---

## Tech stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** (Auth, Postgres, Storage)
- **Vercel** (deployment target)

---

## Troubleshooting

**`db:start` fails** — Docker Desktop must be running. Restart Docker and try again.

**Login does nothing / auth errors** — Confirm `.env.local` keys match `npx supabase status -o env` after `db:start`.

**Empty app after login** — Run `npm run db:seed-beta` for demo data, or create a property from the UI (owner/admin).

**Port 3000 in use** — Stop the other process or run `npm run dev -- -p 3001` and set `NEXT_PUBLIC_APP_URL` accordingly.

---

## Status

MVP feature-complete for controlled beta. See [BETA_READINESS.md](BETA_READINESS.md) for security, RLS, and performance notes.
