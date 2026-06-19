-- S0-1 Migration 25: re-point dependents to sheets/rows (Expand phase)
-- Authoritative spec: S0-1_SHEET_ENGINE_DESIGN.md §2.5, §3.2, §8
-- Legacy property_id / prospect_id columns are retained until contract phase.

-- ---------------------------------------------------------------------------
-- 1. Add sheet_id / row_id columns to dependent tables
-- ---------------------------------------------------------------------------

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS sheet_id UUID,
  ADD COLUMN IF NOT EXISTS row_id UUID;

ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS sheet_id UUID,
  ADD COLUMN IF NOT EXISTS row_id UUID;

ALTER TABLE public.activity
  ADD COLUMN IF NOT EXISTS sheet_id UUID;

ALTER TABLE public.favorites
  ADD COLUMN IF NOT EXISTS sheet_id UUID;

ALTER TABLE public.recent_views
  ADD COLUMN IF NOT EXISTS sheet_id UUID;

ALTER TABLE public.email_logs
  ADD COLUMN IF NOT EXISTS sheet_id UUID,
  ADD COLUMN IF NOT EXISTS row_id UUID;

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS row_id UUID;

-- ---------------------------------------------------------------------------
-- 2. sheet_assignments (mirrors property_assignments)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.sheet_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sheet_id, user_id)
);

-- ---------------------------------------------------------------------------
-- 3. Backfill new columns (ID preservation: sheet_id = property_id, row_id = prospect_id)
-- ---------------------------------------------------------------------------

UPDATE public.documents
SET
  sheet_id = property_id,
  row_id = prospect_id
WHERE sheet_id IS DISTINCT FROM property_id
   OR row_id IS DISTINCT FROM prospect_id;

UPDATE public.notes
SET
  sheet_id = property_id,
  row_id = prospect_id
WHERE sheet_id IS DISTINCT FROM property_id
   OR row_id IS DISTINCT FROM prospect_id;

UPDATE public.activity
SET sheet_id = property_id
WHERE property_id IS NOT NULL
  AND sheet_id IS DISTINCT FROM property_id;

UPDATE public.favorites
SET sheet_id = property_id
WHERE sheet_id IS DISTINCT FROM property_id;

UPDATE public.recent_views
SET sheet_id = property_id
WHERE sheet_id IS DISTINCT FROM property_id;

UPDATE public.email_logs
SET
  sheet_id = property_id,
  row_id = prospect_id
WHERE sheet_id IS DISTINCT FROM property_id
   OR row_id IS DISTINCT FROM prospect_id;

UPDATE public.contacts
SET row_id = prospect_id
WHERE row_id IS DISTINCT FROM prospect_id;

INSERT INTO public.sheet_assignments (id, sheet_id, user_id, assigned_at)
SELECT
  pa.id,
  pa.property_id,
  pa.user_id,
  pa.created_at
FROM public.property_assignments pa
ON CONFLICT (sheet_id, user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Foreign keys and NOT NULL (where legacy columns require them)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'documents_sheet_id_fkey'
  ) THEN
    ALTER TABLE public.documents
      ADD CONSTRAINT documents_sheet_id_fkey
      FOREIGN KEY (sheet_id) REFERENCES public.sheets (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'documents_row_id_fkey'
  ) THEN
    ALTER TABLE public.documents
      ADD CONSTRAINT documents_row_id_fkey
      FOREIGN KEY (row_id) REFERENCES public.rows (id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notes_sheet_id_fkey'
  ) THEN
    ALTER TABLE public.notes
      ADD CONSTRAINT notes_sheet_id_fkey
      FOREIGN KEY (sheet_id) REFERENCES public.sheets (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notes_row_id_fkey'
  ) THEN
    ALTER TABLE public.notes
      ADD CONSTRAINT notes_row_id_fkey
      FOREIGN KEY (row_id) REFERENCES public.rows (id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activity_sheet_id_fkey'
  ) THEN
    ALTER TABLE public.activity
      ADD CONSTRAINT activity_sheet_id_fkey
      FOREIGN KEY (sheet_id) REFERENCES public.sheets (id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'favorites_sheet_id_fkey'
  ) THEN
    ALTER TABLE public.favorites
      ADD CONSTRAINT favorites_sheet_id_fkey
      FOREIGN KEY (sheet_id) REFERENCES public.sheets (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recent_views_sheet_id_fkey'
  ) THEN
    ALTER TABLE public.recent_views
      ADD CONSTRAINT recent_views_sheet_id_fkey
      FOREIGN KEY (sheet_id) REFERENCES public.sheets (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_logs_sheet_id_fkey'
  ) THEN
    ALTER TABLE public.email_logs
      ADD CONSTRAINT email_logs_sheet_id_fkey
      FOREIGN KEY (sheet_id) REFERENCES public.sheets (id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_logs_row_id_fkey'
  ) THEN
    ALTER TABLE public.email_logs
      ADD CONSTRAINT email_logs_row_id_fkey
      FOREIGN KEY (row_id) REFERENCES public.rows (id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contacts_row_id_fkey'
  ) THEN
    ALTER TABLE public.contacts
      ADD CONSTRAINT contacts_row_id_fkey
      FOREIGN KEY (row_id) REFERENCES public.rows (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sheet_assignments_sheet_id_fkey'
  ) THEN
    ALTER TABLE public.sheet_assignments
      ADD CONSTRAINT sheet_assignments_sheet_id_fkey
      FOREIGN KEY (sheet_id) REFERENCES public.sheets (id) ON DELETE CASCADE;
  END IF;
