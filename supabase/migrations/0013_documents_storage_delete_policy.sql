-- S1 fix: storage DELETE must mirror documents table DELETE (admin or uploader).
-- Previously gated only by can_access_sheet (viewer), allowing file deletion without row delete.

CREATE OR REPLACE FUNCTION public.documents_storage_path_document_id(path TEXT)
RETURNS UUID
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(split_part(split_part(path, '/', 3), '_', 1), '')::UUID;
$$;

CREATE OR REPLACE FUNCTION public.can_delete_document_storage(
  path TEXT,
  check_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    path IS NOT NULL
    AND public.is_org_member(public.documents_storage_path_org_id(path))
    AND public.can_access_sheet(public.documents_storage_path_sheet_id(path))
    AND (
      public.has_sheet_access(
        public.documents_storage_path_sheet_id(path),
        'admin'::public.access_role,
        check_user_id
      )
      OR EXISTS (
        SELECT 1
        FROM public.documents d
        WHERE d.id = public.documents_storage_path_document_id(path)
          AND d.org_id = public.documents_storage_path_org_id(path)
          AND d.sheet_id = public.documents_storage_path_sheet_id(path)
          AND d.uploaded_by = check_user_id
      )
    );
$$;

DROP POLICY IF EXISTS documents_storage_delete ON storage.objects;

CREATE POLICY documents_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.can_delete_document_storage(name)
  );

GRANT EXECUTE ON FUNCTION public.can_delete_document_storage(TEXT, UUID) TO authenticated;
