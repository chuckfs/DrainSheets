-- Allow resource admins to view/update shares on resources they manage.

DROP POLICY IF EXISTS shares_select ON public.shares;

CREATE POLICY shares_select ON public.shares
  FOR SELECT TO authenticated
  USING (
    grantee_id = auth.uid()
    OR (public.has_org_role('admin') AND org_id = public.current_user_org_id())
    OR (
      resource_type = 'workspace'
      AND public.has_workspace_access(resource_id, 'admin')
    )
    OR (
      resource_type = 'folder'
      AND public.has_folder_access(resource_id, 'admin')
    )
    OR (
      resource_type = 'sheet'
      AND public.has_sheet_access(resource_id, 'admin')
    )
  );

CREATE POLICY shares_update ON public.shares
  FOR UPDATE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND (
      (resource_type = 'workspace' AND public.has_workspace_access(resource_id, 'admin'))
      OR (resource_type = 'folder' AND public.has_folder_access(resource_id, 'admin'))
      OR (resource_type = 'sheet' AND public.has_sheet_access(resource_id, 'admin'))
    )
  )
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND role <> 'owner'::public.access_role
    AND (
      (resource_type = 'workspace' AND public.has_workspace_access(resource_id, 'admin'))
      OR (resource_type = 'folder' AND public.has_folder_access(resource_id, 'admin'))
      OR (resource_type = 'sheet' AND public.has_sheet_access(resource_id, 'admin'))
    )
  );
