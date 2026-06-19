-- Milestone 7: add notes to global search coverage

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
      trim(coalesce(c.first_name, '') || ' ' || coalesce(c.last_name, '')),
      (
        SELECT p.property_id
        FROM public.prospects p
        WHERE p.id = c.prospect_id
      ),
      ts_rank(c.search_vector, ts_query)
    FROM public.contacts c
    WHERE c.org_id = profile_org_id
      AND EXISTS (
        SELECT 1
        FROM public.prospects p
        WHERE p.id = c.prospect_id
          AND public.can_access_property(p.property_id)
      )
      AND c.search_vector @@ ts_query

    UNION ALL

    SELECT
      'document'::TEXT,
      d.id,
      d.file_name,
      d.property_id,
      ts_rank(d.search_vector, ts_query)
    FROM public.documents d
    WHERE d.org_id = profile_org_id
      AND public.can_access_property(d.property_id)
      AND d.search_vector @@ ts_query

    UNION ALL

    SELECT
      'note'::TEXT,
      n.id,
      left(n.content, 120),
      n.property_id,
      ts_rank(n.search_vector, ts_query)
    FROM public.notes n
    WHERE n.org_id = profile_org_id
      AND public.can_access_property(n.property_id)
      AND n.search_vector @@ ts_query
  ) results
  ORDER BY rank DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$;
