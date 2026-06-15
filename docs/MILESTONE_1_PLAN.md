# Milestone 1 — Foundation Implementation Plan

**Status:** Ready to execute  
**Scope:** Project scaffolding, tooling, Supabase structure, auth wiring — no business features  
**Prerequisite:** Milestone 0 complete (docs frozen)  
**Success criteria:** `npm run dev` starts, `npm run build` passes, migrations apply cleanly, types generate, auth middleware protects routes, empty dashboard shell renders

---

## Dependency Graph

```
Step 1 (Prerequisites)
  └─► Step 2 (Next.js scaffold)
        └─► Step 3 (TypeScript strict config)
              └─► Step 4 (Tailwind CSS)
                    └─► Step 5 (shadcn/ui)
                          └─► Step 6 (Folder structure)
                                └─► Step 7 (ESLint + Prettier)
                                      └─► Step 8 (Supabase CLI + project)
                                            └─► Step 9 (Migrations)
                                                  └─► Step 10 (Type generation)
                                                        └─► Step 11 (Supabase clients)
                                                              └─► Step 12 (Auth architecture)
                                                                    └─► Step 13 (Env + Vercel)
                                                                          └─► Step 14 (Verify)
```

Steps 8–10 can begin in parallel with Steps 2–7 if two people work the repo, but **migrations must exist before type generation**, and **Supabase clients require env vars**.

---

## Step 1 — Prerequisites

### Why

Consistent Node/npm versions prevent "works on my machine" issues. Supabase CLI and Vercel CLI are required for migrations and deployment. Git is already initialized.

### Commands

```bash
node -v          # Require Node 20 LTS or 22 LTS
npm -v           # Require npm 10+

# Install global CLIs (once per machine)
npm install -g supabase@latest
npm install -g vercel@latest

# Verify
supabase --version
vercel --version
```

### Files created

None.

### Depends on

Nothing.

---

## Step 2 — Next.js 15 Setup

### Why

Next.js App Router is the documented frontend framework. It provides Server Components, Server Actions (primary mutation layer per architecture review), middleware for auth, and native Vercel deployment. Scaffolding in-repo (not a subdirectory) keeps the existing `docs/` and `.git` at the project root.

### Commands

```bash
cd /Users/charlie/DrainSheets

# Scaffold into current directory (docs/ and .git already exist)
npx create-next-app@15 . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm \
  --turbopack

# When prompted about existing files, confirm overwrite only for
# conflicting scaffold files (README may be merged manually)
```

If `create-next-app` refuses non-empty directory, use:

```bash
npx create-next-app@15 drainsheets-tmp \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-npm --turbopack

# Move scaffold files into repo root, preserve docs/
mv drainsheets-tmp/{package.json,package-lock.json,tsconfig.json,next.config.ts,postcss.config.mjs,eslint.config.mjs,.gitignore,src,public} .
rm -rf drainsheets-tmp
```

### Files created

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `package-lock.json` | Lockfile |
| `next.config.ts` | Next.js configuration |
| `tsconfig.json` | Base TypeScript config |
| `postcss.config.mjs` | PostCSS for Tailwind v4 |
| `eslint.config.mjs` | ESLint flat config |
| `.gitignore` | Ignore `node_modules`, `.env.local`, etc. |
| `src/app/layout.tsx` | Root layout |
| `src/app/page.tsx` | Placeholder home (replace with redirect later) |
| `src/app/globals.css` | Global styles + Tailwind imports |
| `public/` | Static assets |

### Depends on

Step 1.

---

## Step 3 — TypeScript Configuration

### Why

Strict TypeScript catches permission bugs, null reference errors, and schema mismatches before runtime. Path aliases (`@/*`) keep imports clean across the folder structure defined in Step 6. Separate generated DB types from hand-written domain types.

### Commands

No install commands. Edit config after scaffold.

### Files created / modified

| File | Purpose |
|------|---------|
| `tsconfig.json` | Enable `strict`, `noUncheckedIndexedAccess`, path aliases |
| `src/types/domain.ts` | Hand-written enums mirroring DB (`UserRole`, `PropertyStatus`, etc.) |
| `src/types/database.ts` | **Generated** — do not edit manually (Step 10) |
| `src/types/index.ts` | Re-exports for convenient imports |

### Recommended `tsconfig.json` additions

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Depends on

Step 2.

---

## Step 4 — Tailwind CSS Setup

### Why

