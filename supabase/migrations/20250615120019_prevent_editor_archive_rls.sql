-- Milestone 8: Editors must not archive properties (PERMISSIONS.md).
-- Server actions already block this; enforce at RLS as the security boundary.

DROP POLICY IF EXISTS properties_update ON public.properties;

CREATE POLICY properties_update ON public.properties
  FOR UPDATE TO authenticated
  USING (
    public.has_role('admin'::public.user_role)
    OR (
      public.has_role('editor'::public.user_role)
      AND public.can_access_property(id)
    )
  )
  WITH CHECK (
    public.has_role('admin'::public.user_role)
    OR (
      public.has_role('editor'::public.user_role)
      AND public.can_access_property(id)
      AND status <> 'archived'::public.property_status
    )
  );
