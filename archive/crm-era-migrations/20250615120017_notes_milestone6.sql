-- Milestone 6: extend notes schema and align RLS with documents/contacts patterns

ALTER TABLE public.notes
  ADD COLUMN org_id UUID REFERENCES public.organizations (id);

UPDATE public.notes n
SET org_id = p.org_id
FROM public.properties p
WHERE p.id = n.property_id
  AND n.org_id IS NULL;

ALTER TABLE public.notes
  ALTER COLUMN org_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS notes_org_id_idx ON public.notes (org_id);

DROP POLICY IF EXISTS notes_select ON public.notes;
DROP POLICY IF EXISTS notes_insert ON public.notes;
DROP POLICY IF EXISTS notes_update ON public.notes;
DROP POLICY IF EXISTS notes_delete ON public.notes;

CREATE POLICY notes_select ON public.notes
  FOR SELECT TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND public.can_access_property(property_id)
  );

CREATE POLICY notes_insert ON public.notes
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.can_access_property(property_id)
    AND user_id = auth.uid()
  );

CREATE POLICY notes_update ON public.notes
  FOR UPDATE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND public.can_access_property(property_id)
    AND (
      public.has_role('admin'::public.user_role)
      OR user_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.can_access_property(property_id)
    AND (
      public.has_role('admin'::public.user_role)
      OR user_id = auth.uid()
    )
  );

CREATE POLICY notes_delete ON public.notes
  FOR DELETE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND public.can_access_property(property_id)
    AND (
      public.has_role('admin'::public.user_role)
      OR user_id = auth.uid()
    )
  );
