-- P4-2: saved sheet views + row/column visibility

ALTER TABLE public.sheet_columns
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.rows
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE public.sheet_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES public.sheets (id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  sort JSONB,
  filters JSONB NOT NULL DEFAULT '[]'::jsonb,
  hidden_column_keys TEXT[] NOT NULL DEFAULT '{}',
  hidden_row_ids UUID[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sheet_views_sheet_id_name_unique UNIQUE (sheet_id, name)
);

CREATE INDEX sheet_views_sheet_id_idx ON public.sheet_views (sheet_id);

CREATE TRIGGER sheet_views_set_updated_at
  BEFORE UPDATE ON public.sheet_views
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.validate_sheet_view_org_match()
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
    RAISE EXCEPTION 'sheet_views.org_id must match the sheet org_id';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER sheet_views_validate_sheet_org
  BEFORE INSERT OR UPDATE ON public.sheet_views
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_sheet_view_org_match();

ALTER TABLE public.sheet_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY sheet_views_select ON public.sheet_views
  FOR SELECT TO authenticated
  USING (public.can_access_sheet(sheet_id));

CREATE POLICY sheet_views_insert ON public.sheet_views
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.has_sheet_access(sheet_id, 'editor')
  );

CREATE POLICY sheet_views_update ON public.sheet_views
  FOR UPDATE TO authenticated
  USING (public.has_sheet_access(sheet_id, 'editor'))
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.has_sheet_access(sheet_id, 'editor')
  );

CREATE POLICY sheet_views_delete ON public.sheet_views
  FOR DELETE TO authenticated
  USING (public.has_sheet_access(sheet_id, 'editor'));
