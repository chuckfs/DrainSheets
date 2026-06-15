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
- [ ] Finalize MVP scope
- [ ] Define user roles
- [ ] Define permissions matrix
- [ ] Define navigation structure
- [ ] Define dashboard requirements

### Database Design
- [ ] Design Users table
- [ ] Design Clients table
- [ ] Design Contacts table
- [ ] Design Documents table
- [ ] Design Notes table
- [ ] Design Activity table
- [ ] Create ER diagram
- [ ] Review relationships

---

## Phase 2 — Project Setup

### Development Environment
- [ ] Create GitHub repository
- [ ] Create Cursor project
- [ ] Create Next.js project
- [ ] Configure TypeScript
- [ ] Configure TailwindCSS
- [ ] Configure shadcn/ui
- [ ] Setup ESLint
- [ ] Setup Prettier

### Infrastructure
- [ ] Create Supabase project
- [ ] Configure database
- [ ] Configure storage bucket
- [ ] Configure authentication
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
- [ ] Total clients count
- [ ] Total contacts count
- [ ] Recent activity
- [ ] Recent uploads

---

## Phase 5 — Client Management

### Client CRUD
- [ ] Create client
- [ ] Edit client
- [ ] Delete client
- [ ] Archive client
- [ ] View client details

### Client Table
- [ ] Sort clients
- [ ] Filter clients
- [ ] Search clients
- [ ] Pagination

---

## Phase 6 — Contact Management

### Contact CRUD
- [ ] Create contact
- [ ] Edit contact
- [ ] Delete contact
- [ ] View contact details

### Contact Linking
- [ ] Link contact to client
- [ ] Display contacts on client page

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

### Client Documents
- [ ] Attach documents to client
- [ ] View client documents
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
- [ ] Log client creation
- [ ] Log contact creation
- [ ] Log document uploads
- [ ] Log note creation
- [ ] Log edits

### Activity Display
- [ ] Client activity timeline
- [ ] Global activity feed

---

## Phase 10 — Sharing & Permissions

### User Management
- [ ] Invite users
- [ ] Remove users
- [ ] Change user roles

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
- [ ] Client CRUD
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
