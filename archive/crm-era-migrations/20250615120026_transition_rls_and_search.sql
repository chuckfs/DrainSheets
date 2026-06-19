-- S0-1 Migration 26: transition RLS + storage + search_global (Expand phase)
-- Authoritative spec: S0-1_SHEET_ENGINE_DESIGN.md §2.7, §2.8, §8
-- Dual-path access: can_access_property(legacy) OR can_access_sheet(sheet model)

-- ---------------------------------------------------------------------------
-- 1. Update sheet helpers for sheet_assignments + contacts.row_id
-- ---------------------------------------------------------------------------

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
          FROM public.sheet_assignments sa
          WHERE sa.sheet_id = s.id
            AND sa.user_id = p.id
        )
        OR EXISTS (
          SELECT 1
          FROM public.property_assignments pa
          WHERE pa.property_id = s.id
            AND pa.user_id = p.id
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.sheet_id_for_contact(check_contact_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT r.sheet_id
      FROM public.contacts c
      JOIN public.rows r ON r.id = c.row_id
      WHERE c.id = check_contact_id
    ),
    (
      SELECT ps.property_id
      FROM public.contacts c
      JOIN public.prospects ps ON ps.id = c.prospect_id
      WHERE c.id = check_contact_id
    )
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. sheet_assignments RLS (mirrors property_assignments)
-- ---------------------------------------------------------------------------

ALTER TABLE public.sheet_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sheet_assignments_select ON public.sheet_assignments;
DROP POLICY IF EXISTS sheet_assignments_insert ON public.sheet_assignments;
DROP POLICY IF EXISTS sheet_assignments_delete ON public.sheet_assignments;

CREATE POLICY sheet_assignments_select ON public.sheet_assignments
  FOR SELECT TO authenticated
  USING (public.has_role('admin'));

CREATE POLICY sheet_assignments_insert ON public.sheet_assignments
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role('owner'));

CREATE POLICY sheet_assignments_delete ON public.sheet_assignments
  FOR DELETE TO authenticated
  USING (public.has_role('owner'));

-- ---------------------------------------------------------------------------
-- 3. Transition RLS on dependent tables
--    Pattern: can_access_property(property_id) OR can_access_sheet(sheet_id)
-- ---------------------------------------------------------------------------

-- documents
DROP POLICY IF EXISTS documents_select ON public.documents;
DROP POLICY IF EXISTS documents_insert ON public.documents;
DROP POLICY IF EXISTS documents_delete ON public.documents;

CREATE POLICY documents_select ON public.documents
  FOR SELECT TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND (
      public.can_access_property(property_id)
      OR public.can_access_sheet(sheet_id)
    )
  );

CREATE POLICY documents_insert ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND (
      public.can_access_property(property_id)
      OR public.can_access_sheet(sheet_id)
    )
    AND uploaded_by = auth.uid()
  );

CREATE POLICY documents_delete ON public.documents
  FOR DELETE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND (
      public.can_access_property(property_id)
      OR public.can_access_sheet(sheet_id)
    )
    AND (
      public.has_role('admin'::public.user_role)
      OR uploaded_by = auth.uid()
    )
  );

-- notes
DROP POLICY IF EXISTS notes_select ON public.notes;
DROP POLICY IF EXISTS notes_insert ON public.notes;
DROP POLICY IF EXISTS notes_update ON public.notes;
DROP POLICY IF EXISTS notes_delete ON public.notes;

CREATE POLICY notes_select ON public.notes
  FOR SELECT TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND (
      public.can_access_property(property_id)
      OR public.can_access_sheet(sheet_id)
    )
  );

CREATE POLICY notes_insert ON public.notes
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND (
      public.can_access_property(property_id)
      OR public.can_access_sheet(sheet_id)
    )
    AND user_id = auth.uid()
  );

CREATE POLICY notes_update ON public.notes
  FOR UPDATE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND (
      public.can_access_property(property_id)
      OR public.can_access_sheet(sheet_id)
    )
    AND (
      public.has_role('admin'::public.user_role)
      OR user_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND (
      public.can_access_property(property_id)
      OR public.can_access_sheet(sheet_id)
    )
    AND (
      public.has_role('admin'::public.user_role)
      OR user_id = auth.uid()
    )
  );

CREATE POLICY notes_delete ON public.notes
  FOR DELETE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND (
      public.can_access_property(property_id)
      OR public.can_access_sheet(sheet_id)
    )
    AND (
      public.has_role('admin'::public.user_role)
      OR user_id = auth.uid()
    )
  );

-- activity
DROP POLICY IF EXISTS activity_select ON public.activity;

CREATE POLICY activity_select ON public.activity
  FOR SELECT TO authenticated
  USING (
    public.is_org_member(org_id)
    AND (
      (property_id IS NULL AND sheet_id IS NULL)
      OR public.can_access_property(property_id)
      OR public.can_access_sheet(sheet_id)
      OR public.has_role('admin')
    )
  );

-- favorites
DROP POLICY IF EXISTS favorites_select ON public.favorites;
DROP POLICY IF EXISTS favorites_insert ON public.favorites;
DROP POLICY IF EXISTS favorites_delete ON public.favorites;

