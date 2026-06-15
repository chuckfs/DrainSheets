# DrainSheets Database Schema

## Overview

DrainSheets is a CRM and document management platform for commercial real estate teams.

Users manage:

- Properties
- Prospects
- Contacts
- Documents
- Notes

The system is organized around an Organization, Properties, and Prospect Lists.

See `GLOSSARY.md` for terminology and `PERMISSIONS.md` for access rules.

---

# Entity Relationship Overview

```
Organization
├── Profiles (users)
├── Invitations
├── Properties
│   ├── Prospects
│   │   └── Contacts
│   ├── Documents (prospect_id optional)
│   ├── Notes (prospect_id optional)
│   └── Property Assignments → Profiles
└── Activity
```

---

# Enums

```
user_role:        owner | admin | editor
user_status:      active | invited | disabled
property_status:  active | archived
prospect_status:  researching | contacted | interested | passed | closed
```

`prospect_status` values may be adjusted after client discovery.

---

# Organizations

Purpose:

Represents the company using DrainSheets. Single organization per deployment in MVP.

Fields:

id
- UUID
- Primary Key

name
- Text
- Required

created_at
- Timestamp

---

# Profiles

Purpose:

Extends `auth.users` with application-specific fields. One profile per authenticated user.

Fields:

id
- UUID
- Primary Key
- References `auth.users(id)`

org_id
- UUID
- Foreign Key → organizations

name
- Text
- Required

email
- Text
- Unique

role
- user_role enum
- Required

status
- user_status enum
- Default: active

created_at
- Timestamp

updated_at
- Timestamp

---

# Properties

Purpose:

Represents a commercial property, project, or prospecting initiative.

Examples:

- 1040 NJ 35
- Michael Grillo Search
- Luxury Retail Tenant Prospect List

Fields:

id
- UUID
- Primary Key

org_id
- UUID
- Foreign Key → organizations

name
- Text
- Required

address
- Text
- Optional

city
- Text
- Optional

state
- Text
- Optional

description
- Text

status
- property_status enum
- Default: active

created_by
- UUID
- Foreign Key → profiles

created_at
- Timestamp

updated_at
- Timestamp

Indexes:

- org_id
- status
- name
- city
- state

---

# Prospects

Purpose:

Stores businesses being targeted within a property.

Examples:

- Burberry
- Gucci
- Veterinary Care Group
- Great Harvest Bread

Fields:

id
- UUID
- Primary Key

property_id
- UUID
- Foreign Key → properties

company_name
- Text
- Required

category
- Text

website
- Text

status
- prospect_status enum

comments
- Text

created_at
- Timestamp

updated_at
- Timestamp

---

# Contacts

Purpose:

Stores contact people related to prospects.

Fields:

id
- UUID
- Primary Key

prospect_id
- UUID
- Foreign Key → prospects

name
- Text
- Required

title
- Text

email
- Text

phone
- Text

notes
- Text

created_at
- Timestamp

updated_at
- Timestamp

---

# Documents

Purpose:

Stores file metadata. Files live in Supabase Storage.

Fields:

id
- UUID
- Primary Key

property_id
- UUID
- Foreign Key → properties
- Required

prospect_id
- UUID
- Foreign Key → prospects
- Optional

file_name
- Text
- Required

file_path
- Text
- Required (storage path)

mime_type
- Text

file_size
- BigInt (bytes)

uploaded_by
- UUID
- Foreign Key → profiles

created_at
- Timestamp

Constraint:

If `prospect_id` is set, the prospect must belong to `property_id`.

---

# Notes

Purpose:

Stores internal notes on properties or prospects.

Fields:

id
- UUID
- Primary Key

property_id
- UUID
- Foreign Key → properties
- Required

prospect_id
- UUID
- Foreign Key → prospects
- Optional

user_id
- UUID
- Foreign Key → profiles

content
- Text
- Required

created_at
- Timestamp

updated_at
- Timestamp

Constraint:

If `prospect_id` is set, the prospect must belong to `property_id`.

