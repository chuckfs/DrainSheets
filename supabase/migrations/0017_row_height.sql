-- Row resize: optional per-row height in pixels (NULL = default 32px)

ALTER TABLE public.rows
  ADD COLUMN IF NOT EXISTS height INTEGER;

ALTER TABLE public.rows
  DROP CONSTRAINT IF EXISTS rows_height_range;

ALTER TABLE public.rows
  ADD CONSTRAINT rows_height_range
  CHECK (height IS NULL OR (height >= 24 AND height <= 400));
