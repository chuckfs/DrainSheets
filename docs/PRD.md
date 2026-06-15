# Product Requirements Document (PRD)

## Project Name

DrainSheets

Version: 1.0 MVP

---

# Executive Summary

DrainSheets is a lightweight commercial real estate CRM and document management platform designed to replace the small subset of Smartsheet functionality currently used by the client.

The goal is to eliminate unnecessary enterprise software costs by providing a focused application tailored to the client's actual workflow.

The system will allow users to manage clients, prospects, contacts, documents, and internal notes while maintaining role-based access control.

This project is not intended to be a full Smartsheet replacement.

---

# Problem Statement

The client currently pays approximately $400/month for Smartsheet but only uses a limited set of features.

Observed usage includes:

- Client/project tracking
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
- Centralize client information

## Success Metrics

- Users can perform daily tasks without Smartsheet
- Data can be imported from existing spreadsheets
- Multiple users can collaborate safely
- Documents remain organized and searchable

---

# User Roles

## Owner

Permissions:

- Full system access
- Manage users
- Manage permissions
- Create/Edit/Delete records
- Access all data

---

## Admin

Permissions:

- Create/Edit clients
- Create/Edit contacts
- Upload documents
- Manage notes
- View all data

Restrictions:

- Cannot manage system ownership

---

## Editor

Permissions:

- View records
- Edit assigned records
- Upload files
- Create notes

Restrictions:

- Cannot manage users
- Cannot modify permissions

---

# Core Features

## Authentication

Users must be able to:

- Sign in with email/password
- Sign in with Google
- Reset passwords
- Maintain authenticated sessions

---

## Client Management

Users must be able to:

- Create clients
- Edit clients
- View clients
- Archive clients
- Search clients

Client records should contain:

- Name
- Description
- Status
- Creation date
- Related contacts
- Related documents
- Notes

---

## Contact Management

Users must be able to:

- Create contacts
- Edit contacts
- Delete contacts
- Search contacts

Contact fields:

- Name
- Title
- Company
- Email
- Phone
- Notes

Contacts must belong to a client.

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

Documents must be associated with clients.

---

## Notes

Users must be able to:

- Create notes
- Edit notes
- Delete notes
- View note history

Each note must store:

- Author
- Timestamp
- Content

---

## Search

Users must be able to:

- Search clients
- Search contacts
- Search documents

Search should be accessible globally.

---

# Dashboard

The dashboard should display:

## Statistics

- Total Clients
- Total Contacts
- Total Documents

## Recent Activity

Recent:

- Client creation
- Contact creation
- Document uploads
- Note creation

## Search

Global search bar

---

# Data Model

## Users

Fields:

- id
- name
- email
- role
- created_at

---

## Clients

Fields:

- id
- name
- description
- status
- created_at

---

## Contacts

Fields:

- id
- client_id
- name
- title
- email
- phone
- notes

---

## Documents

Fields:

- id
- client_id
- file_name
- file_url
- uploaded_by
- uploaded_at

---

## Notes

Fields:

- id
- client_id
- user_id
- content
- created_at

---

# Non-Functional Requirements

## Security

- Secure authentication
- Role-based access control
- Protected file access
- HTTPS only

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
- Analytics dashboards
- Mapping/GIS features
- Advanced reporting
- Kanban boards

---

# MVP Completion Criteria

The MVP is considered complete when:

- Users can authenticate
- Clients can be created and managed
- Contacts can be created and managed
- Documents can be uploaded and organized
- Notes can be attached to clients
- Search functions correctly
- User permissions operate correctly
- Client can perform daily operations without Smartsheet
