-- Milestone 5: extend documents schema, bucket mime types, row-based RLS

ALTER TABLE public.documents
  ADD COLUMN org_id UUID REFERENCES public.organizations (id);

UPDATE public.documents d
SET org_id = p.org_id
FROM public.properties p
WHERE p.id = d.property_id
  AND d.org_id IS NULL;

ALTER TABLE public.documents
  ALTER COLUMN org_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS documents_org_id_idx ON public.documents (org_id);

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg'
]
WHERE id = 'documents';

-- Row-based SELECT (property_id on row) works with INSERT ... RETURNING
DROP POLICY IF EXISTS documents_select ON public.documents;
DROP POLICY IF EXISTS documents_insert ON public.documents;
DROP POLICY IF EXISTS documents_delete ON public.documents;

CREATE POLICY documents_select ON public.documents
  FOR SELECT TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND public.can_access_property(property_id)
  );

CREATE POLICY documents_insert ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.can_access_property(property_id)
    AND uploaded_by = auth.uid()
  );

CREATE POLICY documents_delete ON public.documents
  FOR DELETE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND public.can_access_property(property_id)
    AND (
      public.has_role('admin'::public.user_role)
      OR uploaded_by = auth.uid()
    )
  );
