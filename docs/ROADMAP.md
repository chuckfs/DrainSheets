# Project Roadmap

## Working Name

DrainSheets (temporary)

## Purpose:

Replace the subset of Smartsheet currently being used by the commercial real estate team while eliminating unnecessary enterprise features and reducing monthly costs.

⸻

## Phase 0 — Discovery (1–3 Days)

### Goal: Verify assumptions.

## Deliverables

* Interview client
* Document workflows
* Confirm user count
* Confirm permissions
* Confirm document storage needs

Questions

Users

* How many users?
* How many clients?
* How many documents?
* Any external clients logging in?

Workflow

* How do they add a client?
* How do they upload files?
* How do they share records?
* How do they send updates?

Data

* Do they need import from Smartsheet?
* How many years of data?
* What file types?

Success Criteria

We know exactly:

* What they use
* What they don’t use
* What must exist on Day 1

⸻

Phase 1 — Architecture & Database (2–3 Days)

Goal: Build foundation before UI.

Design Data Model

Users

Users

Clients

Clients

Contacts

Contacts

Documents

Documents

Notes

Notes

Activity Logs

Activity

Deliverables

* ER diagram
* Database schema
* User roles
* Storage architecture

Success Criteria

Database finalized.

⸻

Phase 2 — Authentication & Permissions (2–4 Days)

Goal: Secure access.

Features

Login

* Email
* Google

Roles

* Owner
* Admin
* Editor

Permissions

Owner

* Full access

Admin

* Manage data

Editor

* Edit records only

Success Criteria

Users can log in and see authorized data.

⸻

Phase 3 — Core CRM (1 Week)

Goal: Replace 80% of current Smartsheet usage.

Features

Client Management

Create

Edit

Archive

Search

Filter

Contact Management

Add contacts

Edit contacts

View contacts

Spreadsheet View

Columns

Sorting

Filtering

Bulk edit

Success Criteria

Client can stop using spreadsheets.

⸻

Phase 4 — Document Management (3–5 Days)

Goal: Replace Smartsheet attachments.

Features

Upload

Preview

Download

Delete

Version history (optional)

Storage

Supabase Storage

Success Criteria

Every client/project can have documents attached.

⸻

Phase 5 — Notes & Activity Tracking (2–3 Days)

Goal: Preserve context.

Notes

Per client

Per contact

Timestamped

Activity Feed

Created client

Uploaded document

Edited contact

Shared project

Success Criteria

Users can track history.

⸻

Phase 6 — Sharing & Collaboration (3–5 Days)

Goal: Replace Smartsheet sharing.

Features

Invite users

Assign permissions

Workspace access

Project access

Success Criteria

Multiple team members can collaborate.

⸻

Phase 7 — Email Updates (2–4 Days)

Goal: Replace quick-update feature.

Features

Send update

Select recipients

Attach files

Log sent emails

Success Criteria

Users can communicate from inside platform.

⸻

Phase 8 — Import Existing Data (3–5 Days)

Goal: Migrate away from Smartsheet.

Features

CSV Import

Excel Import

Validation

Duplicate detection

Success Criteria

Client data imported.

⸻

Phase 9 — Beta Release (1 Week)

Goal: Real-world testing.

Activities

Client testing

Bug fixing

Feedback

Performance review

Success Criteria

Client uses platform daily.

⸻

Phase 10 — Production Release

Goal: Cancel Smartsheet.

Deliverables

Production deployment

Backups

Monitoring

Training

Documentation

⸻

Future Features (Not MVP)

These should NOT be built initially.

AI Search

“Show all veterinary prospects in NJ”

AI Summaries

Client history summaries

Maps

Property locations

Deal Pipeline

Kanban board

Mobile App

iOS

Android

CRM Integrations

Salesforce

HubSpot

E-signatures

Lease approvals
