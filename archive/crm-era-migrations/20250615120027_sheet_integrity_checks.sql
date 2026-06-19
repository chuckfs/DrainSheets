-- S0-1 Migration 27: sheet integrity checks (Expand phase)
-- Authoritative spec: S0-1_SHEET_ENGINE_DESIGN.md §3.4, §8 (migration 27)
-- Validates sheet/row consistency on dependents; provisions sheets/rows from legacy writes.

-- ---------------------------------------------------------------------------
-- 1. Shared helpers — provision Prospect List columns for a sheet
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.provision_prospect_list_columns(
  target_sheet_id UUID,
  target_org_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.sheet_columns sc
    WHERE sc.sheet_id = target_sheet_id
  ) THEN
    RETURN;
  END IF;

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
  VALUES
    (target_sheet_id, target_org_id, 'company', 'Company', 'text', 0, true, true, '{}'::jsonb),
    (target_sheet_id, target_org_id, 'contact', 'Contact', 'contact', 1, false, true, '{}'::jsonb),
    (
      target_sheet_id,
      target_org_id,
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
      }'::jsonb
    ),
    (target_sheet_id, target_org_id, 'use', 'Use', 'text', 3, false, false, '{}'::jsonb),
    (target_sheet_id, target_org_id, 'website', 'Website', 'url', 4, false, false, '{}'::jsonb),
    (target_sheet_id, target_org_id, 'comments', 'Comments', 'long_text', 5, false, false, '{}'::jsonb)
  ON CONFLICT (sheet_id, key) DO NOTHING;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Expand-phase provisioning — legacy property/prospect writes mirror to sheets/rows
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.provision_sheet_from_property()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
  VALUES (
    NEW.id,
    NEW.org_id,
    NEW.name,
    NEW.description,
    NEW.status::text::public.sheet_status,
    'prospect_list',
    NEW.address,
    NEW.city,
    NEW.state,
    NEW.created_by,
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    org_id = EXCLUDED.org_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    updated_at = EXCLUDED.updated_at;

  PERFORM public.provision_prospect_list_columns(NEW.id, NEW.org_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.provision_row_from_prospect()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  property_org_id UUID;
  next_position INTEGER;
BEGIN
  SELECT pr.org_id
  INTO property_org_id
  FROM public.properties pr
  WHERE pr.id = NEW.property_id;

  IF property_org_id IS NULL THEN
    RAISE EXCEPTION 'prospect property_id % does not resolve to a property', NEW.property_id;
  END IF;

  SELECT coalesce(max(r.position), 0) + 1
  INTO next_position
  FROM public.rows r
  WHERE r.sheet_id = NEW.property_id;

  INSERT INTO public.rows (
    id,
    sheet_id,
    org_id,
    position,
    data,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.property_id,
    property_org_id,
    next_position,
    jsonb_build_object(
      'company', NEW.company_name,
      'status', NEW.status::text,
      'use', NEW.category,
      'website', NEW.website,
      'comments', NEW.comments
    ),
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    sheet_id = EXCLUDED.sheet_id,
    org_id = EXCLUDED.org_id,
    data = EXCLUDED.data,
    updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS properties_provision_sheet ON public.properties;
CREATE TRIGGER properties_provision_sheet
  AFTER INSERT OR UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.provision_sheet_from_property();

DROP TRIGGER IF EXISTS prospects_provision_row ON public.prospects;
CREATE TRIGGER prospects_provision_row
  AFTER INSERT OR UPDATE ON public.prospects
  FOR EACH ROW
  EXECUTE FUNCTION public.provision_row_from_prospect();

-- ---------------------------------------------------------------------------
-- 3. Integrity validation — row must belong to sheet; legacy IDs preserved
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_document_sheet_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sheet_id IS DISTINCT FROM NEW.property_id THEN
    RAISE EXCEPTION 'documents.sheet_id must match property_id during expand phase';
  END IF;

  IF NEW.row_id IS NOT NULL AND NEW.prospect_id IS NOT NULL
     AND NEW.row_id IS DISTINCT FROM NEW.prospect_id THEN
    RAISE EXCEPTION 'documents.row_id must match prospect_id during expand phase';
  END IF;

  IF NEW.prospect_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.prospects p
      WHERE p.id = NEW.prospect_id
        AND p.property_id = NEW.property_id
    ) THEN
      RAISE EXCEPTION 'documents.prospect_id must belong to property_id';
    END IF;
  END IF;

  IF NEW.row_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.rows r
      WHERE r.id = NEW.row_id
        AND r.sheet_id = NEW.sheet_id
    ) THEN
      RAISE EXCEPTION 'documents.row_id must belong to documents.sheet_id';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_note_sheet_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sheet_id IS DISTINCT FROM NEW.property_id THEN
    RAISE EXCEPTION 'notes.sheet_id must match property_id during expand phase';
  END IF;

  IF NEW.row_id IS NOT NULL AND NEW.prospect_id IS NOT NULL
     AND NEW.row_id IS DISTINCT FROM NEW.prospect_id THEN
    RAISE EXCEPTION 'notes.row_id must match prospect_id during expand phase';
  END IF;

  IF NEW.prospect_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.prospects p
      WHERE p.id = NEW.prospect_id
        AND p.property_id = NEW.property_id
    ) THEN
      RAISE EXCEPTION 'notes.prospect_id must belong to property_id';
    END IF;
  END IF;

  IF NEW.row_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.rows r
      WHERE r.id = NEW.row_id
        AND r.sheet_id = NEW.sheet_id
    ) THEN
      RAISE EXCEPTION 'notes.row_id must belong to notes.sheet_id';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_email_log_sheet_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.property_id IS NOT NULL AND NEW.sheet_id IS DISTINCT FROM NEW.property_id THEN
    RAISE EXCEPTION 'email_logs.sheet_id must match property_id during expand phase';
  END IF;

  IF NEW.prospect_id IS NOT NULL AND NEW.row_id IS DISTINCT FROM NEW.prospect_id THEN
    RAISE EXCEPTION 'email_logs.row_id must match prospect_id during expand phase';
  END IF;

  IF NEW.row_id IS NOT NULL AND NEW.sheet_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.rows r
      WHERE r.id = NEW.row_id
        AND r.sheet_id = NEW.sheet_id
    ) THEN
      RAISE EXCEPTION 'email_logs.row_id must belong to email_logs.sheet_id';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_contact_row_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.row_id IS DISTINCT FROM NEW.prospect_id THEN
    RAISE EXCEPTION 'contacts.row_id must match prospect_id during expand phase';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.rows r
    WHERE r.id = NEW.row_id
  ) THEN
    RAISE EXCEPTION 'contacts.row_id must reference an existing row';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.prospects p
    JOIN public.rows r ON r.id = NEW.row_id
    WHERE p.id = NEW.prospect_id
      AND r.sheet_id = p.property_id
  ) THEN
    RAISE EXCEPTION 'contacts.row_id must belong to the same sheet as contacts.prospect_id';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_favorite_sheet_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sheet_id IS DISTINCT FROM NEW.property_id THEN
    RAISE EXCEPTION 'favorites.sheet_id must match property_id during expand phase';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.sheets s
    WHERE s.id = NEW.sheet_id
  ) THEN
    RAISE EXCEPTION 'favorites.sheet_id must reference an existing sheet';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_recent_view_sheet_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sheet_id IS DISTINCT FROM NEW.property_id THEN
    RAISE EXCEPTION 'recent_views.sheet_id must match property_id during expand phase';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.sheets s
    WHERE s.id = NEW.sheet_id
  ) THEN
    RAISE EXCEPTION 'recent_views.sheet_id must reference an existing sheet';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_activity_sheet_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.property_id IS NOT NULL AND NEW.sheet_id IS DISTINCT FROM NEW.property_id THEN
    RAISE EXCEPTION 'activity.sheet_id must match property_id during expand phase';
  END IF;

  IF NEW.property_id IS NULL AND NEW.sheet_id IS NOT NULL THEN
    RAISE EXCEPTION 'activity.sheet_id requires property_id during expand phase';
  END IF;

  IF NEW.sheet_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.sheets s WHERE s.id = NEW.sheet_id
  ) THEN
    RAISE EXCEPTION 'activity.sheet_id must reference an existing sheet';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_sheet_assignment_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.sheets s
    WHERE s.id = NEW.sheet_id
  ) THEN
    RAISE EXCEPTION 'sheet_assignments.sheet_id must reference an existing sheet';
  END IF;

  RETURN NEW;
