-- S0-1 Migration 23: sheet RLS helpers and policies (Expand phase)
-- Authoritative spec: S0-1_SHEET_ENGINE_DESIGN.md §2.7, §8

-- ---------------------------------------------------------------------------
-- Helper functions (mirror property/prospect helpers)
-- ---------------------------------------------------------------------------

-- During Expand (before sheet_assignments in migration 25), editor access uses
-- property_assignments with property_id = sheet_id (ID preservation). Migration
-- 26 updates this to sheet_assignments once backfilled.
CREATE OR REPLACE FUNCTION public.can_access_sheet(check_sheet_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.sheets s
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE s.id = check_sheet_id
      AND s.org_id = p.org_id
      AND p.status = 'active'
      AND (
        public.role_level(p.role) >= public.role_level('admin'::public.user_role)
        OR EXISTS (
          SELECT 1
          FROM public.property_assignments pa
          WHERE pa.property_id = s.id
            AND pa.user_id = p.id
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.sheet_id_for_row(check_row_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sheet_id
  FROM public.rows
  WHERE id = check_row_id;
$$;

-- Before contacts.row_id exists (migration 25), resolve via prospects.
-- property_id equals sheet_id under ID preservation.
CREATE OR REPLACE FUNCTION public.sheet_id_for_contact(check_contact_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ps.property_id
  FROM public.contacts c
  JOIN public.prospects ps ON ps.id = c.prospect_id
  WHERE c.id = check_contact_id;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheet_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rows ENABLE ROW LEVEL SECURITY;

-- sheets (mirrors properties)
CREATE POLICY sheets_select ON public.sheets
  FOR SELECT TO authenticated
  USING (public.can_access_sheet(id));

CREATE POLICY sheets_insert ON public.sheets
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('admin')
    AND org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY sheets_update ON public.sheets
  FOR UPDATE TO authenticated
  USING (
    public.has_role('admin')
    OR (
      public.has_role('editor')
      AND public.can_access_sheet(id)
    )
  )
  WITH CHECK (
    public.has_role('admin')
    OR (
      public.has_role('editor')
      AND public.can_access_sheet(id)
    )
  );

-- sheet_columns (schema edits for assigned editors)
CREATE POLICY sheet_columns_select ON public.sheet_columns
  FOR SELECT TO authenticated
  USING (public.can_access_sheet(sheet_id));

CREATE POLICY sheet_columns_insert ON public.sheet_columns
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    AND (
      public.has_role('admin')
      OR (
        public.has_role('editor')
        AND public.can_access_sheet(sheet_id)
      )
    )
  );

CREATE POLICY sheet_columns_update ON public.sheet_columns
  FOR UPDATE TO authenticated
  USING (
    public.has_role('admin')
    OR (
      public.has_role('editor')
      AND public.can_access_sheet(sheet_id)
    )
  )
  WITH CHECK (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    AND (
      public.has_role('admin')
      OR (
        public.has_role('editor')
        AND public.can_access_sheet(sheet_id)
      )
    )
  );

CREATE POLICY sheet_columns_delete ON public.sheet_columns
  FOR DELETE TO authenticated
  USING (
    public.has_role('admin')
    OR (
      public.has_role('editor')
      AND public.can_access_sheet(sheet_id)
    )
  );

-- rows (mirrors prospects; no DELETE — row delete not enabled in MVP)
CREATE POLICY rows_select ON public.rows
  FOR SELECT TO authenticated
  USING (public.can_access_sheet(sheet_id));

CREATE POLICY rows_insert ON public.rows
  FOR INSERT TO authenticated
  WITH CHECK (public.can_access_sheet(sheet_id));

CREATE POLICY rows_update ON public.rows
  FOR UPDATE TO authenticated
  USING (public.can_access_sheet(sheet_id))
  WITH CHECK (public.can_access_sheet(sheet_id));
