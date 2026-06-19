-- G1 Phase: access helpers, RLS policies, search, storage, grants

-- ---------------------------------------------------------------------------
-- Access resolution helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_org_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = check_user_id
      AND p.status = 'active'
      AND public.org_role_level(p.role) >= public.org_role_level('admin'::public.org_role)
  );
$$;

CREATE OR REPLACE FUNCTION public.folder_ancestor_ids(start_folder_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE chain AS (
    SELECT f.id, f.parent_folder_id, 1 AS depth
    FROM public.folders f
    WHERE f.id = start_folder_id

    UNION ALL

    SELECT f.id, f.parent_folder_id, c.depth + 1
    FROM public.folders f
    JOIN chain c ON f.id = c.parent_folder_id
    WHERE c.depth < 8
  )
  SELECT id FROM chain;
$$;

CREATE OR REPLACE FUNCTION public.max_access_role(roles public.access_role[])
RETURNS public.access_role
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT role
  FROM unnest(roles) AS role
  ORDER BY public.access_role_level(role) DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.effective_role_for_workspace(
  check_workspace_id UUID,
  check_user_id UUID DEFAULT auth.uid()
)
RETURNS public.access_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.is_org_admin(check_user_id) THEN 'admin'::public.access_role
    ELSE (
      SELECT sh.role
      FROM public.shares sh
      WHERE sh.grantee_id = check_user_id
        AND sh.resource_type = 'workspace'
        AND sh.resource_id = check_workspace_id
      ORDER BY public.access_role_level(sh.role) DESC
      LIMIT 1
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.effective_role_for_folder(
  check_folder_id UUID,
  check_user_id UUID DEFAULT auth.uid()
)
RETURNS public.access_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.is_org_admin(check_user_id) THEN 'admin'::public.access_role
    ELSE public.max_access_role(
      ARRAY(
        SELECT sh.role
        FROM public.shares sh
        JOIN public.folders f ON f.id = check_folder_id
        WHERE sh.grantee_id = check_user_id
          AND (
            (sh.resource_type = 'folder' AND sh.resource_id IN (
              SELECT public.folder_ancestor_ids(check_folder_id)
            ))
            OR (sh.resource_type = 'workspace' AND sh.resource_id = f.workspace_id)
          )
      )
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.effective_role_for_sheet(
  check_sheet_id UUID,
  check_user_id UUID DEFAULT auth.uid()
)
RETURNS public.access_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.is_org_admin(check_user_id) THEN 'admin'::public.access_role
    ELSE public.max_access_role(
      ARRAY(
        SELECT sh.role
        FROM public.shares sh
        JOIN public.sheets s ON s.id = check_sheet_id
        WHERE sh.grantee_id = check_user_id
          AND (
            (sh.resource_type = 'sheet' AND sh.resource_id = check_sheet_id)
            OR (sh.resource_type = 'workspace' AND sh.resource_id = s.workspace_id)
            OR (
              sh.resource_type = 'folder'
              AND s.folder_id IS NOT NULL
              AND sh.resource_id IN (SELECT public.folder_ancestor_ids(s.folder_id))
            )
          )
      )
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.has_access_role(
  effective public.access_role,
  min_role public.access_role
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT effective IS NOT NULL
    AND public.access_role_level(effective) >= public.access_role_level(min_role);
$$;

CREATE OR REPLACE FUNCTION public.has_sheet_access(
  check_sheet_id UUID,
  min_role public.access_role,
  check_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_access_role(
    public.effective_role_for_sheet(check_sheet_id, check_user_id),
    min_role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_folder_access(
  check_folder_id UUID,
  min_role public.access_role,
  check_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_access_role(
    public.effective_role_for_folder(check_folder_id, check_user_id),
    min_role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_workspace_access(
  check_workspace_id UUID,
  min_role public.access_role,
  check_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_access_role(
    public.effective_role_for_workspace(check_workspace_id, check_user_id),
    min_role
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_sheet(check_sheet_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_sheet_access(check_sheet_id, 'viewer'::public.access_role);
$$;

CREATE OR REPLACE FUNCTION public.can_access_folder(check_folder_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_folder_access(check_folder_id, 'viewer'::public.access_role);
$$;

CREATE OR REPLACE FUNCTION public.can_access_workspace(check_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_workspace_access(check_workspace_id, 'viewer'::public.access_role);
$$;

CREATE OR REPLACE FUNCTION public.sheet_id_for_row(check_row_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sheet_id FROM public.rows WHERE id = check_row_id;
$$;

CREATE OR REPLACE FUNCTION public.can_access_favorite_target(
  target_type public.favorite_target_type,
  target_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE target_type
    WHEN 'workspace' THEN public.can_access_workspace(target_id)
    WHEN 'folder' THEN public.can_access_folder(target_id)
    WHEN 'sheet' THEN public.can_access_sheet(target_id)
  END;
$$;

-- ---------------------------------------------------------------------------
-- workspaces RLS
-- ---------------------------------------------------------------------------

CREATE POLICY workspaces_select ON public.workspaces
  FOR SELECT TO authenticated
  USING (public.can_access_workspace(id));

CREATE POLICY workspaces_insert ON public.workspaces
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_org_role('admin')
    AND org_id = public.current_user_org_id()
  );

CREATE POLICY workspaces_update ON public.workspaces
  FOR UPDATE TO authenticated
  USING (public.has_workspace_access(id, 'admin'))
  WITH CHECK (public.has_workspace_access(id, 'admin'));

CREATE POLICY workspaces_delete ON public.workspaces
  FOR DELETE TO authenticated
  USING (public.has_workspace_access(id, 'admin'));

-- ---------------------------------------------------------------------------
-- folders RLS
-- ---------------------------------------------------------------------------

CREATE POLICY folders_select ON public.folders
  FOR SELECT TO authenticated
  USING (public.can_access_folder(id));

CREATE POLICY folders_insert ON public.folders
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.has_workspace_access(workspace_id, 'editor')
  );

CREATE POLICY folders_update ON public.folders
  FOR UPDATE TO authenticated
  USING (public.has_folder_access(id, 'admin'))
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.has_folder_access(id, 'admin')
  );

CREATE POLICY folders_delete ON public.folders
  FOR DELETE TO authenticated
  USING (public.has_folder_access(id, 'admin'));

-- ---------------------------------------------------------------------------
-- sheets RLS
-- ---------------------------------------------------------------------------

CREATE POLICY sheets_select ON public.sheets
  FOR SELECT TO authenticated
  USING (public.can_access_sheet(id));

CREATE POLICY sheets_insert ON public.sheets
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND (
      (folder_id IS NULL AND public.has_workspace_access(workspace_id, 'editor'))
      OR (folder_id IS NOT NULL AND public.has_folder_access(folder_id, 'editor'))
    )
  );

CREATE POLICY sheets_update ON public.sheets
  FOR UPDATE TO authenticated
  USING (public.has_sheet_access(id, 'editor'))
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.has_sheet_access(id, 'editor')
    AND (
      status <> 'archived'::public.sheet_status
      OR public.has_sheet_access(id, 'admin')
    )
  );

CREATE POLICY sheets_delete ON public.sheets
  FOR DELETE TO authenticated
  USING (public.has_sheet_access(id, 'admin'));

-- ---------------------------------------------------------------------------
-- sheet_columns RLS
-- ---------------------------------------------------------------------------

CREATE POLICY sheet_columns_select ON public.sheet_columns
  FOR SELECT TO authenticated
  USING (public.can_access_sheet(sheet_id));

CREATE POLICY sheet_columns_insert ON public.sheet_columns
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.has_sheet_access(sheet_id, 'editor')
  );

CREATE POLICY sheet_columns_update ON public.sheet_columns
  FOR UPDATE TO authenticated
  USING (public.has_sheet_access(sheet_id, 'editor'))
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.has_sheet_access(sheet_id, 'editor')
  );

CREATE POLICY sheet_columns_delete ON public.sheet_columns
  FOR DELETE TO authenticated
  USING (public.has_sheet_access(sheet_id, 'editor'));

-- ---------------------------------------------------------------------------
-- rows RLS
-- ---------------------------------------------------------------------------

CREATE POLICY rows_select ON public.rows
  FOR SELECT TO authenticated
  USING (public.can_access_sheet(sheet_id));

CREATE POLICY rows_insert ON public.rows
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.has_sheet_access(sheet_id, 'editor')
  );

CREATE POLICY rows_update ON public.rows
  FOR UPDATE TO authenticated
  USING (public.has_sheet_access(sheet_id, 'editor'))
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.has_sheet_access(sheet_id, 'editor')
  );

CREATE POLICY rows_delete ON public.rows
  FOR DELETE TO authenticated
  USING (public.has_sheet_access(sheet_id, 'admin'));

-- ---------------------------------------------------------------------------
-- contacts RLS
-- ---------------------------------------------------------------------------

CREATE POLICY contacts_select ON public.contacts
  FOR SELECT TO authenticated
  USING (org_id = public.current_user_org_id());

CREATE POLICY contacts_insert ON public.contacts
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.has_org_role('editor')
  );

CREATE POLICY contacts_update ON public.contacts
  FOR UPDATE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND public.has_org_role('editor')
  )
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.has_org_role('editor')
  );

CREATE POLICY contacts_delete ON public.contacts
  FOR DELETE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND public.has_org_role('admin')
  );

-- ---------------------------------------------------------------------------
-- documents RLS
-- ---------------------------------------------------------------------------

CREATE POLICY documents_select ON public.documents
  FOR SELECT TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND public.can_access_sheet(sheet_id)
  );

CREATE POLICY documents_insert ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.has_sheet_access(sheet_id, 'editor')
    AND uploaded_by = auth.uid()
  );

CREATE POLICY documents_delete ON public.documents
  FOR DELETE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND public.can_access_sheet(sheet_id)
    AND (
      public.has_sheet_access(sheet_id, 'admin')
      OR uploaded_by = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- notes RLS
-- ---------------------------------------------------------------------------

CREATE POLICY notes_select ON public.notes
  FOR SELECT TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND public.can_access_sheet(sheet_id)
  );

CREATE POLICY notes_insert ON public.notes
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.has_sheet_access(sheet_id, 'commenter')
    AND user_id = auth.uid()
  );

