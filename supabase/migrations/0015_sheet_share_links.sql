-- Shareable links: one link per sheet that grants a chosen role (viewer/
-- commenter/editor) to any org member who opens it. Redemption happens via a
-- server action using the service role; admins manage links under RLS here.

CREATE TABLE public.sheet_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES public.sheets (id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  role public.access_role NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sheet_id),
  CONSTRAINT sheet_share_links_role_check
    CHECK (role IN ('viewer'::public.access_role, 'commenter'::public.access_role, 'editor'::public.access_role))
);

CREATE INDEX sheet_share_links_token_idx ON public.sheet_share_links (token);
CREATE INDEX sheet_share_links_sheet_id_idx ON public.sheet_share_links (sheet_id);

CREATE TRIGGER sheet_share_links_set_updated_at
  BEFORE UPDATE ON public.sheet_share_links
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.sheet_share_links ENABLE ROW LEVEL SECURITY;

-- Only sheet admins create/view/manage links. Redemption by non-admins goes
-- through the service role in a server action, which validates org membership.
CREATE POLICY sheet_share_links_select ON public.sheet_share_links
  FOR SELECT TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND public.has_sheet_access(sheet_id, 'admin')
  );

CREATE POLICY sheet_share_links_insert ON public.sheet_share_links
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.has_sheet_access(sheet_id, 'admin')
  );

CREATE POLICY sheet_share_links_update ON public.sheet_share_links
  FOR UPDATE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND public.has_sheet_access(sheet_id, 'admin')
  )
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.has_sheet_access(sheet_id, 'admin')
  );

CREATE POLICY sheet_share_links_delete ON public.sheet_share_links
  FOR DELETE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND public.has_sheet_access(sheet_id, 'admin')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sheet_share_links TO authenticated;
GRANT ALL ON public.sheet_share_links TO service_role;
