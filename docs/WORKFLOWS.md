
## Workflow: Create Property

1. User clicks Create Property
2. User enters property information
3. User saves property
4. Property appears in dashboard
5. Activity is logged

---

## Workflow: Archive Property

1. Owner or Admin opens a Property
2. User clicks Archive Property
3. User confirms archive action
4. Property status changes to archived
5. Property is hidden from default lists but remains searchable
6. Activity is logged

---

## Workflow: Add Prospect

1. User opens a Property
2. User clicks Add Prospect
3. User enters company information
4. User enters category
5. User enters website
6. User saves prospect
7. Prospect appears in prospect list
8. Activity is logged

---

## Workflow: Add Contact

1. User opens a Prospect
2. User clicks Add Contact
3. User enters name
4. User enters title
5. User enters email
6. User enters phone
7. User saves contact
8. Activity is logged

---

## Workflow: Upload Document

1. User opens Property or Prospect
2. User clicks Upload Document
3. User selects file
4. File uploads to Supabase Storage
5. File metadata is saved
6. File appears in document list
7. Activity is logged

---

## Workflow: Add Note

1. User opens Property or Prospect
2. User clicks Add Note
3. User enters note
4. User saves note
5. Note appears in timeline
6. Activity is logged

---

## Workflow: Invite User

1. Owner opens Settings → Users
2. Owner enters email and selects role
3. Owner sends invitation
4. Invitation email is sent (or link is copied in MVP)
5. Invitee signs up via email or Google
6. Profile is created with invited role
7. Invitation is marked accepted

---

## Workflow: Assign Property to Editor

1. Owner opens Settings → Users or Property detail
2. Owner selects an Editor
3. Owner assigns one or more properties
4. Editor can now access those properties and related data

---

## Workflow: Search

1. User enters search term
2. System searches:
   - Properties
   - Prospects
   - Contacts
   - Documents
3. Results are filtered by user permissions
4. Results are displayed grouped by entity type
