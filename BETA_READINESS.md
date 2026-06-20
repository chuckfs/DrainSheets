# DrainSheets Beta Readiness Report

**Milestone:** 8 — Hardening & Beta  
**Date:** June 15, 2026  
**Overall readiness score:** **82 / 100** (ready for controlled beta on staging; not yet production launch)

---

## Completed Features (MVP Modules)

| Module | Status |
|--------|--------|
| Authentication (email, Google OAuth, invite-only signup) | Complete |
| Users (invite, roles, disable) | Complete |
| Properties (CRUD, archive, assignments) | Complete |
| Prospects | Complete |
| Contacts (global + prospect-scoped) | Complete |
| Documents (private storage, signed URLs) | Complete |
| Notes | Complete |
| Activity feed | Complete |
| Global search | Complete |
| Dashboard (stats, assigned properties, recent prospects) | Complete |

---

## RLS Integration Test Results

**Command:** `npm run test:rls`  
**Result:** **13 / 13 passed**

| Role | Verified |
|------|----------|
| **Owner** | View all CRM records; manage users; assign properties |
| **Admin** | View/create/update CRM records; cannot assign properties or disable owners |
| **Editor** | View assigned property chain only; cannot view unassigned Property Y (0 rows); cannot create properties; cannot archive; cannot invite users |

**Editor isolation (Property X assigned, Property Y not):**

- Property Y: 0 rows
- Property Y prospects: 0 rows
- Property Y contacts: 0 rows
- Property Y documents: 0 rows
- Property Y notes: 0 rows

---

## Security Audit Summary

### Authentication

| Check | Status | Notes |
|-------|--------|-------|
| Protected routes | Pass | Middleware redirects unauthenticated users to `/login` |
| Session validation | Pass | `supabase.auth.getUser()` on each request |
| Disabled user lockout | Pass | Middleware + sign-in action sign out disabled profiles |
| Invite-only registration | Pass | DB trigger rejects signup without valid invitation (except first user) |

### Storage

| Check | Status | Notes |
|-------|--------|-------|
| Private bucket only | Pass | `documents` bucket `public = false` |
| Signed URL downloads | Pass | Server action generates time-limited signed URLs |
| No public document access | Pass | Storage RLS requires `can_access_property` + org membership |

### Server Actions

| Check | Status | Notes |
|-------|--------|-------|
| Input validation (Zod) | Pass | All CRM/auth actions use Zod schemas |
| Permission checks | Pass | `requireProfile`, `requireOwner`, role helpers before mutations |
| No client-side trust | Pass | RLS is authoritative; UI hides disallowed actions |

### Security Findings (Addressed in M8)

1. **Editor archive via RLS (fixed)** — Editors could previously `UPDATE properties SET status = 'archived'` on assigned properties because the update policy did not restrict status changes. Fixed in migration `20250615120019_prevent_editor_archive_rls.sql`.

### Remaining Security Notes (Non-blocking for staging beta)

- Some server actions return raw Supabase error messages (e.g. constraint failures). Messages are user-readable but not always user-friendly; consider mapping common DB errors to plain language.
- `window.confirm` still used for destructive actions (acceptable for MVP beta).

---

## Data Integrity

**Command:** `npm run db:integrity`  
**Result:** **10 / 10 checks passed**

Validates:

- No orphaned prospects, contacts, documents, or notes
- `org_id` consistency across contacts, documents, notes
- Prospect/property link integrity on documents and notes
- Property assignment referential integrity

---

## Beta Seed Dataset

**Command:** `npm run db:seed-beta` (use `--force` to recreate)

| Entity | Count |
|--------|------:|
| Properties | 20 |
| Prospects | 100 |
| Contacts | 250 |
| Documents (metadata) | 100 |
| Notes | 200 |
| Users | 10 |

CRE-themed data: retail centers, medical offices, mixed-use, restaurant/franchise prospects.

**Beta credentials:** all users `@drainsheets.local`, password `BetaSeed2026!`  
**Owner:** `beta-owner@drainsheets.local`

---

## Performance Testing

**Command:** `npm run db:perf` (against beta seed)  
**Result:** **8 / 8 within thresholds**

