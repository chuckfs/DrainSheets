-- Editors need to read their own assignment rows so properties SELECT policy
-- (EXISTS on property_assignments) can grant access to assigned properties.

DROP POLICY IF EXISTS property_assignments_select ON public.property_assignments;

CREATE POLICY property_assignments_select ON public.property_assignments
  FOR SELECT TO authenticated
  USING (
    public.has_role('admin'::public.user_role)
    OR user_id = auth.uid()
  );