END;
$$;

-- Replace legacy prospect/property validator with sheet-aware validators
DROP TRIGGER IF EXISTS documents_validate_prospect_property ON public.documents;
DROP TRIGGER IF EXISTS notes_validate_prospect_property ON public.notes;

DROP TRIGGER IF EXISTS documents_validate_sheet_integrity ON public.documents;
CREATE TRIGGER documents_validate_sheet_integrity
  BEFORE INSERT OR UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_document_sheet_integrity();

DROP TRIGGER IF EXISTS notes_validate_sheet_integrity ON public.notes;
CREATE TRIGGER notes_validate_sheet_integrity
  BEFORE INSERT OR UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_note_sheet_integrity();

DROP TRIGGER IF EXISTS email_logs_validate_sheet_integrity ON public.email_logs;
CREATE TRIGGER email_logs_validate_sheet_integrity
  BEFORE INSERT OR UPDATE ON public.email_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_email_log_sheet_integrity();

DROP TRIGGER IF EXISTS contacts_validate_row_integrity ON public.contacts;
CREATE TRIGGER contacts_validate_row_integrity
  BEFORE INSERT OR UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_contact_row_integrity();

DROP TRIGGER IF EXISTS favorites_validate_sheet_integrity ON public.favorites;
CREATE TRIGGER favorites_validate_sheet_integrity
  BEFORE INSERT OR UPDATE ON public.favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_favorite_sheet_integrity();