CREATE POLICY notes_update ON public.notes
  FOR UPDATE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND public.can_access_sheet(sheet_id)
    AND (
      public.has_sheet_access(sheet_id, 'admin')
      OR user_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.can_access_sheet(sheet_id)
    AND (
      public.has_sheet_access(sheet_id, 'admin')
      OR user_id = auth.uid()
    )
  );

CREATE POLICY notes_delete ON public.notes
  FOR DELETE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND public.can_access_sheet(sheet_id)
    AND (
      public.has_sheet_access(sheet_id, 'admin')
      OR user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- activity RLS (insert via log_activity SECURITY DEFINER only)
-- ---------------------------------------------------------------------------

CREATE POLICY activity_select ON public.activity
  FOR SELECT TO authenticated
  USING (
    public.is_org_member(org_id)
    AND (
      sheet_id IS NULL
      OR public.can_access_sheet(sheet_id)
      OR public.is_org_admin()
    )
  );

-- ---------------------------------------------------------------------------
-- favorites RLS
-- ---------------------------------------------------------------------------

CREATE POLICY favorites_select ON public.favorites
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    AND public.can_access_favorite_target(target_type, target_id)
  );

CREATE POLICY favorites_insert ON public.favorites
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND org_id = public.current_user_org_id()
    AND public.can_access_favorite_target(target_type, target_id)
  );

