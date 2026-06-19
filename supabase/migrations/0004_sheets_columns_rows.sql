-- G1 Phase: sheets, sheet_columns, rows

CREATE TABLE public.sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  workspace_id UUID NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.folders (id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status public.sheet_status NOT NULL DEFAULT 'active',
  template_id UUID,
  template_version INTEGER,
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, ''))
  ) STORED
);

CREATE INDEX sheets_workspace_folder_position_idx
  ON public.sheets (workspace_id, folder_id, position);
CREATE INDEX sheets_org_id_status_idx ON public.sheets (org_id, status);
CREATE INDEX sheets_search_vector_idx ON public.sheets USING gin (search_vector);
CREATE INDEX sheets_folder_id_idx ON public.sheets (folder_id);

CREATE TRIGGER sheets_set_updated_at
  BEFORE UPDATE ON public.sheets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

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

CREATE OR REPLACE FUNCTION public.validate_sheet_folder_workspace()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  folder_workspace_id UUID;
BEGIN
  IF NEW.folder_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT f.workspace_id
  INTO folder_workspace_id
  FROM public.folders f
  WHERE f.id = NEW.folder_id;

  IF folder_workspace_id IS NULL THEN
    RAISE EXCEPTION 'folder_id must reference an existing folder';
  END IF;

  IF folder_workspace_id IS DISTINCT FROM NEW.workspace_id THEN
    RAISE EXCEPTION 'sheet folder_id must belong to sheet workspace_id';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_row_sheet_org_match()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  sheet_org_id UUID;
BEGIN
  SELECT s.org_id
  INTO sheet_org_id
  FROM public.sheets s
  WHERE s.id = NEW.sheet_id;

  IF sheet_org_id IS NULL THEN
    RAISE EXCEPTION 'sheet_id must reference an existing sheet';
  END IF;

  IF NEW.org_id IS DISTINCT FROM sheet_org_id THEN
    RAISE EXCEPTION 'rows.org_id must match the sheet org_id';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_sheet_column_org_match()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  sheet_org_id UUID;
BEGIN
  SELECT s.org_id
  INTO sheet_org_id
  FROM public.sheets s
  WHERE s.id = NEW.sheet_id;

  IF sheet_org_id IS NULL THEN
    RAISE EXCEPTION 'sheet_id must reference an existing sheet';
  END IF;

  IF NEW.org_id IS DISTINCT FROM sheet_org_id THEN
    RAISE EXCEPTION 'sheet_columns.org_id must match the sheet org_id';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER sheets_validate_folder_workspace
  BEFORE INSERT OR UPDATE ON public.sheets
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_sheet_folder_workspace();

CREATE TRIGGER rows_validate_sheet_org
  BEFORE INSERT OR UPDATE ON public.rows
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_row_sheet_org_match();

CREATE TRIGGER sheet_columns_validate_sheet_org
  BEFORE INSERT OR UPDATE ON public.sheet_columns
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_sheet_column_org_match();

ALTER TABLE public.sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheet_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rows ENABLE ROW LEVEL SECURITY;