Tailwind is the documented styling approach. Next.js 15 scaffold includes Tailwind v4. A design token layer (CSS variables) prepares shadcn/ui theming and the spreadsheet-inspired SaaS UI in `UI_UX.md`.

### Commands

Included in `create-next-app --tailwind`. Verify:

```bash
npm run dev
# Confirm Tailwind classes render on the home page
```

### Files created / modified

| File | Purpose |
|------|---------|
| `src/app/globals.css` | Tailwind directives, CSS variables for light/dark tokens |
| `postcss.config.mjs` | PostCSS pipeline (from scaffold) |

### `globals.css` structure (foundation only)

- `@import "tailwindcss"`
- `:root` and `.dark` CSS variable blocks (shadcn will extend these)
- Base `body` styles

### Depends on

Step 2 (scaffold includes Tailwind).

---

## Step 5 — shadcn/ui Installation

### Why

shadcn/ui provides accessible, composable primitives (Button, Input, Sidebar, Table, Dialog) aligned with `TECH_STACK.md` and the Smartsheet/Airtable-inspired UI. Components live in-repo (not `node_modules`), so they are customizable.

### Commands

```bash
cd /Users/charlie/DrainSheets

# Initialize shadcn (interactive — choose New York style, Zinc slate, CSS variables)
npx shadcn@latest init

# Install foundation components only (no business UI)
npx shadcn@latest add button input label card separator skeleton sonner
```

### Files created

| File | Purpose |
|------|---------|
| `components.json` | shadcn CLI config (style, paths, aliases) |
| `src/lib/utils.ts` | `cn()` helper (clsx + tailwind-merge) |
| `src/components/ui/button.tsx` | Base button |
| `src/components/ui/input.tsx` | Base input |
| `src/components/ui/label.tsx` | Form label |
| `src/components/ui/card.tsx` | Card container |
| `src/components/ui/separator.tsx` | Visual divider |
| `src/components/ui/skeleton.tsx` | Loading placeholder |
| `src/components/ui/sonner.tsx` | Toast notifications |

### `components.json` expected aliases

```json
{
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### Depends on

Steps 3, 4.

---

## Step 6 — Folder Structure Implementation

### Why

A predictable layout separates concerns before business features land: auth routes, dashboard shell, Supabase clients, Server Actions, and permissions. Matches architecture review and `UI_UX.md` navigation without building those pages yet.

### Commands

```bash
cd /Users/charlie/DrainSheets

# Create directory scaffold
mkdir -p \
  src/app/\(auth\)/login \
  src/app/\(auth\)/forgot-password \
  src/app/\(auth\)/auth/callback \
  src/app/\(dashboard\) \
  src/app/api/health \
  src/components/layout \
  src/components/ui \
  src/lib/supabase \
  src/lib/auth \
  src/lib/permissions \
  src/actions \
  src/hooks \
  supabase/migrations \
  supabase/functions
```

### Files created (stubs only — no business logic)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx              # Minimal auth layout (centered card)
│   │   ├── login/page.tsx          # Placeholder: "Login — Milestone 2"
│   │   ├── forgot-password/page.tsx
│   │   └── auth/callback/route.ts  # OAuth code exchange stub
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Shell with sidebar placeholder
│   │   └── page.tsx                # "Dashboard — coming soon"
│   ├── api/
│   │   └── health/route.ts         # GET → { status: "ok" }
│   ├── layout.tsx                  # Root: fonts, Toaster, globals
│   ├── page.tsx                    # Redirect → /login or /dashboard
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── app-sidebar.tsx         # Static nav links, no data
│   │   └── site-header.tsx         # Placeholder header
│   └── ui/                         # shadcn components
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server Component client
│   │   ├── middleware.ts           # Middleware session helper
│   │   └── admin.ts                # Service role (server only)
│   ├── auth/
│   │   └── session.ts              # getSession(), getProfile() stubs
│   ├── permissions/
│   │   └── roles.ts                # Role enum + hasRole() helper
│   └── utils.ts
├── actions/
│   └── .gitkeep                    # Server Actions added in Milestone 2+
├── hooks/
│   └── .gitkeep
├── types/
│   ├── domain.ts
│   ├── database.ts                 # Generated in Step 10
│   └── index.ts
└── middleware.ts                   # Auth session refresh + route guard
```

### Depends on

Steps 2, 5.

---

## Step 7 — ESLint and Prettier

### Why

Consistent formatting and lint rules prevent drift across contributors. Catches unused vars, hook violations, and import issues before CI.

### Commands

