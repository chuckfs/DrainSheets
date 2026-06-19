CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES public.prospects (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties (id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES public.prospects (id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  uploaded_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties (id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES public.prospects (id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX contacts_prospect_id_idx ON public.contacts (prospect_id);
CREATE INDEX contacts_email_idx ON public.contacts (email);

CREATE INDEX documents_property_id_idx ON public.documents (property_id);
CREATE INDEX documents_prospect_id_idx ON public.documents (prospect_id);

CREATE INDEX notes_property_id_idx ON public.notes (property_id);
CREATE INDEX notes_prospect_id_idx ON public.notes (prospect_id);

CREATE TRIGGER contacts_set_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER notes_set_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Ensure prospect belongs to property when prospect_id is set on documents/notes
CREATE OR REPLACE FUNCTION public.validate_prospect_property_match()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.prospect_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.prospects p
      WHERE p.id = NEW.prospect_id
        AND p.property_id = NEW.property_id
    ) THEN
      RAISE EXCEPTION 'prospect_id must belong to property_id';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER documents_validate_prospect_property
  BEFORE INSERT OR UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_prospect_property_match();

CREATE TRIGGER notes_validate_prospect_property
  BEFORE INSERT OR UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_prospect_property_match();
