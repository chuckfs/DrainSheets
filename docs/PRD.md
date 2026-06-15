# Product Requirements Document (PRD)

## Project Name

DrainSheets

Version: 1.0 MVP

---

# Executive Summary

DrainSheets is a lightweight commercial real estate CRM and document management platform designed to replace the small subset of Smartsheet functionality currently used by the client.

The goal is to eliminate unnecessary enterprise software costs by providing a focused application tailored to the client's actual workflow.

The system will allow users to manage properties, prospects, contacts, documents, and internal notes while maintaining role-based access control.

This project is not intended to be a full Smartsheet replacement.

See `GLOSSARY.md` for canonical terminology.

---

# Problem Statement

The client currently pays approximately $400/month for Smartsheet but only uses a limited set of features.

Observed usage includes:

- Property and project tracking
- Prospect list management
- Contact management
- Spreadsheet-style record management
- Document storage
- User sharing and permissions
- Internal collaboration

The majority of Smartsheet's advanced functionality appears unused.

The objective is to create a simpler, more focused solution that supports existing workflows while reducing software costs.

---

# Goals

## Primary Goals

- Replace current Smartsheet workflow
- Reduce recurring software costs
- Improve usability
- Simplify data management
- Centralize property and prospect information

## Success Metrics

- Users can perform daily tasks without Smartsheet
- Data can be imported from existing spreadsheets (post-MVP phase)
- Multiple users can collaborate safely
- Documents remain organized and searchable

---

# User Roles

See `USER_ROLES.md` for role descriptions and `PERMISSIONS.md` for the full permissions matrix.

## Owner

Permissions:

- Full system access
- Invite and manage users
- Manage permissions and property assignments
- Create, edit, and archive all records
- Access all data

---

## Admin

Permissions:

- Create and edit properties
- Manage prospects and contacts
- Upload and delete documents
- Manage notes
- Archive properties
- View all data in the organization

Restrictions:

- Cannot invite or manage users
- Cannot modify ownership or billing

---

## Editor

Permissions:

- View assigned properties and related data
- Edit records on assigned properties
- Upload files on assigned properties
- Create and edit own notes

Restrictions:

- Cannot manage users
- Cannot modify permissions
- Cannot archive properties

---

# Core Features

## Authentication

Users must be able to:

- Sign in with email/password
- Sign in with Google
- Reset passwords
- Maintain authenticated sessions

Access is invite-only. The Owner invites users to the organization.

---

## Property Management

Users must be able to:

- Create properties
- Edit properties
- View properties
- Archive properties
- Search properties

Property records should contain:

- Name
- Description
- Status (active or archived)
- Creation date
- Related prospects
- Related documents
- Notes

---

## Prospect Management

Users must be able to:

- Create prospects
- Edit prospects
- View prospects
- Search prospects

Prospects belong to a property.

Prospect fields:

- Company name
- Category
- Website
- Status
- Comments

---

## Contact Management

Users must be able to:

- Create contacts
- Edit contacts
- Search contacts

Contact fields:

- Name
- Title
- Email
- Phone
- Notes

Contacts must belong to a prospect.

---

## Document Management

Users must be able to:

- Upload files
- Download files
- Delete files
- View file details

Supported file types:

- PDF
- DOCX
- XLSX
- PNG
- JPG

Documents must be associated with a property. They may optionally be associated with a prospect.

---

## Notes

Users must be able to:

- Create notes
- Edit notes
- Delete notes
- View notes with author and timestamp

Notes may be attached to a property or a prospect.

Each note must store:

- Author
- Timestamp
- Content

---

## Search

Users must be able to:

- Search properties
- Search prospects
- Search contacts
- Search documents

Search should be accessible globally.

---

# Dashboard

The dashboard should display:

## Statistics

- Total Properties
- Total Prospects
- Total Contacts
- Total Documents

Stat counts only. Charts and advanced analytics are out of scope for MVP.

## Recent Activity

Recent:

- Property creation
- Prospect creation
- Contact creation
- Document uploads
- Note creation

## Search

Global search bar

---

# Data Model

See `DATABASE_SCHEMA.md` for the full schema.

## Organization

The company using DrainSheets. All data belongs to one organization in MVP.

## Profiles (Users)

Fields:

- id
- org_id
- name
- email
- role
- status
- created_at
- updated_at

---

## Properties

Fields:

- id
- org_id
- name
- description
- status
- created_by
- created_at
- updated_at

---

## Prospects

Fields:

- id
- property_id
- company_name
- category
- website
- status
- comments
- created_at
- updated_at

---

## Contacts

Fields:

- id
- prospect_id
- name
- title
- email
- phone
- notes
- created_at
- updated_at

---

## Documents

Fields:

- id
- property_id
- prospect_id (optional)
- file_name
- file_path
- mime_type
- file_size
- uploaded_by
- created_at

---

## Notes

Fields:

- id
- property_id
- prospect_id (optional)
- user_id
- content
- created_at
- updated_at

---

## Property Assignments

Links Editors to properties they can access.

Fields:

- id
- property_id
- user_id
- created_at

---

# Non-Functional Requirements

## Security

- Secure authentication
- Role-based access control (see `PERMISSIONS.md`)
- Protected file access via private storage and signed URLs
- HTTPS only
- Invite-only registration

## Performance

- Fast search results
- Responsive UI
- Support at least 10,000 records

## Reliability

- Daily database backups
- Error logging
- File storage redundancy

---

# Technical Stack

Frontend:

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend:

- Supabase

Database:

- PostgreSQL

Authentication:

- Supabase Auth

Storage:

- Supabase Storage

Email:

- Resend (future phase)

Hosting:

- Vercel

---

# Out of Scope (Version 1)

The following features will not be included in the MVP:

- AI features
- Workflow automations
- Gantt charts
- Project scheduling
- Mobile applications
- SMS messaging
- Third-party CRM integrations
- Analytics dashboards with charts
- Mapping/GIS features
- Advanced reporting
- Kanban boards
- Data import (deferred to post-MVP)
- Email updates (deferred to post-MVP)

---

# MVP Completion Criteria

The MVP is considered complete when:

- Users can authenticate (email, Google, password reset)
- Owner can invite users
- Properties can be created, edited, and archived
- Prospects can be created and managed under properties
- Contacts can be created and managed under prospects
- Documents can be uploaded and organized
- Notes can be attached to properties and prospects
- Search functions correctly
- User permissions operate correctly per `PERMISSIONS.md`
- Editors can only access assigned properties
- The client can perform daily operations without Smartsheet
