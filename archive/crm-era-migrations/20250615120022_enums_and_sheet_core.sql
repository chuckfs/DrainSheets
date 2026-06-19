-- S0-1 Migration 22: enums and sheet core tables (Expand phase)
-- Authoritative spec: S0-1_SHEET_ENGINE_DESIGN.md §2, §8

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.column_type AS ENUM (
  'text',
  'long_text',
  'number',
  'currency',
  'date',
  'url',
  'email',
  'phone',
  'select',
  'checkbox',
  'contact'
);

CREATE TYPE public.sheet_status AS ENUM ('active', 'archived');

-- ---------------------------------------------------------------------------
-- sheets (generalizes properties)
-- ---------------------------------------------------------------------------

CREATE TABLE public.sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  status public.sheet_status NOT NULL DEFAULT 'active',
  template_key TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  workspace_id UUID,
  folder_id UUID,
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector(
      'english',
      coalesce(name, '') || ' ' ||
      coalesce(address, '') || ' ' ||
      coalesce(city, '') || ' ' ||
      coalesce(state, '')
    )
  ) STORED
);

CREATE INDEX sheets_org_id_status_idx ON public.sheets (org_id, status);
CREATE INDEX sheets_org_id_name_idx ON public.sheets (org_id, name);
CREATE INDEX sheets_search_vector_idx ON public.sheets USING gin (search_vector);
CREATE INDEX sheets_workspace_id_idx ON public.sheets (workspace_id);
CREATE INDEX sheets_folder_id_idx ON public.sheets (folder_id);

CREATE TRIGGER sheets_set_updated_at
  BEFORE UPDATE ON public.sheets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- sheet_columns (typed schema per sheet)
-- ---------------------------------------------------------------------------

CREATE TABLE public.sheet_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES public.sheets (id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  type public.column_type NOT NULL,
  position INTEGER NOT NULL,
  width INTEGER,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sheet_columns_sheet_id_key_unique UNIQUE (sheet_id, key)
);

CREATE INDEX sheet_columns_sheet_id_position_idx ON public.sheet_columns (sheet_id, position);
CREATE UNIQUE INDEX sheet_columns_one_primary_per_sheet_idx
  ON public.sheet_columns (sheet_id)
  WHERE is_primary = true;

CREATE TRIGGER sheet_columns_set_updated_at
  BEFORE UPDATE ON public.sheet_columns
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- rows (generalizes prospects; cell values in rows.data JSONB)
-- ---------------------------------------------------------------------------

CREATE TABLE public.rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES public.sheets (id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  position INTEGER NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_vector tsvector GENERATED ALWAYS AS (
    jsonb_to_tsvector('english', data, '["string"]')
  ) STORED
);

CREATE INDEX rows_sheet_id_position_idx ON public.rows (sheet_id, position);
CREATE INDEX rows_data_gin_idx ON public.rows USING gin (data jsonb_path_ops);
CREATE INDEX rows_search_vector_idx ON public.rows USING gin (search_vector);

CREATE TRIGGER rows_set_updated_at
  BEFORE UPDATE ON public.rows
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