| Query | Time | Threshold |
|-------|-----:|----------:|
| Dashboard stats | 10ms | 500ms |
| Global search (`medical`) | 4ms | 300ms |
| Properties list | 2ms | 300ms |
| Property detail | 3ms | 200ms |
| Prospect detail | 3ms | 200ms |
| Global contacts | 3ms | 300ms |
| Global documents | 2ms | 300ms |
| Editor property scope | 2ms | 300ms |

*Local Supabase benchmarks; production latency will differ.*

---

## Error Handling & UX States

### Forms reviewed

All primary forms return user-friendly `ActionResult` errors (no stack traces):

- Create/edit property, prospect, contact
- Upload document, create note
- Invite user, profile update
- Auth flows (login, signup, forgot/reset password)

Destructive action errors now use Sonner toasts instead of `alert()`.

### Loading / empty / error states

| Page | Loading | Empty | Error |
|------|---------|-------|-------|
| Dashboard | `loading.tsx` | Activity/cards empty copy | `error.tsx` |
| Properties | `loading.tsx` | "No properties found" | `error.tsx` |
| Prospects | `loading.tsx` | "No prospects found" | `error.tsx` |
| Contacts | `loading.tsx` | "No contacts found" | `error.tsx` |
| Documents | `loading.tsx` | "No documents found" | `error.tsx` |
| Search | `loading.tsx` | "No results found" | `error.tsx` |
| Notes | — | "No notes yet" | toast on delete failure |
| Activity | — | "No recent activity yet" | — |

Shared components: `src/components/ui/list-state.tsx`

---

## Dashboard Review

| Check | Status |
|-------|--------|
| Counts match database | Pass — stats use same RLS-scoped count queries |
| Activity feed accurate | Pass — server-side activity log with property scope |
| Assigned properties correct | Pass — admin sees recent properties; editor sees assignments |
| Recent prospects correct | Pass — ordered by `created_at`, RLS-filtered |
| Search results accurate | Pass — `search_global()` RPC with notes included |

---

## Verification Commands

All passed on June 15, 2026:

```bash
npm run test:rls      # 13/13
npm run db:integrity  # 10/10
npm run db:perf       # 8/8
npm run typecheck     # pass
npm run lint          # pass
npm run build         # pass
```

---

## Known Issues

1. **Production infrastructure not configured** — Remote Supabase and Vercel deployment pending (CHECKLIST Phase 2/14).
2. **No production error monitoring** — Sentry/logging not wired (post-launch phase).
3. **Email workflows not implemented** — Resend integration is Milestone 9+ scope.
4. **Beta seed uses metadata-only documents** — No actual files in storage bucket for seed documents.
5. **RLS tests require local Supabase** — Tests skip automatically if DB unavailable.

---

## Launch Blockers

| Blocker | Severity | Milestone |
|---------|----------|-----------|
| Production Supabase + Vercel deployment | High | Pre-launch |
| Production env vars and backups | High | Pre-launch |
| Client onboarding / first owner account on production | High | Pre-launch |
| Email notifications | Medium | Milestone 9 (out of M8 scope) |
| CSV/Excel import | Low | Post-MVP |

---

## Recommended Fixes (Post-M8)

1. Deploy to staging Vercel + link remote Supabase; run RLS tests against staging.
2. Map common database errors to friendly messages in server actions.
3. Add CI workflow running `typecheck`, `lint`, `build`, and `test:rls` (with Supabase service container).
4. Upload sample PDFs for beta seed documents to validate end-to-end download flow at scale.
5. Add rate limiting on auth routes before public launch.

---

## Readiness Score Breakdown

| Area | Score | Weight |
|------|------:|-------:|
| Feature completeness (MVP) | 95 | 25% |
| Security & RLS | 90 | 30% |
| Data integrity | 100 | 15% |
| Performance (local) | 95 | 15% |
| UX / error handling | 80 | 10% |
| Production readiness | 40 | 5% |

**Weighted total: ~82 / 100**

**Recommendation:** Proceed with **internal/staging beta**. Defer public production launch until infrastructure deployment and staging validation are complete.