CREATE POLICY favorites_delete ON public.favorites
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- recent_views RLS
-- ---------------------------------------------------------------------------

CREATE POLICY recent_views_select ON public.recent_views
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    AND public.can_access_sheet(sheet_id)
  );

CREATE POLICY recent_views_insert ON public.recent_views
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND org_id = public.current_user_org_id()
    AND public.can_access_sheet(sheet_id)
  );

CREATE POLICY recent_views_update ON public.recent_views
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND org_id = public.current_user_org_id()
    AND public.can_access_sheet(sheet_id)
  );

CREATE POLICY recent_views_delete ON public.recent_views
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- email_logs RLS
-- ---------------------------------------------------------------------------

CREATE POLICY email_logs_select ON public.email_logs
  FOR SELECT TO authenticated
  USING (
    public.is_org_member(org_id)
    AND (
      sheet_id IS NULL
      OR public.can_access_sheet(sheet_id)
    )
  );

CREATE POLICY email_logs_insert ON public.email_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(org_id)
    AND sent_by = auth.uid()
    AND (
      sheet_id IS NULL
      OR public.can_access_sheet(sheet_id)
    )
  );

-- ---------------------------------------------------------------------------
-- shares RLS
-- ---------------------------------------------------------------------------

CREATE POLICY shares_select ON public.shares
  FOR SELECT TO authenticated
  USING (
    grantee_id = auth.uid()
    OR (public.has_org_role('admin') AND org_id = public.current_user_org_id())
  );

