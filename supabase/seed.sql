-- G1 native bootstrap: default org + system templates (idempotent)
-- Profiles are created via auth trigger on first signup.

INSERT INTO public.organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Default Organization')
ON CONFLICT (id) DO NOTHING;

-- System templates are seeded in migration 0009_templates.sql.
-- Re-assert template rows after seed for environments that skip migration re-run:
INSERT INTO public.sheet_templates (id, org_id, scope, key, name, description, current_version)
VALUES
  (
    '10000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    'system',
    'blank',
    'Blank',
    'Single primary text column.',
    1
  ),
  (
    '10000000-0000-0000-0000-000000000002'::uuid,
    NULL,
    'system',
    'tenant_prospect_list',
    'Tenant Prospect List',
    'CRE tenant prospecting grid with company, contact, status, use, website, and comments.',
    1
  ),
  (
    '10000000-0000-0000-0000-000000000003'::uuid,
    NULL,
    'system',
    'deal_tracker',
    'Deal Tracker',
    'CRE deal tracking with address, pricing, and stage.',
    1
  ),
  (
    '10000000-0000-0000-0000-000000000004'::uuid,
    NULL,
    'system',
    'contact_database',
    'Contact Database',
    'Org contact grid template for people records.',
    1
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sheet_template_versions (template_id, version, columns, seed_rows)
VALUES
  (
    '10000000-0000-0000-0000-000000000001'::uuid,
    1,
    '[{"key": "name", "label": "Name", "type": "text", "position": 0, "is_primary": true, "is_pinned": true, "width": null, "config": {}}]'::jsonb,
    NULL
  ),
  (
    '10000000-0000-0000-0000-000000000002'::uuid,
    1,
    '[
      {"key": "company", "label": "Company", "type": "text", "position": 0, "is_primary": true, "is_pinned": true, "width": null, "config": {}},
      {"key": "contact", "label": "Contact", "type": "contact", "position": 1, "is_primary": false, "is_pinned": true, "width": null, "config": {}},
      {"key": "status", "label": "Status", "type": "select", "position": 2, "is_primary": false, "is_pinned": true, "width": null, "config": {"options": [
        {"value": "researching", "label": "Researching", "color": "#6b7280"},
        {"value": "contacted", "label": "Contacted", "color": "#3b82f6"},
        {"value": "interested", "label": "Interested", "color": "#22c55e"},
        {"value": "passed", "label": "Passed", "color": "#ef4444"},
        {"value": "closed", "label": "Closed", "color": "#8b5cf6"}
      ]}},
      {"key": "use", "label": "Use", "type": "text", "position": 3, "is_primary": false, "is_pinned": false, "width": null, "config": {}},
      {"key": "website", "label": "Website", "type": "url", "position": 4, "is_primary": false, "is_pinned": false, "width": null, "config": {}},
      {"key": "comments", "label": "Comments", "type": "long_text", "position": 5, "is_primary": false, "is_pinned": false, "width": null, "config": {}}
    ]'::jsonb,
    NULL
  ),
  (
    '10000000-0000-0000-0000-000000000003'::uuid,
    1,
    '[
      {"key": "address", "label": "Address", "type": "text", "position": 0, "is_primary": true, "is_pinned": true, "width": null, "config": {}},
      {"key": "purchase_price", "label": "Purchase Price", "type": "currency", "position": 1, "is_primary": false, "is_pinned": true, "width": null, "config": {"currency": "USD"}},
      {"key": "ppsf", "label": "PPSF", "type": "currency", "position": 2, "is_primary": false, "is_pinned": false, "width": null, "config": {"currency": "USD"}},
      {"key": "nnn", "label": "NNN", "type": "text", "position": 3, "is_primary": false, "is_pinned": false, "width": null, "config": {}},
      {"key": "stage", "label": "Stage", "type": "select", "position": 4, "is_primary": false, "is_pinned": false, "width": null, "config": {"options": [
        {"value": "lead", "label": "Lead", "color": "#6b7280"},
        {"value": "under_contract", "label": "Under Contract", "color": "#3b82f6"},
        {"value": "closed", "label": "Closed", "color": "#22c55e"},
        {"value": "dead", "label": "Dead", "color": "#ef4444"}
      ]}}
    ]'::jsonb,
    NULL
  ),
  (
    '10000000-0000-0000-0000-000000000004'::uuid,
    1,
    '[
      {"key": "first_name", "label": "First Name", "type": "text", "position": 0, "is_primary": true, "is_pinned": true, "width": null, "config": {}},
      {"key": "last_name", "label": "Last Name", "type": "text", "position": 1, "is_primary": false, "is_pinned": true, "width": null, "config": {}},
      {"key": "email", "label": "Email", "type": "email", "position": 2, "is_primary": false, "is_pinned": false, "width": null, "config": {}},
      {"key": "phone", "label": "Phone", "type": "phone", "position": 3, "is_primary": false, "is_pinned": false, "width": null, "config": {}},
      {"key": "title", "label": "Title", "type": "text", "position": 4, "is_primary": false, "is_pinned": false, "width": null, "config": {}},
      {"key": "company", "label": "Company", "type": "text", "position": 5, "is_primary": false, "is_pinned": false, "width": null, "config": {}}
    ]'::jsonb,
    NULL
  )
ON CONFLICT (template_id, version) DO NOTHING;