END $$;

-- NOT NULL on required dependents (only when legacy column is NOT NULL and backfilled)
ALTER TABLE public.documents
  ALTER COLUMN sheet_id SET NOT NULL;

ALTER TABLE public.notes
  ALTER COLUMN sheet_id SET NOT NULL;

ALTER TABLE public.favorites
  ALTER COLUMN sheet_id SET NOT NULL;

ALTER TABLE public.recent_views
  ALTER COLUMN sheet_id SET NOT NULL;

ALTER TABLE public.contacts
  ALTER COLUMN row_id SET NOT NULL;

-- ---------------------------------------------------------------------------
-- 5. Indexes and uniqueness for cutover
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS documents_sheet_id_idx ON public.documents (sheet_id);
CREATE INDEX IF NOT EXISTS documents_row_id_idx ON public.documents (row_id);

CREATE INDEX IF NOT EXISTS notes_sheet_id_idx ON public.notes (sheet_id);
CREATE INDEX IF NOT EXISTS notes_row_id_idx ON public.notes (row_id);

CREATE INDEX IF NOT EXISTS activity_sheet_id_idx ON public.activity (sheet_id);

CREATE INDEX IF NOT EXISTS favorites_sheet_id_idx ON public.favorites (sheet_id);
CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_sheet_idx
  ON public.favorites (user_id, sheet_id);

CREATE INDEX IF NOT EXISTS recent_views_sheet_id_idx ON public.recent_views (sheet_id);
CREATE UNIQUE INDEX IF NOT EXISTS recent_views_user_sheet_idx
  ON public.recent_views (user_id, sheet_id);

CREATE INDEX IF NOT EXISTS email_logs_sheet_id_idx ON public.email_logs (sheet_id);
CREATE INDEX IF NOT EXISTS email_logs_row_id_idx ON public.email_logs (row_id);

CREATE INDEX IF NOT EXISTS contacts_row_id_idx ON public.contacts (row_id);

CREATE INDEX IF NOT EXISTS sheet_assignments_sheet_id_idx
  ON public.sheet_assignments (sheet_id);
CREATE INDEX IF NOT EXISTS sheet_assignments_user_id_idx
  ON public.sheet_assignments (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS sheet_assignments_user_sheet_idx
  ON public.sheet_assignments (user_id, sheet_id);

-- ---------------------------------------------------------------------------
-- 5b. Expand-phase sync triggers (legacy columns drive sheet/row IDs)
--     Keeps backward compatibility while app still writes property_id/prospect_id.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_document_sheet_row_ids()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.sheet_id := NEW.property_id;
  NEW.row_id := NEW.prospect_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_note_sheet_row_ids()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.sheet_id := NEW.property_id;
  NEW.row_id := NEW.prospect_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_activity_sheet_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.sheet_id := NEW.property_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_favorite_sheet_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.sheet_id := NEW.property_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_recent_view_sheet_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.sheet_id := NEW.property_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_email_log_sheet_row_ids()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.sheet_id := NEW.property_id;
  NEW.row_id := NEW.prospect_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_contact_row_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.row_id := NEW.prospect_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_sheet_assignment_from_property()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.sheets s WHERE s.id = NEW.property_id) THEN
    INSERT INTO public.sheet_assignments (id, sheet_id, user_id, assigned_at)
    VALUES (NEW.id, NEW.property_id, NEW.user_id, NEW.created_at)
    ON CONFLICT (sheet_id, user_id) DO UPDATE
      SET assigned_at = EXCLUDED.assigned_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS documents_sync_sheet_row_ids ON public.documents;