CREATE POLICY shares_insert ON public.shares
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND (
      (resource_type = 'workspace' AND public.has_workspace_access(resource_id, 'admin'))
      OR (resource_type = 'folder' AND public.has_folder_access(resource_id, 'admin'))
      OR (resource_type = 'sheet' AND public.has_sheet_access(resource_id, 'admin'))
    )
  );

CREATE POLICY shares_delete ON public.shares
  FOR DELETE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND (
      (resource_type = 'workspace' AND public.has_workspace_access(resource_id, 'admin'))
      OR (resource_type = 'folder' AND public.has_folder_access(resource_id, 'admin'))
      OR (resource_type = 'sheet' AND public.has_sheet_access(resource_id, 'admin'))
    )
  );

-- ---------------------------------------------------------------------------
-- sheet_templates RLS
-- ---------------------------------------------------------------------------

CREATE POLICY sheet_templates_select ON public.sheet_templates
  FOR SELECT TO authenticated
  USING (
    scope = 'system'
    OR (scope = 'org' AND org_id = public.current_user_org_id())
    OR (scope = 'user' AND created_by = auth.uid())
  );

CREATE POLICY sheet_templates_insert ON public.sheet_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    scope <> 'system'
    AND org_id = public.current_user_org_id()
    AND (
      (scope = 'org' AND public.has_org_role('admin'))
      OR (scope = 'user' AND created_by = auth.uid())
    )
  );

CREATE POLICY sheet_templates_update ON public.sheet_templates
  FOR UPDATE TO authenticated
  USING (
    scope <> 'system'
    AND org_id = public.current_user_org_id()
    AND (
      (scope = 'org' AND public.has_org_role('admin'))
      OR (scope = 'user' AND created_by = auth.uid())
    )
  )
  WITH CHECK (
    scope <> 'system'
    AND org_id = public.current_user_org_id()
  );

CREATE POLICY sheet_templates_delete ON public.sheet_templates
  FOR DELETE TO authenticated
  USING (
    scope <> 'system'
    AND org_id = public.current_user_org_id()
    AND (
      (scope = 'org' AND public.has_org_role('admin'))
      OR (scope = 'user' AND created_by = auth.uid())
    )
  );

CREATE POLICY sheet_template_versions_select ON public.sheet_template_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.sheet_templates t
      WHERE t.id = template_id
        AND (
          t.scope = 'system'
          OR (t.scope = 'org' AND t.org_id = public.current_user_org_id())
          OR (t.scope = 'user' AND t.created_by = auth.uid())
        )
    )
  );