```bash
npm install -D prettier eslint-config-prettier

# Optional: import sorting
npm install -D @ianvs/prettier-plugin-sort-imports
```

### Files created

| File | Purpose |
|------|---------|
| `.prettierrc` | Formatting rules |
| `.prettierignore` | Ignore build output, generated types |
| `package.json` | Add `"format"`, `"format:check"`, `"lint:fix"` scripts |

### Recommended scripts (`package.json`)

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "db:types": "supabase gen types typescript --local > src/types/database.ts",
    "db:reset": "supabase db reset",
    "db:push": "supabase db push",
    "db:migrate": "supabase migration up"
  }
}
```

### Depends on

Step 2.

---

## Step 8 — Supabase Project Structure

### Why

Supabase provides PostgreSQL, Auth, Storage, and RLS in one platform (`DECISIONS.md`). The CLI enables version-controlled migrations, local development, and type generation. Foundation migrations implement `DATABASE_SCHEMA.md` before any UI reads data.

### Commands

```bash
cd /Users/charlie/DrainSheets

# Initialize Supabase in repo
supabase init

# Link to remote project (after creating at supabase.com/dashboard)
supabase login
supabase link --project-ref <PROJECT_REF>

# Start local Supabase (Docker required)
supabase start
```

### Create remote projects

| Environment | Purpose |
|-------------|---------|
| `drainsheets-staging` | Development, PR previews |
| `drainsheets-prod` | Production (create now, use later) |

### Files created

| File | Purpose |
|------|---------|
| `supabase/config.toml` | Local Supabase configuration |
| `supabase/.gitignore` | Ignore `.branches`, `.temp` |
| `supabase/migrations/` | Ordered SQL migrations |
| `supabase/seed.sql` | Dev seed data (org + owner profile) |

### `config.toml` key settings

```toml
[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/auth/callback"]

[auth.external.google]
enabled = true
# client_id and secret set in dashboard, not committed

[storage]
# Bucket policies applied via migration
```

### Depends on

Step 1 (Supabase CLI installed).

---

## Step 9 — Migration Strategy

### Why

Migrations are the source of truth for schema, RLS, triggers, and storage policies. They must be applied in dependency order per `DATABASE_SCHEMA.md`. Splitting into numbered files makes reviews and rollbacks manageable.

### Commands

```bash
# Create migrations (one per concern)
supabase migration new extensions_and_enums
supabase migration new organizations_and_profiles
supabase migration new properties_and_prospects
supabase migration new contacts_documents_notes
supabase migration new assignments_and_invitations
supabase migration new activity
supabase migration new rls_helpers
supabase migration new rls_policies
supabase migration new search
supabase migration new storage_bucket
supabase migration new auth_triggers

# Apply locally
supabase db reset    # Runs all migrations + seed.sql

# Push to linked remote (staging)
supabase db push
```

### Migration file order and contents

| Migration | Contents |
|-----------|----------|
| `00001_extensions_and_enums.sql` | `pgcrypto`, `uuid-ossp`; create enums (`user_role`, `user_status`, `property_status`, `prospect_status`) |
| `00002_organizations_and_profiles.sql` | `organizations`, `profiles` tables, indexes, `updated_at` trigger |
| `00003_properties_and_prospects.sql` | `properties` (incl. address, city, state per schema), `prospects`, FKs, indexes |
| `00004_contacts_documents_notes.sql` | `contacts`, `documents`, `notes`, cross-FK validation trigger |
| `00005_assignments_and_invitations.sql` | `property_assignments`, `invitations`, unique constraints |
| `00006_activity.sql` | `activity` table, indexes |
| `00007_rls_helpers.sql` | `has_role()`, `is_org_member()`, `can_access_property()` |
| `00008_rls_policies.sql` | Enable RLS on all tables; policies per `PERMISSIONS.md` |
| `00009_search.sql` | FTS columns, GIN indexes, `search_global()` RPC stub |
| `00010_storage_bucket.sql` | Private `documents` bucket + storage RLS policies |
| `00011_auth_triggers.sql` | `on_auth_user_created` → insert `profiles`; handle invite acceptance |

### Rules

1. **Never edit applied migrations** — create a new migration to change schema.
2. **Test with `supabase db reset`** before pushing to remote.
3. **RLS before exposing any table** to the anon/authenticated roles.
4. **`seed.sql` is dev-only** — creates one org, does not create auth users (use dashboard or script).

### `seed.sql` (dev only)

```sql
INSERT INTO organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'A-Team Real Estate');
```

### Depends on

Step 8.

---

## Step 10 — Database Type Generation

### Why

Generated types from the live schema ensure queries, inserts, and Server Actions match PostgreSQL exactly. Prevents typos in column names and enum values. Regenerate after every migration change.

### Commands

```bash
# Local (preferred during development)
supabase gen types typescript --local > src/types/database.ts

