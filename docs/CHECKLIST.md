# DrainSheets Build Checklist

## Phase 0 — Discovery

### Client Interview
- [ ] Schedule meeting with client
- [ ] Confirm number of users
- [ ] Confirm number of clients/projects
- [ ] Confirm number of documents stored
- [ ] Confirm external client access requirements
- [ ] Confirm email workflow
- [ ] Confirm sharing/permissions workflow
- [ ] Confirm data import requirements
- [ ] Identify any hidden Smartsheet features being used

### Existing System Audit
- [ ] Review all Smartsheet workspaces
- [ ] Review all sheet types
- [ ] Review document storage usage
- [ ] Review user roles
- [ ] Review sharing permissions
- [ ] Document all workflows

---

## Phase 1 — Planning & Architecture

### Product Requirements
- [x] Finalize MVP scope
- [x] Define user roles
- [x] Define permissions matrix
- [x] Define navigation structure (see UI_UX.md)
- [x] Define dashboard requirements

### Database Design
- [x] Design Organizations table
- [x] Design Profiles table
- [x] Design Properties table
- [x] Design Prospects table
- [x] Design Contacts table
- [x] Design Documents table
- [x] Design Notes table
- [x] Design Activity table
- [x] Design Property Assignments table
- [x] Design Invitations table
- [x] Create ER diagram (see DATABASE_SCHEMA.md)
- [x] Review relationships
- [x] Define RLS policy approach
- [x] Define search indexes

### Documentation Freeze (Milestone 0)
- [x] Glossary (GLOSSARY.md)
- [x] Permissions matrix (PERMISSIONS.md)
- [x] PRD reconciled to Property/Prospect model
- [x] MVP scope updated
- [x] Database schema extended

---

## Phase 2 — Project Setup

### Development Environment
- [x] Create GitHub repository
- [x] Create Cursor project
- [x] Create Next.js project
- [x] Configure TypeScript
- [x] Configure TailwindCSS
- [x] Configure shadcn/ui
- [x] Setup ESLint
- [x] Setup Prettier

### Infrastructure
- [ ] Create Supabase project (remote — link when ready)
- [x] Configure database (migrations in repo)
- [x] Configure storage bucket (migration)
- [x] Configure authentication (middleware + callback route)
- [ ] Create Vercel project
- [ ] Connect GitHub to Vercel

---

## Phase 3 — Authentication

### User Accounts
- [ ] Email login
- [ ] Password reset
- [ ] Google login
- [ ] Session management

### Permissions
- [ ] Owner role
- [ ] Admin role
- [ ] Editor role
- [ ] Route protection
- [ ] Permission middleware

---

## Phase 4 — Dashboard

### Dashboard Layout
- [ ] Create dashboard page
- [ ] Add navigation sidebar
- [ ] Add top navigation bar
- [ ] Add search bar

### Dashboard Widgets
- [ ] Total properties count
- [ ] Total prospects count
- [ ] Total contacts count
- [ ] Total documents count
- [ ] Recent activity
- [ ] Recent uploads

---

## Phase 5 — Property Management

### Property CRUD
- [ ] Create property
- [ ] Edit property
- [ ] Archive property
- [ ] View property details

### Property Table
- [ ] Sort properties
- [ ] Filter properties
- [ ] Search properties
- [ ] Pagination

### Prospect CRUD
- [ ] Create prospect
- [ ] Edit prospect
- [ ] View prospect details

### Prospect Table
- [ ] Sort prospects
- [ ] Filter prospects
- [ ] Search prospects

---

## Phase 6 — Contact Management

### Contact CRUD
- [ ] Create contact
- [ ] Edit contact
- [ ] View contact details

### Contact Linking
- [ ] Link contact to prospect
- [ ] Display contacts on prospect page

---

## Phase 7 — Document Management

### File Uploads
- [ ] Upload files
- [ ] Download files
- [ ] Delete files
- [ ] Preview files

### Storage
- [ ] Configure Supabase Storage
- [ ] Create storage policies
- [ ] Secure document access

### Property Documents
- [ ] Attach documents to property
- [ ] Attach documents to prospect
- [ ] View property documents
- [ ] Search documents

---

## Phase 8 — Notes System

### Notes
- [ ] Add note
- [ ] Edit note
- [ ] Delete note
- [ ] View notes history

### Note Tracking
- [ ] Record author
- [ ] Record timestamp

---

## Phase 9 — Activity Tracking

### Activity Feed
- [ ] Log property creation
- [ ] Log prospect creation
- [ ] Log contact creation
- [ ] Log document uploads
- [ ] Log note creation
- [ ] Log edits

### Activity Display
- [ ] Property activity timeline
- [ ] Global activity feed

---

## Phase 10 — Sharing & Permissions

### User Management
- [ ] Invite users
- [ ] Remove users (disable)
- [ ] Change user roles
- [ ] Assign properties to editors

### Access Control
- [ ] Owner permissions
- [ ] Admin permissions
- [ ] Editor permissions
- [ ] Permission testing

---

## Phase 11 — Email Updates

### Email Functionality
- [ ] Configure Resend
- [ ] Send update emails
- [ ] Email templates
- [ ] Track sent emails

### Client Integration
- [ ] Send update from client page
- [ ] Attach documents to emails

---

## Phase 12 — Data Import

### Import Tools
- [ ] CSV import
- [ ] Excel import
- [ ] Mapping tool

### Validation
- [ ] Duplicate detection
- [ ] Import error handling
- [ ] Import preview

---

## Phase 13 — Testing

### Functional Testing
- [ ] User authentication
- [ ] Property CRUD
- [ ] Prospect CRUD
- [ ] Contact CRUD
- [ ] File uploads
- [ ] Notes
- [ ] Activity logs
- [ ] Email sending

### Security Testing
- [ ] Role testing
- [ ] Access testing
- [ ] File access testing

### Performance Testing
- [ ] Search performance
- [ ] File upload performance
- [ ] Database query review

---

## Phase 14 — Deployment

### Production Setup
- [ ] Configure production database
- [ ] Configure production storage
- [ ] Configure environment variables
- [ ] Configure backups

### Launch
- [ ] Deploy to Vercel
- [ ] Verify production functionality
- [ ] Create admin account
- [ ] Client onboarding

---

## Phase 15 — Post Launch

### Monitoring
- [ ] Error logging
- [ ] Usage tracking
- [ ] Backup verification

### Feedback
- [ ] Collect client feedback
- [ ] Create bug list
- [ ] Prioritize feature requests
