-- S0-1 Migration 24: backfill sheets, sheet_columns, and rows from properties/prospects
-- Authoritative spec: S0-1_SHEET_ENGINE_DESIGN.md §3.1, §3.2, §8
-- Expand phase only — legacy properties/prospects tables remain untouched.

-- ---------------------------------------------------------------------------
-- Prospect List status column config (prospect_status enum → select options)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  -- Pre-flight: source tables must not contain duplicate primary keys
  IF (SELECT count(*) FROM public.properties) <>
     (SELECT count(DISTINCT id) FROM public.properties) THEN
    RAISE EXCEPTION 'S0-1 migration 24: duplicate property ids detected in source';
  END IF;

  IF (SELECT count(*) FROM public.prospects) <>
     (SELECT count(DISTINCT id) FROM public.prospects) THEN
    RAISE EXCEPTION 'S0-1 migration 24: duplicate prospect ids detected in source';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 1. sheets ← properties (ID preservation)
-- ---------------------------------------------------------------------------

INSERT INTO public.sheets (
  id,
  org_id,
  name,
  description,
  status,
  template_key,
  address,
  city,
  state,
  created_by,
  created_at,
  updated_at
)
SELECT
  p.id,
  p.org_id,
  p.name,
  p.description,
  p.status::text::public.sheet_status,
  'prospect_list',
  p.address,
  p.city,
  p.state,
  p.created_by,
  p.created_at,
  p.updated_at
FROM public.properties p
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. sheet_columns — canonical Prospect List column set (one per sheet)
--    Grid order: Company · Contact · Status · Use · Website · Comments
-- ---------------------------------------------------------------------------

INSERT INTO public.sheet_columns (
  sheet_id,
  org_id,
  key,
  label,
  type,
  position,
  is_primary,
  is_pinned,
  config
)
SELECT
  s.id,
  s.org_id,
  cols.key,
  cols.label,
  cols.type::public.column_type,
  cols.position,
  cols.is_primary,
  cols.is_pinned,
  cols.config::jsonb
