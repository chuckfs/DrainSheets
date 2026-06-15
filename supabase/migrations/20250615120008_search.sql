-- Full-text search vectors
ALTER TABLE public.properties
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, ''))) STORED;

ALTER TABLE public.prospects
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(company_name, '') || ' ' || coalesce(category, ''))
  ) STORED;

ALTER TABLE public.contacts
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(email, ''))
  ) STORED;

ALTER TABLE public.documents
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(file_name, ''))) STORED;

ALTER TABLE public.notes
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED;

CREATE INDEX properties_search_vector_idx ON public.properties USING gin (search_vector);
CREATE INDEX prospects_search_vector_idx ON public.prospects USING gin (search_vector);
CREATE INDEX contacts_search_vector_idx ON public.contacts USING gin (search_vector);
CREATE INDEX documents_search_vector_idx ON public.documents USING gin (search_vector);
CREATE INDEX notes_search_vector_idx ON public.notes USING gin (search_vector);

-- Global search RPC (foundation stub — ranking refined in later milestone)
CREATE OR REPLACE FUNCTION public.search_global(
  search_query TEXT,
  result_limit INTEGER DEFAULT 20,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  title TEXT,
  property_id UUID,
  rank REAL
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ts_query tsquery;
  profile_org_id UUID;
BEGIN
  SELECT org_id INTO profile_org_id
  FROM public.profiles
  WHERE id = auth.uid() AND status = 'active';

  IF profile_org_id IS NULL THEN
    RETURN;
  END IF;

  ts_query := websearch_to_tsquery('english', search_query);

  RETURN QUERY
  SELECT * FROM (
    SELECT
      'property'::TEXT,
      pr.id,
      pr.name,
      pr.id,
      ts_rank(pr.search_vector, ts_query)
    FROM public.properties pr
    WHERE pr.org_id = profile_org_id
      AND public.can_access_property(pr.id)
      AND pr.search_vector @@ ts_query

    UNION ALL

    SELECT
      'prospect'::TEXT,
      ps.id,
      ps.company_name,
      ps.property_id,
      ts_rank(ps.search_vector, ts_query)
    FROM public.prospects ps
    WHERE public.can_access_property(ps.property_id)
      AND ps.search_vector @@ ts_query

    UNION ALL

    SELECT
      'contact'::TEXT,
      c.id,
      c.name,
      public.property_id_for_contact(c.id),
      ts_rank(c.search_vector, ts_query)
    FROM public.contacts c
    WHERE public.can_access_property(public.property_id_for_contact(c.id))
      AND c.search_vector @@ ts_query

    UNION ALL

    SELECT
      'document'::TEXT,
      d.id,
      d.file_name,
      d.property_id,
      ts_rank(d.search_vector, ts_query)
    FROM public.documents d
    WHERE public.can_access_property(d.property_id)
      AND d.search_vector @@ ts_query
  ) results
  ORDER BY rank DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_global(TEXT, INTEGER, INTEGER) TO authenticated;
