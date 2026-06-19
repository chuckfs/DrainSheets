-- Milestone 4: extend contacts schema, fix RLS for INSERT RETURNING, add delete policy

ALTER TABLE public.contacts
  ADD COLUMN first_name TEXT,
  ADD COLUMN last_name TEXT,
  ADD COLUMN company TEXT,
  ADD COLUMN org_id UUID REFERENCES public.organizations (id),
  ADD COLUMN created_by UUID REFERENCES public.profiles (id),
  ADD COLUMN updated_by UUID REFERENCES public.profiles (id);

UPDATE public.contacts c
SET
  first_name = c.name,
  last_name = NULL,
  org_id = (
    SELECT pr.org_id
    FROM public.prospects ps
    JOIN public.properties pr ON pr.id = ps.property_id
    WHERE ps.id = c.prospect_id
  )
WHERE c.first_name IS NULL;

ALTER TABLE public.contacts
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN org_id SET NOT NULL;

ALTER TABLE public.contacts DROP COLUMN IF EXISTS search_vector;
ALTER TABLE public.contacts DROP COLUMN name;

CREATE INDEX IF NOT EXISTS contacts_org_id_idx ON public.contacts (org_id);

ALTER TABLE public.contacts
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'english',
      coalesce(first_name, '') || ' ' ||
      coalesce(last_name, '') || ' ' ||
      coalesce(company, '') || ' ' ||
      coalesce(email, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS contacts_search_vector_idx ON public.contacts USING gin (search_vector);

-- Use prospect_id from the row (not self-subquery) so INSERT ... RETURNING works
DROP POLICY IF EXISTS contacts_select ON public.contacts;
DROP POLICY IF EXISTS contacts_insert ON public.contacts;
DROP POLICY IF EXISTS contacts_update ON public.contacts;
DROP POLICY IF EXISTS contacts_delete ON public.contacts;

CREATE POLICY contacts_select ON public.contacts
  FOR SELECT TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND EXISTS (
      SELECT 1
      FROM public.prospects p
      WHERE p.id = contacts.prospect_id
        AND public.can_access_property(p.property_id)
    )
  );

CREATE POLICY contacts_insert ON public.contacts
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.can_access_property(
      (SELECT p.property_id FROM public.prospects p WHERE p.id = prospect_id)
    )
  );

CREATE POLICY contacts_update ON public.contacts
  FOR UPDATE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND EXISTS (
      SELECT 1
      FROM public.prospects p
      WHERE p.id = contacts.prospect_id
        AND public.can_access_property(p.property_id)
    )
  )
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.can_access_property(
      (SELECT p.property_id FROM public.prospects p WHERE p.id = prospect_id)
    )
  );

CREATE POLICY contacts_delete ON public.contacts
  FOR DELETE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND EXISTS (
      SELECT 1
      FROM public.prospects p
      WHERE p.id = contacts.prospect_id
        AND public.can_access_property(p.property_id)
    )
  );

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
    WHERE public.can_access_property(d.property_id)
      AND d.search_vector @@ ts_query
  ) results
  ORDER BY rank DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$;