FROM public.sheets s
CROSS JOIN (
  VALUES
    (
      'company',
      'Company',
      'text',
      0,
      true,
      true,
      '{}'::json
    ),
    (
      'contact',
      'Contact',
      'contact',
      1,
      false,
      true,
      '{}'::json
    ),
    (
      'status',
      'Status',
      'select',
      2,
      false,
      true,
      '{
        "options": [
          {"value": "researching", "label": "Researching", "color": "#6b7280"},
          {"value": "contacted",   "label": "Contacted",   "color": "#3b82f6"},
          {"value": "interested",  "label": "Interested",  "color": "#22c55e"},
          {"value": "passed",      "label": "Passed",      "color": "#ef4444"},
          {"value": "closed",      "label": "Closed",      "color": "#8b5cf6"}
        ]
      }'::json
    ),
    (
      'use',
      'Use',
      'text',
      3,
      false,
      false,
      '{}'::json
    ),
    (
      'website',
      'Website',
      'url',
      4,
      false,
      false,
      '{}'::json
    ),
    (
      'comments',
      'Comments',
      'long_text',
      5,
      false,
      false,
      '{}'::json
    )
) AS cols (
  key,
  label,
  type,
  position,
  is_primary,
  is_pinned,
  config
)
WHERE s.template_key = 'prospect_list'
ON CONFLICT (sheet_id, key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. rows ← prospects (ID preservation, JSONB data, deterministic position)
-- ---------------------------------------------------------------------------

INSERT INTO public.rows (
  id,
  sheet_id,
  org_id,
  position,
  data,
  created_at,
  updated_at
)
SELECT
  ps.id,
  ps.property_id,
  pr.org_id,
  row_number() OVER (
    PARTITION BY ps.property_id
    ORDER BY ps.created_at, ps.id
  )::integer,
  jsonb_build_object(
    'company', ps.company_name,
    'status', ps.status::text,
    'use', ps.category,
    'website', ps.website,
    'comments', ps.comments
  ),
  ps.created_at,
  ps.updated_at
FROM public.prospects ps
JOIN public.properties pr ON pr.id = ps.property_id
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Post-backfill validation (must pass before downstream migrations)
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  property_count INTEGER;
  sheet_count INTEGER;
  prospect_count INTEGER;
  row_count INTEGER;
  column_count INTEGER;
  expected_columns_per_sheet INTEGER := 6;
  sheets_missing_columns INTEGER;
  properties_without_sheet INTEGER;
  prospects_without_row INTEGER;
  rows_with_wrong_sheet INTEGER;
BEGIN
  SELECT count(*) INTO property_count FROM public.properties;
  SELECT count(*) INTO sheet_count FROM public.sheets;
  SELECT count(*) INTO prospect_count FROM public.prospects;
  SELECT count(*) INTO row_count FROM public.rows;
  SELECT count(*) INTO column_count FROM public.sheet_columns;

  IF sheet_count <> property_count THEN
    RAISE EXCEPTION
      'S0-1 migration 24: sheet count (%) does not match property count (%)',
      sheet_count, property_count;
  END IF;

  IF row_count <> prospect_count THEN
    RAISE EXCEPTION
      'S0-1 migration 24: row count (%) does not match prospect count (%)',
      row_count, prospect_count;
  END IF;

  SELECT count(*) INTO properties_without_sheet
  FROM public.properties p
  WHERE NOT EXISTS (SELECT 1 FROM public.sheets s WHERE s.id = p.id);

  IF properties_without_sheet > 0 THEN
    RAISE EXCEPTION
      'S0-1 migration 24: % properties missing from sheets',
      properties_without_sheet;
  END IF;

  SELECT count(*) INTO prospects_without_row
  FROM public.prospects ps
  WHERE NOT EXISTS (SELECT 1 FROM public.rows r WHERE r.id = ps.id);

  IF prospects_without_row > 0 THEN
    RAISE EXCEPTION
      'S0-1 migration 24: % prospects missing from rows',
      prospects_without_row;
  END IF;

  SELECT count(*) INTO sheets_missing_columns
  FROM public.sheets s
  WHERE s.template_key = 'prospect_list'
    AND (
      SELECT count(*)
      FROM public.sheet_columns sc
      WHERE sc.sheet_id = s.id
    ) <> expected_columns_per_sheet;

  IF sheets_missing_columns > 0 THEN
    RAISE EXCEPTION
      'S0-1 migration 24: % sheets do not have exactly % Prospect List columns',
      sheets_missing_columns, expected_columns_per_sheet;
  END IF;

  IF column_count <> sheet_count * expected_columns_per_sheet THEN
    RAISE EXCEPTION
      'S0-1 migration 24: sheet_columns count (%) != sheets (%) × % columns',
      column_count, sheet_count, expected_columns_per_sheet;
  END IF;

  SELECT count(*) INTO rows_with_wrong_sheet
  FROM public.prospects ps
  JOIN public.rows r ON r.id = ps.id
  WHERE r.sheet_id IS DISTINCT FROM ps.property_id;

  IF rows_with_wrong_sheet > 0 THEN
    RAISE EXCEPTION
      'S0-1 migration 24: % rows have sheet_id != prospect.property_id',
      rows_with_wrong_sheet;
  END IF;

  -- Every row data payload must contain the stored-value keys (contact is derived)
  IF EXISTS (
    SELECT 1
    FROM public.rows r
    WHERE NOT (
      r.data ? 'company'
      AND r.data ? 'status'
      AND r.data ? 'use'
      AND r.data ? 'website'
      AND r.data ? 'comments'
    )
  ) THEN
    RAISE EXCEPTION
      'S0-1 migration 24: one or more rows missing required data keys';
  END IF;

  -- ID sets must be identical
  IF EXISTS (
    SELECT p.id FROM public.properties p
    EXCEPT
    SELECT s.id FROM public.sheets s
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 24: property/sheet id sets differ';
  END IF;

  IF EXISTS (
    SELECT ps.id FROM public.prospects ps
    EXCEPT
    SELECT r.id FROM public.rows r
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 24: prospect/row id sets differ';
  END IF;

  RAISE NOTICE
    'S0-1 migration 24 backfill OK: % sheets, % sheet_columns, % rows',
    sheet_count, column_count, row_count;
END $$;
