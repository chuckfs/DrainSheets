INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  26214400,
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Path: {org_id}/{property_id}/{document_id}_{filename}
CREATE OR REPLACE FUNCTION public.documents_storage_path_org_id(path TEXT)
RETURNS UUID
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(split_part(path, '/', 1), '')::UUID;
$$;

CREATE OR REPLACE FUNCTION public.documents_storage_path_property_id(path TEXT)
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
    AND public.can_access_property(public.documents_storage_path_property_id(name))
    AND public.is_org_member(public.documents_storage_path_org_id(name))
  );

CREATE POLICY documents_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND public.can_access_property(public.documents_storage_path_property_id(name))
    AND public.is_org_member(public.documents_storage_path_org_id(name))
  );

CREATE POLICY documents_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.can_access_property(public.documents_storage_path_property_id(name))
    AND public.is_org_member(public.documents_storage_path_org_id(name))
  );
