# DrainSheets Database Schema

## Overview

DrainSheets is a CRM and document management platform for commercial real estate teams.

Users manage:

- Properties
- Tenant Prospects
- Franchise Prospects
- Contacts
- Documents
- Notes

The system is organized around Properties and Prospect Lists.

---

# Entity Relationship Overview

Organization
├── Users
├── Properties
│   ├── Prospects
│   ├── Contacts
│   ├── Documents
│   └── Notes
└── Activity

---

# Users

Purpose:

Stores authenticated users.

Fields:

id
- UUID
- Primary Key

name
- Text
- Required

email
- Text
- Unique

role
- owner
- admin
- editor

created_at
- Timestamp

updated_at
- Timestamp

---

# Properties

Purpose:

Represents a commercial property or project.

Examples:

- 1040 NJ 35
- Michael Grillo Search
- Luxury Retail Tenant Prospect List

Fields:

id
- UUID
- Primary Key

name
- Text
- Required

description
- Text

status
- active
- archived

created_by
- UUID

created_at
- Timestamp

updated_at
- Timestamp

---

# Prospects

Purpose:

Stores businesses being targeted.

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
- Foreign Key

company_name
- Text

category
- Text

website
- Text

status
- Text

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

prospect_id
- UUID

name
- Text

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

Stores files attached to properties or prospects.

Fields:

id
- UUID

property_id
- UUID

prospect_id
- UUID

file_name
- Text

file_path
- Text

uploaded_by
- UUID

created_at
- Timestamp

---

# Notes

Purpose:

Stores internal notes.

Fields:

id
- UUID

property_id
- UUID

prospect_id
- UUID

user_id
- UUID

content
- Text

created_at
- Timestamp

updated_at
- Timestamp

---

# Activity

Purpose:

Audit trail.

Fields:

id
- UUID

user_id
- UUID

property_id
- UUID

action
- Text

created_at
- Timestamp

---

# Permissions

Owner

- Full access

Admin

- Create
- Edit
- Upload
- Manage records

Editor

- View
- Edit
- Add notes
- Upload files

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

---

# Storage Structure

documents/

property-id/

file.pdf

lease.pdf

contact-sheet.xlsx

---

# Future Tables (Not MVP)

email_logs

tasks

notifications

automations

integrations
