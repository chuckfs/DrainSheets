-- G1 Phase: sheet templates and system template seeds

CREATE TABLE public.sheet_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations (id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('system', 'org', 'user')),
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  current_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sheet_templates_scope_org_check CHECK (
    (scope = 'system' AND org_id IS NULL)
    OR (scope IN ('org', 'user') AND org_id IS NOT NULL)
  ),
  CONSTRAINT sheet_templates_user_created_by_check CHECK (
    scope <> 'user' OR created_by IS NOT NULL
  )
);

CREATE UNIQUE INDEX sheet_templates_system_key_idx
  ON public.sheet_templates (key)
  WHERE scope = 'system';

CREATE UNIQUE INDEX sheet_templates_org_key_idx
  ON public.sheet_templates (org_id, key)
  WHERE scope = 'org';

CREATE INDEX sheet_templates_org_id_idx ON public.sheet_templates (org_id);

CREATE TRIGGER sheet_templates_set_updated_at
  BEFORE UPDATE ON public.sheet_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.sheet_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.sheet_templates (id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  columns JSONB NOT NULL,
  seed_rows JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_id, version)
);

CREATE INDEX sheet_template_versions_template_id_idx
  ON public.sheet_template_versions (template_id);

ALTER TABLE public.sheets
  ADD CONSTRAINT sheets_template_id_fkey
  FOREIGN KEY (template_id) REFERENCES public.sheet_templates (id) ON DELETE SET NULL;

ALTER TABLE public.sheet_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheet_template_versions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- System template seeds (stable UUIDs for idempotency)
-- ---------------------------------------------------------------------------

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
    '[
      {"key": "name", "label": "Name", "type": "text", "position": 0, "is_primary": true, "is_pinned": true, "width": null, "config": {}}
    ]'::jsonb,
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
