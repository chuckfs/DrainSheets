-- P0-2: email audit log for Quick Update sends

CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  prospect_id UUID REFERENCES public.prospects(id) ON DELETE SET NULL,
  sent_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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
CREATE INDEX email_logs_property_id_idx ON public.email_logs (property_id);
CREATE INDEX email_logs_prospect_id_idx ON public.email_logs (prospect_id);
CREATE INDEX email_logs_sent_by_idx ON public.email_logs (sent_by);
CREATE INDEX email_logs_created_at_idx ON public.email_logs (created_at DESC);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_logs_select ON public.email_logs
  FOR SELECT TO authenticated
  USING (
    public.is_org_member(org_id)
    AND (
      property_id IS NULL
      OR public.can_access_property(property_id)
    )
  );

CREATE POLICY email_logs_insert ON public.email_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(org_id)
    AND sent_by = auth.uid()
    AND (
      property_id IS NULL
      OR public.can_access_property(property_id)
    )
  );