CREATE POLICY sheet_template_versions_insert ON public.sheet_template_versions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.sheet_templates t
      WHERE t.id = template_id
        AND t.scope <> 'system'
        AND t.org_id = public.current_user_org_id()
        AND (
          (t.scope = 'org' AND public.has_org_role('admin'))
          OR (t.scope = 'user' AND t.created_by = auth.uid())
        )
    )
  );

-- ---------------------------------------------------------------------------
-- search_global
-- ---------------------------------------------------------------------------

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
  workspace_id UUID,
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
  SELECT p.org_id INTO profile_org_id
  FROM public.profiles p
  WHERE p.id = auth.uid() AND p.status = 'active';

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
      s.workspace_id,
      ts_rank(s.search_vector, ts_query) * 1.2
    FROM public.sheets s
    WHERE s.org_id = profile_org_id
      AND public.can_access_sheet(s.id)
      AND s.search_vector @@ ts_query

    UNION ALL

    SELECT
      'row'::TEXT,
      r.id,
      coalesce(
        r.data ->> (
          SELECT sc.key
          FROM public.sheet_columns sc
          WHERE sc.sheet_id = r.sheet_id AND sc.is_primary = true
          LIMIT 1
        ),
        'Row'
      ),
      r.sheet_id,
      s.workspace_id,
      ts_rank(r.search_vector, ts_query)
    FROM public.rows r
    JOIN public.sheets s ON s.id = r.sheet_id
    WHERE s.org_id = profile_org_id
      AND public.can_access_sheet(r.sheet_id)
      AND r.search_vector @@ ts_query

    UNION ALL

    SELECT
      'contact'::TEXT,
      c.id,
      trim(coalesce(c.first_name, '') || ' ' || coalesce(c.last_name, '')),
      NULL::UUID,
      NULL::UUID,
      ts_rank(c.search_vector, ts_query)
    FROM public.contacts c
    WHERE c.org_id = profile_org_id
      AND c.search_vector @@ ts_query

    UNION ALL

    SELECT
      'document'::TEXT,
      d.id,
      d.file_name,
      d.sheet_id,
      s.workspace_id,
      ts_rank(d.search_vector, ts_query) * 0.9
    FROM public.documents d
    JOIN public.sheets s ON s.id = d.sheet_id
    WHERE d.org_id = profile_org_id
      AND public.can_access_sheet(d.sheet_id)
      AND d.search_vector @@ ts_query

    UNION ALL

    SELECT
      'note'::TEXT,
      n.id,
      left(n.content, 120),
      n.sheet_id,
      s.workspace_id,
      ts_rank(n.search_vector, ts_query) * 0.85
    FROM public.notes n
    JOIN public.sheets s ON s.id = n.sheet_id
    WHERE n.org_id = profile_org_id
      AND public.can_access_sheet(n.sheet_id)
      AND n.search_vector @@ ts_query
  ) results
  ORDER BY rank DESC, title ASC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_global(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_activity(UUID, UUID, TEXT, UUID, TEXT, JSONB, UUID, UUID, UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket (path: {org_id}/{sheet_id}/{document_id}_{filename})
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  26214400,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.documents_storage_path_org_id(path TEXT)
RETURNS UUID
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(split_part(path, '/', 1), '')::UUID;
$$;

CREATE OR REPLACE FUNCTION public.documents_storage_path_sheet_id(path TEXT)
RETURNS UUID
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(split_part(path, '/', 2), '')::UUID;
$$;

CREATE POLICY documents_storage_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.is_org_member(public.documents_storage_path_org_id(name))
    AND public.can_access_sheet(public.documents_storage_path_sheet_id(name))
  );

CREATE POLICY documents_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND public.is_org_member(public.documents_storage_path_org_id(name))
    AND public.has_sheet_access(public.documents_storage_path_sheet_id(name), 'editor')
  );

CREATE POLICY documents_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.is_org_member(public.documents_storage_path_org_id(name))
    AND public.can_access_sheet(public.documents_storage_path_sheet_id(name))
  );

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role, authenticated, anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO postgres, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO postgres, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO postgres, service_role, authenticated, anon;