# Remote (CI or when local Docker unavailable)
supabase gen types typescript --project-id <PROJECT_REF> > src/types/database.ts

# Add to workflow
npm run db:types
npm run typecheck
```

### Files created / modified

| File | Purpose |
|------|---------|
| `src/types/database.ts` | Auto-generated `Database`, `Tables`, `Enums` types |
| `src/types/domain.ts` | Thin wrappers: `type Profile = Database['public']['Tables']['profiles']['Row']` |
| `src/types/index.ts` | Public type exports |

### `domain.ts` pattern

```typescript
import type { Database } from './database';

export type UserRole = Database['public']['Enums']['user_role'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Property = Database['public']['Tables']['properties']['Row'];
// ... etc.
```

### Depends on

Step 9 (migrations applied locally or on linked project).

---

## Step 11 — Supabase Client Architecture

### Why

Four distinct clients serve different trust boundaries. Using the wrong client leaks the service role key or bypasses RLS unintentionally.

### Commands

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### Files created

| File | Client | Uses | RLS |
|------|--------|------|-----|
| `src/lib/supabase/client.ts` | `createBrowserClient` | Client Components | Yes |
| `src/lib/supabase/server.ts` | `createServerClient` + cookies | Server Components, Server Actions | Yes |
| `src/lib/supabase/middleware.ts` | `createServerClient` | Middleware session refresh | Yes |
| `src/lib/supabase/admin.ts` | `createClient` + service role | Server-only invite/activity | **No** — bypasses RLS |

### Rules

- **Never** import `admin.ts` from Client Components.
- **Never** expose `SUPABASE_SERVICE_ROLE_KEY` as `NEXT_PUBLIC_*`.
- **Prefer** Server Components + `server.ts` for data reads.
- **Server Actions** use `server.ts` for user-context mutations.
- **`admin.ts`** only for operations RLS cannot handle (invite tokens, system activity inserts).

### Depends on

Steps 6, 10, 13 (env vars).

---

## Step 12 — Authentication Architecture

### Why

MVP requires email/password, Google OAuth, password reset, and invite-only registration (`MVP_SCOPE.md`). Middleware must refresh sessions and protect `(dashboard)/*` before business features ship. Full login UI is Milestone 2; foundation wires the plumbing.

### Auth flow overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Browser    │────►│  middleware  │────►│  App Router │
│  (cookies)  │◄────│  (refresh)   │◄────│  RSC/Action │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │ Supabase    │
                    │ Auth        │
                    └─────────────┘
```

### Route groups

| Group | Path | Auth |
|-------|------|------|
| `(auth)` | `/login`, `/forgot-password`, `/auth/callback` | Public |
| `(dashboard)` | `/`, `/properties`, etc. | Protected |
| `api` | `/api/health` | Public (health only) |

### Files created

| File | Purpose |
|------|---------|
| `src/middleware.ts` | Refresh session; redirect unauthenticated users from `(dashboard)` |
| `src/app/(auth)/auth/callback/route.ts` | Exchange OAuth code for session |
| `src/lib/auth/session.ts` | `getUser()`, `getProfile()` using `server.ts` |
| `src/lib/permissions/roles.ts` | `hasRole(user, 'admin')`, role hierarchy |

### Middleware matcher

```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/health).*)',
  ],
};
```

### Supabase dashboard auth settings

| Setting | Value |
|---------|-------|
| Site URL | `http://localhost:3000` (dev) |
| Redirect URLs | `http://localhost:3000/auth/callback`, Vercel preview URLs |
| Email auth | Enabled |
| Google OAuth | Enabled (Client ID + Secret in dashboard) |
| Confirm email | Enabled for production; optional off for local dev |
| Sign-ups | Disabled after first Owner (invite-only via app logic) |

### Milestone 1 vs Milestone 2 boundary

| Item | Milestone 1 | Milestone 2 |
|------|-------------|-------------|
| Middleware + callback route | ✓ Wire up | |
| Login form + Server Action | Stub page | Implement |
| Google button | Stub | Implement |
| Password reset flow | Stub page | Implement |
| Invite flow | DB table only | Implement |
| Profile creation trigger | Migration | Verify |

### Depends on

Steps 6, 8, 9, 11, 13.

---

## Step 13 — Environment Variables

### Why

Secrets stay out of git. Public keys are safe for the browser; service role key is server-only. Separate staging and production values prevent data accidents.

### Commands

```bash
cp .env.local.example .env.local
# Fill in values from Supabase dashboard → Settings → API
```

### Files created

| File | Committed | Purpose |
|------|-----------|---------|
| `.env.local.example` | Yes | Template with placeholder names |
| `.env.local` | **No** | Local secrets (gitignored) |

### `.env.local.example`

```bash
# Supabase — public (safe for browser)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# Supabase — server only (NEVER prefix with NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Vercel setup (can defer to first deploy)

```bash
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_APP_URL
```

| Vercel environment | Supabase project |
|--------------------|------------------|
| Development | staging |
| Preview | staging |
| Production | prod |

### Depends on

Step 8 (Supabase project created).

---

## Step 14 — Verification Checklist

### Why

Confirms foundation is solid before Milestone 2 (auth UI + user management).

### Commands

```bash
# 1. Types compile
npm run typecheck

# 2. Lint passes
npm run lint

# 3. Build succeeds
npm run build

# 4. Dev server starts
npm run dev

# 5. Health endpoint
curl http://localhost:3000/api/health
# → {"status":"ok"}

# 6. Migrations clean
supabase db reset

# 7. Types regenerate
npm run db:types
npm run typecheck

# 8. Auth redirect (manual)
# Visit http://localhost:3000/dashboard → redirects to /login
```

### Milestone 1 done when

- [ ] Next.js 15 App Router scaffold runs with Turbopack
- [ ] TypeScript strict mode enabled, `typecheck` passes
- [ ] Tailwind + shadcn foundation components installed
- [ ] Folder structure matches plan (stubs only)
- [ ] ESLint + Prettier configured
- [ ] Supabase CLI initialized, linked to staging
- [ ] All 11 migrations apply via `supabase db reset`
- [ ] `src/types/database.ts` generates and matches schema
- [ ] Four Supabase clients exist with correct boundaries
- [ ] Middleware protects dashboard routes
- [ ] `.env.local.example` documented
- [ ] `npm run build` passes with zero errors

---

## Package Dependencies (foundation)

### Production

```json
{
  "@supabase/ssr": "^0.6.x",
  "@supabase/supabase-js": "^2.49.x",
  "class-variance-authority": "^0.7.x",
  "clsx": "^2.1.x",
  "lucide-react": "^0.4xx",
  "next": "^15.x",
  "react": "^19.x",
  "react-dom": "^19.x",
  "tailwind-merge": "^3.x",
  "zod": "^3.24.x"
}
```

`zod` is included now for env validation (`src/lib/env.ts`) even though business validation comes later.

### Development

```json
{
  "@types/node": "^22.x",
  "@types/react": "^19.x",
  "@types/react-dom": "^19.x",
  "eslint": "^9.x",
  "eslint-config-next": "^15.x",
  "eslint-config-prettier": "^10.x",
  "prettier": "^3.x",
  "typescript": "^5.x"
}
```

---

## Optional: Environment Validation (`src/lib/env.ts`)

### Why

Fail fast at boot if Supabase env vars are missing, instead of opaque runtime errors.

### Created in Step 13

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});
```

---

## What Milestone 1 Explicitly Excludes

Per scope — do not build in this milestone:

- Property, prospect, contact CRUD
- Document upload UI
- Notes UI
- Search UI
- Dashboard widgets with real data
- User invite UI
- Login form implementation (stub pages only)
- Server Actions with business logic
- `search_global` RPC implementation (stub migration only)
- Vercel production deploy (optional; staging link is enough)

---

## Estimated Timeline

| Step | Duration |
|------|----------|
| 1–2 | 30 min |
| 3–5 | 1 hr |
| 6–7 | 1 hr |
| 8–9 | 3–4 hr |
| 10–12 | 2 hr |
| 13–14 | 1 hr |
| **Total** | **~1–1.5 days** |

---

## Next: Milestone 2 Preview

After verification passes:

1. Login / Google OAuth / password reset UI
2. Profile bootstrap on first sign-in
3. Invite acceptance flow
4. Settings → Users (Owner only)
5. RLS integration tests

See `CHECKLIST.md` Phase 3 — Authentication.