---

# Property Assignments

Purpose:

Grants Editors access to specific properties.

Fields:

id
- UUID
- Primary Key

property_id
- UUID
- Foreign Key → properties

user_id
- UUID
- Foreign Key → profiles

created_at
- Timestamp

Unique:

(property_id, user_id)

---

# Invitations

Purpose:

Tracks pending user invites sent by the Owner.

Fields:

id
- UUID
- Primary Key

org_id
- UUID
- Foreign Key → organizations

email
- Text
- Required

role
- user_role enum
- Default: editor

token_hash
- Text
- Required

expires_at
- Timestamp
- Required

accepted_at
- Timestamp
- Nullable

invited_by
- UUID
- Foreign Key → profiles

created_at
- Timestamp

---

# Activity

Purpose:

Append-only audit trail for the dashboard activity feed.

Fields:

id
- UUID
- Primary Key

org_id
- UUID
- Foreign Key → organizations

user_id
- UUID
- Foreign Key → profiles

entity_type
- Text
- e.g. property, prospect, contact, document, note

entity_id
- UUID

property_id
- UUID
- Foreign Key → properties
- Nullable (denormalized for filtering)

action
- Text
- e.g. created, updated, archived, uploaded, deleted

metadata
- JSONB
- Optional context (entity name, file name, etc.)

created_at
- Timestamp

---

# Indexes

```
profiles(org_id)
profiles(email)

properties(org_id, status)
properties(org_id, name)

prospects(property_id)
prospects(company_name)

contacts(prospect_id)
contacts(email)

documents(property_id)
documents(prospect_id)

notes(property_id)
notes(prospect_id)

property_assignments(user_id, property_id) UNIQUE

activity(org_id, created_at DESC)
activity(property_id, created_at DESC)

invitations(org_id, email)
invitations(token_hash)
```

Full-text search (GIN) on:

- properties.name
- prospects.company_name, prospects.category
- contacts.name, contacts.email
- documents.file_name
- notes.content

---

# Row-Level Security

RLS is enabled on all tables. Access is enforced at the database layer.

Helper functions:

```
has_role(min_role user_role) → boolean
is_org_member(org_id uuid) → boolean
can_access_property(property_id uuid) → boolean
```

Access rules:

| Table | Read | Write |
|-------|------|-------|
| organizations | org members | Owner only |
| profiles | org members | self (name); Owner (role, status) |
| properties | per `PERMISSIONS.md` | per `PERMISSIONS.md` |
| prospects | via property access | via property access |
| contacts | via property access | via property access |
| documents | via property access | via property access |
| notes | via property access | per `PERMISSIONS.md` |
| property_assignments | Owner, Admin | Owner only |
| invitations | Owner | Owner only |
| activity | per `PERMISSIONS.md` | server/trigger insert only |

Editors can only access properties where a `property_assignments` row exists for their user ID. Owners and Admins can access all properties in the organization.

---

# Search Requirements

Searchable fields:

Properties
- name

Prospects
- company_name
- category

Contacts
- name
- email

Documents
- file_name

Notes
- content

Implemented via PostgreSQL full-text search and a `search_global` RPC function.

---

# Storage Structure

Private bucket: `documents`

Path pattern:

```
{org_id}/{property_id}/{document_id}_{sanitized_filename}
```

When attached to a prospect, the database `prospect_id` field links the file. The storage path remains under the property folder.

---

# Referential Integrity

| Relationship | ON DELETE |
|--------------|-----------|
| prospects → properties | CASCADE |
| contacts → prospects | CASCADE |
| documents → properties | CASCADE |
| documents → prospects | SET NULL |
| notes → properties | CASCADE |
| notes → prospects | SET NULL |
| property_assignments → properties | CASCADE |
| property_assignments → profiles | CASCADE |

Properties are archived, not deleted, in MVP. Hard deletes are Owner-only and reserved for future use.

---

# Future Tables (Not MVP)

email_logs

tasks

notifications

automations

integrations