CREATE POLICY favorites_select ON public.favorites
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    AND (
      public.can_access_property(property_id)
      OR public.can_access_sheet(sheet_id)
    )
  );

CREATE POLICY favorites_insert ON public.favorites
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      public.can_access_property(property_id)
      OR public.can_access_sheet(sheet_id)
    )
  );

CREATE POLICY favorites_delete ON public.favorites
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- recent_views
DROP POLICY IF EXISTS recent_views_select ON public.recent_views;
DROP POLICY IF EXISTS recent_views_insert ON public.recent_views;
DROP POLICY IF EXISTS recent_views_update ON public.recent_views;
DROP POLICY IF EXISTS recent_views_delete ON public.recent_views;

CREATE POLICY recent_views_select ON public.recent_views
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    AND (
      public.can_access_property(property_id)
      OR public.can_access_sheet(sheet_id)
    )
  );

CREATE POLICY recent_views_insert ON public.recent_views
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      public.can_access_property(property_id)
      OR public.can_access_sheet(sheet_id)
    )
  );

CREATE POLICY recent_views_update ON public.recent_views
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      public.can_access_property(property_id)
      OR public.can_access_sheet(sheet_id)
    )
  );

CREATE POLICY recent_views_delete ON public.recent_views
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- email_logs
DROP POLICY IF EXISTS email_logs_select ON public.email_logs;
DROP POLICY IF EXISTS email_logs_insert ON public.email_logs;

CREATE POLICY email_logs_select ON public.email_logs
  FOR SELECT TO authenticated
  USING (
    public.is_org_member(org_id)
    AND (
      (property_id IS NULL AND sheet_id IS NULL)
      OR public.can_access_property(property_id)
      OR public.can_access_sheet(sheet_id)
    )
  );

CREATE POLICY email_logs_insert ON public.email_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(org_id)
    AND sent_by = auth.uid()
    AND (
      (property_id IS NULL AND sheet_id IS NULL)
      OR public.can_access_property(property_id)
      OR public.can_access_sheet(sheet_id)
    )
  );

-- contacts
DROP POLICY IF EXISTS contacts_select ON public.contacts;
DROP POLICY IF EXISTS contacts_insert ON public.contacts;
DROP POLICY IF EXISTS contacts_update ON public.contacts;
DROP POLICY IF EXISTS contacts_delete ON public.contacts;

CREATE POLICY contacts_select ON public.contacts
  FOR SELECT TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND (
      EXISTS (
        SELECT 1
        FROM public.prospects p
        WHERE p.id = contacts.prospect_id
          AND public.can_access_property(p.property_id)
      )
      OR public.can_access_sheet(public.sheet_id_for_contact(contacts.id))
    )
  );

CREATE POLICY contacts_insert ON public.contacts
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND (
      public.can_access_property(
        (SELECT p.property_id FROM public.prospects p WHERE p.id = prospect_id)
      )
      OR public.can_access_sheet(
        (SELECT r.sheet_id FROM public.rows r WHERE r.id = row_id)
      )
    )
  );

CREATE POLICY contacts_update ON public.contacts
  FOR UPDATE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND (
      EXISTS (
        SELECT 1
        FROM public.prospects p
        WHERE p.id = contacts.prospect_id
          AND public.can_access_property(p.property_id)
      )
      OR public.can_access_sheet(public.sheet_id_for_contact(contacts.id))
    )
  )
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND (
      public.can_access_property(
        (SELECT p.property_id FROM public.prospects p WHERE p.id = prospect_id)
      )
      OR public.can_access_sheet(
        (SELECT r.sheet_id FROM public.rows r WHERE r.id = row_id)
      )
    )
  );

CREATE POLICY contacts_delete ON public.contacts
  FOR DELETE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND (
      EXISTS (
        SELECT 1
        FROM public.prospects p
        WHERE p.id = contacts.prospect_id
          AND public.can_access_property(p.property_id)
      )
      OR public.can_access_sheet(public.sheet_id_for_contact(contacts.id))
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Storage policy transition (path unchanged: {org_id}/{property_id}/…)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS documents_storage_select ON storage.objects;
DROP POLICY IF EXISTS documents_storage_insert ON storage.objects;
DROP POLICY IF EXISTS documents_storage_delete ON storage.objects;

CREATE POLICY documents_storage_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (
      public.can_access_property(public.documents_storage_path_property_id(name))
      OR public.can_access_sheet(public.documents_storage_path_property_id(name))
    )
    AND public.is_org_member(public.documents_storage_path_org_id(name))
  );

CREATE POLICY documents_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (
      public.can_access_property(public.documents_storage_path_property_id(name))
      OR public.can_access_sheet(public.documents_storage_path_property_id(name))
    )
    AND public.is_org_member(public.documents_storage_path_org_id(name))
  );

CREATE POLICY documents_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (
      public.can_access_property(public.documents_storage_path_property_id(name))
      OR public.can_access_sheet(public.documents_storage_path_property_id(name))
    )
    AND public.is_org_member(public.documents_storage_path_org_id(name))
  );

