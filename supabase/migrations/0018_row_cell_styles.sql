-- P4-4: per-cell formatting stored as columnKey -> style map on each row

ALTER TABLE public.rows
  ADD COLUMN IF NOT EXISTS styles JSONB NOT NULL DEFAULT '{}'::jsonb;
