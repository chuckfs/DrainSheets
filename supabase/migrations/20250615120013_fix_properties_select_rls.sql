-- INSERT ... RETURNING (used by Supabase .insert().select()) evaluates SELECT policies
-- on the new row. can_access_property(id) subqueries properties and cannot see the row
-- being inserted, so RETURNING fails even when INSERT succeeds.
-- Use row columns (org_id, id) directly so RETURNING works for admins and assignees.

DROP POLICY IF EXISTS properties_select ON public.properties;

CREATE POLICY properties_select ON public.properties
  FOR SELECT TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND (
      public.has_role('admin'::public.user_role)
      OR EXISTS (
        SELECT 1
        FROM public.property_assignments pa
        WHERE pa.property_id = properties.id
          AND pa.user_id = auth.uid()
      )
    )
  );