-- ---------------------------------------------------------------------------
-- 5. search_global rewrite (sheet-era entities)
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.search_global(TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.search_global(
  search_query TEXT,
  result_limit INTEGER DEFAULT 20,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  title TEXT,
  sheet_id UUID,
  rank REAL
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ts_query tsquery;
  profile_org_id UUID;
BEGIN
  SELECT org_id INTO profile_org_id
  FROM public.profiles
  WHERE id = auth.uid() AND status = 'active';

  IF profile_org_id IS NULL THEN
    RETURN;
  END IF;

  ts_query := websearch_to_tsquery('english', search_query);

  RETURN QUERY
  SELECT * FROM (
    SELECT
      'sheet'::TEXT,
      s.id,
      s.name,
      s.id,
      ts_rank(s.search_vector, ts_query)::REAL
    FROM public.sheets s
    WHERE s.org_id = profile_org_id
      AND public.can_access_sheet(s.id)
      AND s.search_vector @@ ts_query

    UNION ALL

    SELECT
      'row'::TEXT,
      r.id,
      coalesce(nullif(trim(r.data->>sc.key), ''), 'Untitled row'),
      r.sheet_id,
      ts_rank(r.search_vector, ts_query)::REAL
    FROM public.rows r
    LEFT JOIN public.sheet_columns sc
      ON sc.sheet_id = r.sheet_id
      AND sc.is_primary = true
    WHERE public.can_access_sheet(r.sheet_id)
      AND r.search_vector @@ ts_query

    UNION ALL

    SELECT
      'contact'::TEXT,
      c.id,
      trim(coalesce(c.first_name, '') || ' ' || coalesce(c.last_name, '')),
      public.sheet_id_for_contact(c.id),
      ts_rank(c.search_vector, ts_query)::REAL
    FROM public.contacts c
    WHERE c.org_id = profile_org_id
      AND (
        EXISTS (
          SELECT 1
          FROM public.prospects p
          WHERE p.id = c.prospect_id
            AND public.can_access_property(p.property_id)
        )
        OR public.can_access_sheet(public.sheet_id_for_contact(c.id))
      )
      AND c.search_vector @@ ts_query

    UNION ALL

    SELECT
      'document'::TEXT,
      d.id,
      d.file_name,
      d.sheet_id,
      ts_rank(d.search_vector, ts_query)::REAL
    FROM public.documents d
    WHERE d.org_id = profile_org_id
      AND (
        public.can_access_property(d.property_id)
        OR public.can_access_sheet(d.sheet_id)
      )
      AND d.search_vector @@ ts_query
  ) results
  ORDER BY rank DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_global(TEXT, INTEGER, INTEGER) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. Post-migration validation
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'can_access_sheet'
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 26: can_access_sheet function missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'search_global'
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 26: search_global function missing';
  END IF;

  SELECT count(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'documents'
    AND policyname = 'documents_select';

  IF policy_count <> 1 THEN
    RAISE EXCEPTION 'S0-1 migration 26: documents_select policy missing';
  END IF;

  SELECT count(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'notes'
    AND policyname = 'notes_select';

  IF policy_count <> 1 THEN
    RAISE EXCEPTION 'S0-1 migration 26: notes_select policy missing';
  END IF;

  SELECT count(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'activity'
    AND policyname = 'activity_select';

  IF policy_count <> 1 THEN
    RAISE EXCEPTION 'S0-1 migration 26: activity_select policy missing';
  END IF;

  SELECT count(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'favorites'
    AND policyname = 'favorites_select';

  IF policy_count <> 1 THEN
    RAISE EXCEPTION 'S0-1 migration 26: favorites_select policy missing';
  END IF;

  SELECT count(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'recent_views'
    AND policyname = 'recent_views_select';

  IF policy_count <> 1 THEN
    RAISE EXCEPTION 'S0-1 migration 26: recent_views_select policy missing';
  END IF;

  SELECT count(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'email_logs'
    AND policyname = 'email_logs_select';

  IF policy_count <> 1 THEN
    RAISE EXCEPTION 'S0-1 migration 26: email_logs_select policy missing';
  END IF;

  SELECT count(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'contacts'
    AND policyname = 'contacts_select';

  IF policy_count <> 1 THEN
    RAISE EXCEPTION 'S0-1 migration 26: contacts_select policy missing';
  END IF;

  SELECT count(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'documents_storage_select';

  IF policy_count <> 1 THEN
    RAISE EXCEPTION 'S0-1 migration 26: documents_storage_select policy missing';
  END IF;

  SELECT count(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'sheet_assignments'
    AND policyname = 'sheet_assignments_select';

  IF policy_count <> 1 THEN
    RAISE EXCEPTION 'S0-1 migration 26: sheet_assignments_select policy missing';
  END IF;

  -- Verify search_global return signature includes sheet_id
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_type t ON t.oid = p.prorettype
    WHERE n.nspname = 'public'
      AND p.proname = 'search_global'
      AND pg_get_function_result(p.oid) LIKE '%sheet_id%'
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 26: search_global missing sheet_id column';
  END IF;

  RAISE NOTICE 'S0-1 migration 26 transition RLS and search OK';
END $$;
