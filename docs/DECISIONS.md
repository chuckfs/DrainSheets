# Decisions

2026-06-15

Decision:
Use Supabase.

Reason:
Database, authentication, and storage in one platform.

---

Decision:
Build custom CRM instead of replacing all Smartsheet functionality.

Reason:
Client only uses a small subset of features.

---

2026-06-15

Decision:
Adopt Property → Prospect → Contact as the canonical data model.

Reason:
Aligns with commercial real estate workflows and existing Smartsheet usage. The PRD previously used "Client" as a data entity; that term now refers only to the paying customer (see GLOSSARY.md).

---

2026-06-15

Decision:
Archive properties instead of hard-deleting them in MVP.

Reason:
Preserves data integrity and audit history. Matches Smartsheet-style workflow where records are hidden rather than destroyed.

---

2026-06-15

Decision:
Editors access data via property assignments, not org-wide access.

Reason:
PRD requires "edit assigned records." Implemented via `property_assignments` table and RLS helper `can_access_property()`.

---

2026-06-15

Decision:
Invite-only registration for MVP.

Reason:
Small team, Owner-controlled access. No open sign-up.

---

2026-06-15

Decision:
Defer data import and email updates to post-MVP.

Reason:
Not required for daily operations at launch. Documented in MVP_SCOPE.md as excluded.
