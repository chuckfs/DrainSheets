-- Document version history: re-uploading a file keeps prior versions instead of
-- overwriting. `documents` continues to hold the CURRENT version's file metadata;
-- `document_versions` records every version (including the current one).

-- ---------------------------------------------------------------------------
-- 1. documents: current pointer + version count
-- ---------------------------------------------------------------------------

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS current_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS version_count INTEGER NOT NULL DEFAULT 1;

-- ---------------------------------------------------------------------------
-- 2. documents UPDATE policy
--    (none existed — rename/version-pointer updates were silently denied by RLS)
-- ---------------------------------------------------------------------------

CREATE POLICY documents_update ON public.documents
  FOR UPDATE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND public.has_sheet_access(sheet_id, 'editor')
  )
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.has_sheet_access(sheet_id, 'editor')
  );

-- ---------------------------------------------------------------------------
-- 3. document_versions table
-- ---------------------------------------------------------------------------

CREATE TABLE public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents (id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  version_no INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  uploaded_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, version_no)
);

CREATE INDEX document_versions_document_id_version_idx
  ON public.document_versions (document_id, version_no DESC);

-- ---------------------------------------------------------------------------
-- 4. Backfill: every existing document becomes its own version 1
-- ---------------------------------------------------------------------------

INSERT INTO public.document_versions (
  document_id, org_id, version_no, file_name, file_path, mime_type, file_size, uploaded_by, created_at
)
SELECT d.id, d.org_id, 1, d.file_name, d.file_path, d.mime_type, d.file_size, d.uploaded_by, d.created_at
FROM public.documents d
ON CONFLICT (document_id, version_no) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. RLS — access mirrors the parent document's sheet access
-- ---------------------------------------------------------------------------

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY document_versions_select ON public.document_versions
  FOR SELECT TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND EXISTS (
      SELECT 1
      FROM public.documents d
      WHERE d.id = document_versions.document_id
        AND public.can_access_sheet(d.sheet_id)
    )
  );

CREATE POLICY document_versions_insert ON public.document_versions
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.documents d
      WHERE d.id = document_versions.document_id
        AND public.has_sheet_access(d.sheet_id, 'editor')
    )
  );

-- Delete mirrors documents delete + storage delete (admin or the document's uploader)
CREATE POLICY document_versions_delete ON public.document_versions
  FOR DELETE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND EXISTS (
      SELECT 1
      FROM public.documents d
      WHERE d.id = document_versions.document_id
        AND public.can_access_sheet(d.sheet_id)
        AND (
          public.has_sheet_access(d.sheet_id, 'admin')
          OR d.uploaded_by = auth.uid()
        )
    )
  );

-- ---------------------------------------------------------------------------
-- 6. Grants
-- ---------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_versions TO authenticated;
GRANT ALL ON public.document_versions TO service_role;
