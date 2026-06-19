-- Fix properties INSERT: subquery on profiles was subject to RLS and could return NULL.
CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id
  FROM public.profiles
  WHERE id = auth.uid()
    AND status = 'active';
$$;

GRANT EXECUTE ON FUNCTION public.current_user_org_id() TO authenticated;

DROP POLICY IF EXISTS properties_insert ON public.properties;

CREATE POLICY properties_insert ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('admin'::public.user_role)
    AND org_id = public.current_user_org_id()
  );
