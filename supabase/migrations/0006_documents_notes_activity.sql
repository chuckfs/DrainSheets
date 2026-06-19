-- G1 Phase: documents, notes, activity

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  sheet_id UUID NOT NULL REFERENCES public.sheets (id) ON DELETE CASCADE,
  row_id UUID REFERENCES public.rows (id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  description TEXT,
  uploaded_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(file_name, ''))
  ) STORED
);

CREATE INDEX documents_sheet_id_idx ON public.documents (sheet_id);
CREATE INDEX documents_row_id_idx ON public.documents (row_id);
CREATE INDEX documents_org_id_idx ON public.documents (org_id);
CREATE INDEX documents_search_vector_idx ON public.documents USING gin (search_vector);

CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  sheet_id UUID NOT NULL REFERENCES public.sheets (id) ON DELETE CASCADE,
  row_id UUID REFERENCES public.rows (id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(content, ''))
  ) STORED
);

CREATE INDEX notes_sheet_id_idx ON public.notes (sheet_id);
CREATE INDEX notes_row_id_idx ON public.notes (row_id);
CREATE INDEX notes_org_id_idx ON public.notes (org_id);
CREATE INDEX notes_search_vector_idx ON public.notes USING gin (search_vector);

CREATE TRIGGER notes_set_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES public.workspaces (id) ON DELETE SET NULL,
  sheet_id UUID REFERENCES public.sheets (id) ON DELETE SET NULL,
  row_id UUID REFERENCES public.rows (id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX activity_org_id_created_at_idx ON public.activity (org_id, created_at DESC);
CREATE INDEX activity_workspace_id_created_at_idx ON public.activity (workspace_id, created_at DESC);
CREATE INDEX activity_sheet_id_created_at_idx ON public.activity (sheet_id, created_at DESC);
CREATE INDEX activity_row_id_created_at_idx ON public.activity (row_id, created_at DESC);
CREATE INDEX activity_entity_type_entity_id_idx ON public.activity (entity_type, entity_id);

CREATE OR REPLACE FUNCTION public.validate_row_belongs_to_sheet()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.row_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.rows r
    WHERE r.id = NEW.row_id
      AND r.sheet_id = NEW.sheet_id
  ) THEN
    RAISE EXCEPTION 'row_id must belong to sheet_id';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER documents_validate_row_belongs_to_sheet
  BEFORE INSERT OR UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_row_belongs_to_sheet();

CREATE TRIGGER notes_validate_row_belongs_to_sheet
  BEFORE INSERT OR UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_row_belongs_to_sheet();

CREATE OR REPLACE FUNCTION public.log_activity(
  p_org_id UUID,
  p_actor_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_workspace_id UUID DEFAULT NULL,
  p_sheet_id UUID DEFAULT NULL,
  p_row_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.activity (
    org_id,
    actor_id,
    workspace_id,
    sheet_id,
    row_id,
    entity_type,
    entity_id,
    action,
    metadata
  )
  VALUES (
    p_org_id,
    p_actor_id,
    p_workspace_id,
    p_sheet_id,
    p_row_id,
    p_entity_type,
    p_entity_id,
    p_action,
    p_metadata
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;
