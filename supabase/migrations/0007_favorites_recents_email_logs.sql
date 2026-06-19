-- G1 Phase: favorites, recent views, email logs

CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  target_type public.favorite_target_type NOT NULL,
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX favorites_user_id_idx ON public.favorites (user_id);
CREATE INDEX favorites_org_id_idx ON public.favorites (org_id);

CREATE TABLE public.recent_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  sheet_id UUID NOT NULL REFERENCES public.sheets (id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, sheet_id)
);

CREATE INDEX recent_views_user_id_viewed_at_idx
  ON public.recent_views (user_id, viewed_at DESC);
CREATE INDEX recent_views_sheet_id_idx ON public.recent_views (sheet_id);

CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  sheet_id UUID REFERENCES public.sheets (id) ON DELETE SET NULL,
  row_id UUID REFERENCES public.rows (id) ON DELETE SET NULL,
  sent_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  to_addresses TEXT[] NOT NULL,
  cc_addresses TEXT[] NOT NULL DEFAULT '{}',
  subject TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  included_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  attachment_ids UUID[] NOT NULL DEFAULT '{}',
  layout TEXT NOT NULL DEFAULT 'stacked',
  resend_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX email_logs_org_id_idx ON public.email_logs (org_id);
CREATE INDEX email_logs_sheet_id_idx ON public.email_logs (sheet_id);
CREATE INDEX email_logs_row_id_idx ON public.email_logs (row_id);
CREATE INDEX email_logs_sent_by_idx ON public.email_logs (sent_by);
CREATE INDEX email_logs_created_at_idx ON public.email_logs (created_at DESC);

CREATE OR REPLACE FUNCTION public.validate_favorite_target()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.target_type = 'workspace' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = NEW.target_id AND w.org_id = NEW.org_id
    ) THEN
      RAISE EXCEPTION 'favorite workspace target must exist in org';
    END IF;
  ELSIF NEW.target_type = 'folder' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.folders f
      WHERE f.id = NEW.target_id AND f.org_id = NEW.org_id
    ) THEN
      RAISE EXCEPTION 'favorite folder target must exist in org';
    END IF;
  ELSIF NEW.target_type = 'sheet' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.sheets s
      WHERE s.id = NEW.target_id AND s.org_id = NEW.org_id
    ) THEN
      RAISE EXCEPTION 'favorite sheet target must exist in org';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_email_log_row_sheet()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.row_id IS NOT NULL AND NEW.sheet_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.rows r
      WHERE r.id = NEW.row_id AND r.sheet_id = NEW.sheet_id
    ) THEN
      RAISE EXCEPTION 'email_logs.row_id must belong to email_logs.sheet_id';
    END IF;
  END IF;

  IF NEW.row_id IS NOT NULL AND NEW.sheet_id IS NULL THEN
    RAISE EXCEPTION 'email_logs.row_id requires sheet_id';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER favorites_validate_target
  BEFORE INSERT OR UPDATE ON public.favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_favorite_target();

CREATE TRIGGER email_logs_validate_row_sheet
  BEFORE INSERT OR UPDATE ON public.email_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_email_log_row_sheet();

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
