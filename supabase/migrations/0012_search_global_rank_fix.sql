-- Fix search_global: cast rank to REAL for RETURN QUERY type match; qualify ORDER BY columns.

CREATE OR REPLACE FUNCTION public.search_global(
  search_query TEXT,
  result_limit INTEGER DEFAULT 20,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  title TEXT,
  sheet_id UUID,
  workspace_id UUID,
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
  SELECT p.org_id INTO profile_org_id
  FROM public.profiles p
  WHERE p.id = auth.uid() AND p.status = 'active';

  IF profile_org_id IS NULL THEN
    RETURN;
  END IF;

  ts_query := websearch_to_tsquery('english', search_query);

  RETURN QUERY
  SELECT
    results.entity_type,
    results.entity_id,
    results.title,
    results.sheet_id,
    results.workspace_id,
    results.rank
  FROM (
    SELECT
      'sheet'::TEXT AS entity_type,
      s.id AS entity_id,
      s.name AS title,
      s.id AS sheet_id,
      s.workspace_id,
      (ts_rank(s.search_vector, ts_query) * 1.2)::REAL AS rank
    FROM public.sheets s
    WHERE s.org_id = profile_org_id
      AND public.can_access_sheet(s.id)
      AND s.search_vector @@ ts_query

    UNION ALL

    SELECT
      'row'::TEXT,
      r.id,
      coalesce(
        r.data ->> (
          SELECT sc.key
          FROM public.sheet_columns sc
          WHERE sc.sheet_id = r.sheet_id AND sc.is_primary = true
          LIMIT 1
        ),
        'Row'
      ),
      r.sheet_id,
      s.workspace_id,
      ts_rank(r.search_vector, ts_query)::REAL
    FROM public.rows r
    JOIN public.sheets s ON s.id = r.sheet_id
    WHERE s.org_id = profile_org_id
      AND public.can_access_sheet(r.sheet_id)
      AND r.search_vector @@ ts_query

    UNION ALL

    SELECT
      'contact'::TEXT,
      c.id,
      trim(coalesce(c.first_name, '') || ' ' || coalesce(c.last_name, '')),
      NULL::UUID,
      NULL::UUID,
      ts_rank(c.search_vector, ts_query)::REAL
    FROM public.contacts c
    WHERE c.org_id = profile_org_id
      AND c.search_vector @@ ts_query

    UNION ALL

    SELECT
      'document'::TEXT,
      d.id,
      d.file_name,
      d.sheet_id,
      s.workspace_id,
      (ts_rank(d.search_vector, ts_query) * 0.9)::REAL
    FROM public.documents d
    JOIN public.sheets s ON s.id = d.sheet_id
    WHERE d.org_id = profile_org_id
      AND public.can_access_sheet(d.sheet_id)
      AND d.search_vector @@ ts_query

    UNION ALL

    SELECT
      'note'::TEXT,
      n.id,
      left(n.content, 120),
      n.sheet_id,
      s.workspace_id,
      (ts_rank(n.search_vector, ts_query) * 0.85)::REAL
    FROM public.notes n
    JOIN public.sheets s ON s.id = n.sheet_id
    WHERE n.org_id = profile_org_id
      AND public.can_access_sheet(n.sheet_id)
      AND n.search_vector @@ ts_query
  ) results
  ORDER BY results.rank DESC, results.title ASC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_global(TEXT, INTEGER, INTEGER) TO authenticated;