DROP TRIGGER IF EXISTS recent_views_validate_sheet_integrity ON public.recent_views;
CREATE TRIGGER recent_views_validate_sheet_integrity
  BEFORE INSERT OR UPDATE ON public.recent_views
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_recent_view_sheet_integrity();

DROP TRIGGER IF EXISTS activity_validate_sheet_integrity ON public.activity;
CREATE TRIGGER activity_validate_sheet_integrity
  BEFORE INSERT OR UPDATE ON public.activity
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_activity_sheet_integrity();

DROP TRIGGER IF EXISTS sheet_assignments_validate_integrity ON public.sheet_assignments;
CREATE TRIGGER sheet_assignments_validate_integrity
  BEFORE INSERT OR UPDATE ON public.sheet_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_sheet_assignment_integrity();

-- ---------------------------------------------------------------------------
-- 4. Post-migration integrity verification (S0-1 §3.4)
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  property_count INTEGER;
  sheet_count INTEGER;
  prospect_count INTEGER;
  row_count INTEGER;
  mismatch_count INTEGER;
  property_assignment_count INTEGER;
  sheet_assignment_count INTEGER;
BEGIN
  SELECT count(*) INTO property_count FROM public.properties;
  SELECT count(*) INTO sheet_count FROM public.sheets;
  SELECT count(*) INTO prospect_count FROM public.prospects;
  SELECT count(*) INTO row_count FROM public.rows;

  IF sheet_count <> property_count THEN
    RAISE EXCEPTION
      'S0-1 migration 27: sheet count (%) != property count (%)',
      sheet_count, property_count;
  END IF;

  IF row_count <> prospect_count THEN
    RAISE EXCEPTION
      'S0-1 migration 27: row count (%) != prospect count (%)',
      row_count, prospect_count;
  END IF;

  IF EXISTS (
    SELECT p.id FROM public.properties p
    EXCEPT
    SELECT s.id FROM public.sheets s
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 27: property/sheet id sets differ';
  END IF;

  IF EXISTS (
    SELECT ps.id FROM public.prospects ps
    EXCEPT
    SELECT r.id FROM public.rows r
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 27: prospect/row id sets differ';
  END IF;

  SELECT count(*) INTO mismatch_count
  FROM public.documents d
  WHERE d.sheet_id IS DISTINCT FROM d.property_id
     OR d.row_id IS DISTINCT FROM d.prospect_id;

  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'S0-1 migration 27: % documents have invalid sheet/row mapping', mismatch_count;
  END IF;

  SELECT count(*) INTO mismatch_count
  FROM public.notes n
  WHERE n.sheet_id IS DISTINCT FROM n.property_id
     OR n.row_id IS DISTINCT FROM n.prospect_id;

  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'S0-1 migration 27: % notes have invalid sheet/row mapping', mismatch_count;
  END IF;

  SELECT count(*) INTO mismatch_count
  FROM public.favorites f
  WHERE f.sheet_id IS DISTINCT FROM f.property_id;

  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'S0-1 migration 27: % favorites have invalid sheet_id mapping', mismatch_count;
  END IF;

  SELECT count(*) INTO mismatch_count
  FROM public.recent_views rv
  WHERE rv.sheet_id IS DISTINCT FROM rv.property_id;

  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'S0-1 migration 27: % recent_views have invalid sheet_id mapping', mismatch_count;
  END IF;

  SELECT count(*) INTO mismatch_count
  FROM public.email_logs el
  WHERE el.sheet_id IS DISTINCT FROM el.property_id
     OR el.row_id IS DISTINCT FROM el.prospect_id;

  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'S0-1 migration 27: % email_logs have invalid sheet/row mapping', mismatch_count;
  END IF;

  SELECT count(*) INTO mismatch_count
  FROM public.contacts c
  WHERE c.row_id IS DISTINCT FROM c.prospect_id;

  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'S0-1 migration 27: % contacts have invalid row_id mapping', mismatch_count;
  END IF;

  SELECT count(*) INTO property_assignment_count FROM public.property_assignments;
  SELECT count(*) INTO sheet_assignment_count FROM public.sheet_assignments;

  IF sheet_assignment_count <> property_assignment_count THEN
    RAISE EXCEPTION
      'S0-1 migration 27: sheet_assignments count (%) != property_assignments count (%)',
      sheet_assignment_count, property_assignment_count;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.documents d
    WHERE d.row_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.rows r
        WHERE r.id = d.row_id
          AND r.sheet_id = d.sheet_id
      )
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 27: document row_id/sheet_id ownership mismatch';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.notes n
    WHERE n.row_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.rows r
        WHERE r.id = n.row_id
          AND r.sheet_id = n.sheet_id
      )
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 27: note row_id/sheet_id ownership mismatch';
  END IF;

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
    RAISE EXCEPTION 'S0-1 migration 27: one or more rows missing required data keys';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.documents d
    WHERE d.sheet_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.sheets s WHERE s.id = d.sheet_id)
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 27: orphan documents.sheet_id reference';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.notes n
    WHERE n.sheet_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.sheets s WHERE s.id = n.sheet_id)
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 27: orphan notes.sheet_id reference';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.favorites f
    WHERE f.sheet_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.sheets s WHERE s.id = f.sheet_id)
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 27: orphan favorites.sheet_id reference';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.recent_views rv
    WHERE rv.sheet_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.sheets s WHERE s.id = rv.sheet_id)
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 27: orphan recent_views.sheet_id reference';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.activity a
    WHERE a.sheet_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.sheets s WHERE s.id = a.sheet_id)
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 27: orphan activity.sheet_id reference';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.email_logs el
    WHERE el.sheet_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.sheets s WHERE s.id = el.sheet_id)
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 27: orphan email_logs.sheet_id reference';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.contacts c
    WHERE c.row_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.rows r WHERE r.id = c.row_id)
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 27: orphan contacts.row_id reference';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.documents d
    WHERE d.row_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.rows r WHERE r.id = d.row_id)
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 27: orphan documents.row_id reference';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.notes n
    WHERE n.row_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.rows r WHERE r.id = n.row_id)
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 27: orphan notes.row_id reference';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.email_logs el
    WHERE el.row_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.rows r WHERE r.id = el.row_id)
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 27: orphan email_logs.row_id reference';
  END IF;

  RAISE NOTICE
    'S0-1 migration 27 integrity OK: % sheets, % rows, % sheet_assignments',
    sheet_count, row_count, sheet_assignment_count;
END $$;