CREATE TRIGGER documents_sync_sheet_row_ids
  BEFORE INSERT OR UPDATE OF property_id, prospect_id ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_document_sheet_row_ids();

DROP TRIGGER IF EXISTS notes_sync_sheet_row_ids ON public.notes;
CREATE TRIGGER notes_sync_sheet_row_ids
  BEFORE INSERT OR UPDATE OF property_id, prospect_id ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_note_sheet_row_ids();

DROP TRIGGER IF EXISTS activity_sync_sheet_id ON public.activity;
CREATE TRIGGER activity_sync_sheet_id
  BEFORE INSERT OR UPDATE OF property_id ON public.activity
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_activity_sheet_id();

DROP TRIGGER IF EXISTS favorites_sync_sheet_id ON public.favorites;
CREATE TRIGGER favorites_sync_sheet_id
  BEFORE INSERT OR UPDATE OF property_id ON public.favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_favorite_sheet_id();

DROP TRIGGER IF EXISTS recent_views_sync_sheet_id ON public.recent_views;
CREATE TRIGGER recent_views_sync_sheet_id
  BEFORE INSERT OR UPDATE OF property_id ON public.recent_views
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_recent_view_sheet_id();

DROP TRIGGER IF EXISTS email_logs_sync_sheet_row_ids ON public.email_logs;
CREATE TRIGGER email_logs_sync_sheet_row_ids
  BEFORE INSERT OR UPDATE OF property_id, prospect_id ON public.email_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_email_log_sheet_row_ids();

DROP TRIGGER IF EXISTS contacts_sync_row_id ON public.contacts;
CREATE TRIGGER contacts_sync_row_id
  BEFORE INSERT OR UPDATE OF prospect_id ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_contact_row_id();

DROP TRIGGER IF EXISTS property_assignments_sync_sheet_assignment ON public.property_assignments;
CREATE TRIGGER property_assignments_sync_sheet_assignment
  AFTER INSERT OR UPDATE ON public.property_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_sheet_assignment_from_property();

-- ---------------------------------------------------------------------------
-- 6. Post-backfill validation
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  property_assignment_count INTEGER;
  sheet_assignment_count INTEGER;
  mismatch_count INTEGER;
