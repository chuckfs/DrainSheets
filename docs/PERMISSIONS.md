# Permissions Matrix

Canonical access rules for MVP. Enforced in Row-Level Security (RLS), Server Actions, and UI.

See `USER_ROLES.md` for role descriptions and `GLOSSARY.md` for entity definitions.

---

## Access Model

- All users belong to one **Organization**.
- **Owners** and **Admins** can access all properties in the organization.
- **Editors** can only access properties assigned via **Property Assignments**.
- Registration is invite-only. The Owner sends invitations.

---

## Permissions Matrix

| Action | Owner | Admin | Editor |
|--------|:-----:|:-----:|:------:|
| Invite users | Yes | No | No |
| Manage users (role, disable) | Yes | No | No |
| Assign properties to editors | Yes | No | No |
| Create property | Yes | Yes | Assigned only |
| Edit property | Yes | Yes | Assigned only |
| Archive property | Yes | Yes | No |
| Create prospect | Yes | Yes | Assigned only |
| Edit prospect | Yes | Yes | Assigned only |
| Create contact | Yes | Yes | Assigned only |
| Edit contact | Yes | Yes | Assigned only |
| Upload documents | Yes | Yes | Assigned only |
| Download documents | Yes | Yes | Assigned only |
| Delete documents | Yes | Yes | Own uploads only |
| Create notes | Yes | Yes | Assigned only |
| Edit notes | Yes | Yes | Own notes only |
| Delete notes | Yes | Yes | Own notes only |
| View activity | Yes | Yes | Assigned only |
| Search records | Yes | Yes | Assigned only |

"Assigned only" means the user has a row in `property_assignments` for that property. Owners and Admins bypass assignment checks.

---

## Delete and Archive Rules

| Entity | MVP behavior |
|--------|--------------|
| Property | Archive only (set status to `archived`). No hard delete in MVP. |
| Prospect | No delete in MVP. Edit status to `passed` or `closed` instead. |
| Contact | No delete in MVP. |
| Document | Delete allowed per matrix above. |
| Note | Delete allowed per matrix above (own notes for Editor). |
| User | Owner can disable (`status = disabled`). No hard delete in MVP. |

---

## RLS Implementation Notes

### Helper functions

```sql
has_role(min_role user_role)      -- true if user's role >= min_role
is_org_member(org_id uuid)        -- true if user's org_id matches
can_access_property(property_id)  -- true for Owner/Admin in org, or Editor with assignment
```

### Policy patterns

**profiles**
- SELECT: users in same organization
- UPDATE own profile (name only)
- Owner can update role and status for org members

**properties**
- SELECT: `can_access_property(id)`
- INSERT: Owner, Admin; Editor if creating is ever allowed (MVP: Owner and Admin only)
- UPDATE: Owner, Admin on all; Editor on assigned
- No DELETE policy in MVP (use archive via UPDATE)

**prospects, contacts, documents, notes**
- All operations require `can_access_property` via the parent property chain

**property_assignments**
- SELECT: Owner, Admin
- INSERT/DELETE: Owner only

**invitations**
- All operations: Owner only

**activity**
- SELECT: per `can_access_property` on `property_id`, or all for Owner/Admin when `property_id` is null
- INSERT: server-side only (triggers or service role)

---

## UI Enforcement

Hide actions the user cannot perform. UI checks are not a security boundary — RLS and Server Action validation are authoritative.

---

## Testing Requirements

Before MVP release, verify:

- Editor cannot access unassigned properties
- Editor cannot archive properties
- Editor can only delete own documents and notes
- Admin cannot invite users
- Owner can manage all records in the organization
- Disabled users cannot authenticate