BEGIN
  -- documents
  SELECT count(*) INTO mismatch_count
  FROM public.documents d
  WHERE d.sheet_id IS DISTINCT FROM d.property_id
     OR d.row_id IS DISTINCT FROM d.prospect_id;

  IF mismatch_count > 0 THEN
    RAISE EXCEPTION
      'S0-1 migration 25: % documents have sheet_id/row_id mismatch',
      mismatch_count;
  END IF;

  -- notes
  SELECT count(*) INTO mismatch_count
  FROM public.notes n
  WHERE n.sheet_id IS DISTINCT FROM n.property_id
     OR n.row_id IS DISTINCT FROM n.prospect_id;

  IF mismatch_count > 0 THEN
    RAISE EXCEPTION
      'S0-1 migration 25: % notes have sheet_id/row_id mismatch',
      mismatch_count;
  END IF;

  -- activity (nullable property_id)
  SELECT count(*) INTO mismatch_count
  FROM public.activity a
  WHERE a.property_id IS NOT NULL
    AND a.sheet_id IS DISTINCT FROM a.property_id;

  IF mismatch_count > 0 THEN
    RAISE EXCEPTION
      'S0-1 migration 25: % activity rows have sheet_id mismatch',
      mismatch_count;
  END IF;

  SELECT count(*) INTO mismatch_count
  FROM public.activity a
  WHERE a.property_id IS NULL
    AND a.sheet_id IS NOT NULL;

  IF mismatch_count > 0 THEN
    RAISE EXCEPTION
      'S0-1 migration 25: % activity rows have sheet_id without property_id',
      mismatch_count;
  END IF;

  -- favorites
  SELECT count(*) INTO mismatch_count
  FROM public.favorites f
  WHERE f.sheet_id IS DISTINCT FROM f.property_id;

  IF mismatch_count > 0 THEN
    RAISE EXCEPTION
      'S0-1 migration 25: % favorites have sheet_id mismatch',
      mismatch_count;
  END IF;

  -- recent_views
  SELECT count(*) INTO mismatch_count
  FROM public.recent_views rv
  WHERE rv.sheet_id IS DISTINCT FROM rv.property_id;

  IF mismatch_count > 0 THEN
    RAISE EXCEPTION
      'S0-1 migration 25: % recent_views have sheet_id mismatch',
      mismatch_count;
  END IF;

  -- email_logs
  SELECT count(*) INTO mismatch_count
  FROM public.email_logs el
  WHERE el.sheet_id IS DISTINCT FROM el.property_id
     OR el.row_id IS DISTINCT FROM el.prospect_id;

  IF mismatch_count > 0 THEN
    RAISE EXCEPTION
      'S0-1 migration 25: % email_logs have sheet_id/row_id mismatch',
      mismatch_count;
  END IF;

  -- contacts
  SELECT count(*) INTO mismatch_count
  FROM public.contacts c
  WHERE c.row_id IS DISTINCT FROM c.prospect_id;

  IF mismatch_count > 0 THEN
    RAISE EXCEPTION
      'S0-1 migration 25: % contacts have row_id != prospect_id',
      mismatch_count;
  END IF;

  -- sheet_assignments parity
  SELECT count(*) INTO property_assignment_count FROM public.property_assignments;
  SELECT count(*) INTO sheet_assignment_count FROM public.sheet_assignments;

  IF sheet_assignment_count <> property_assignment_count THEN
    RAISE EXCEPTION
      'S0-1 migration 25: sheet_assignments count (%) != property_assignments count (%)',
      sheet_assignment_count, property_assignment_count;
  END IF;

  -- orphan sheet_id references
  IF EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.sheet_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.sheets s WHERE s.id = d.sheet_id)
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 25: orphan documents.sheet_id detected';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.notes n
    WHERE n.sheet_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.sheets s WHERE s.id = n.sheet_id)
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 25: orphan notes.sheet_id detected';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.favorites f
    WHERE NOT EXISTS (SELECT 1 FROM public.sheets s WHERE s.id = f.sheet_id)
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 25: orphan favorites.sheet_id detected';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.recent_views rv
    WHERE NOT EXISTS (SELECT 1 FROM public.sheets s WHERE s.id = rv.sheet_id)
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 25: orphan recent_views.sheet_id detected';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.sheet_assignments sa
    WHERE NOT EXISTS (SELECT 1 FROM public.sheets s WHERE s.id = sa.sheet_id)
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 25: orphan sheet_assignments.sheet_id detected';
  END IF;

  -- orphan row_id references
  IF EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.row_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.rows r WHERE r.id = d.row_id)
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 25: orphan documents.row_id detected';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.notes n
    WHERE n.row_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.rows r WHERE r.id = n.row_id)
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 25: orphan notes.row_id detected';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.contacts c
    WHERE NOT EXISTS (SELECT 1 FROM public.rows r WHERE r.id = c.row_id)
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 25: orphan contacts.row_id detected';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.email_logs el
    WHERE el.row_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.rows r WHERE r.id = el.row_id)
  ) THEN
    RAISE EXCEPTION 'S0-1 migration 25: orphan email_logs.row_id detected';
  END IF;

  -- row_id must belong to the same sheet when both document/note scopes are set
  IF EXISTS (
    SELECT 1
    FROM public.documents d
    JOIN public.rows r ON r.id = d.row_id
    WHERE d.row_id IS NOT NULL
      AND r.sheet_id IS DISTINCT FROM d.sheet_id
  ) THEN
    RAISE EXCEPTION
      'S0-1 migration 25: document row_id does not belong to sheet_id';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.notes n
    JOIN public.rows r ON r.id = n.row_id
    WHERE n.row_id IS NOT NULL
      AND r.sheet_id IS DISTINCT FROM n.sheet_id
  ) THEN
    RAISE EXCEPTION
      'S0-1 migration 25: note row_id does not belong to sheet_id';
  END IF;

  RAISE NOTICE
    'S0-1 migration 25 repoint OK: % sheet_assignments, dependents backfilled',
    sheet_assignment_count;
END $$;
