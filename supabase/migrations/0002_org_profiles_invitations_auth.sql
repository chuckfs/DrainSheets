-- G1 Phase: organizations, profiles, invitations, auth bootstrap

CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role public.org_role NOT NULL DEFAULT 'editor',
  status public.user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX profiles_org_id_idx ON public.profiles (org_id);
CREATE INDEX profiles_email_idx ON public.profiles (email);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.org_role NOT NULL DEFAULT 'editor',
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  invited_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX invitations_org_id_email_idx ON public.invitations (org_id, email);
CREATE INDEX invitations_token_hash_idx ON public.invitations (token_hash);

-- ---------------------------------------------------------------------------
-- Org-level helper functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.org_role_level(role public.org_role)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE role
    WHEN 'owner' THEN 3
    WHEN 'admin' THEN 2
    WHEN 'editor' THEN 1
  END;
$$;

CREATE OR REPLACE FUNCTION public.access_role_level(role public.access_role)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE role
    WHEN 'viewer' THEN 1
    WHEN 'commenter' THEN 2
    WHEN 'editor' THEN 3
    WHEN 'admin' THEN 4
    WHEN 'owner' THEN 5
  END;
$$;

CREATE OR REPLACE FUNCTION public.current_profile()
RETURNS public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.*
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(min_role public.org_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.status = 'active'
      AND public.org_role_level(p.role) >= public.org_role_level(min_role)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(check_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.org_id = check_org_id
      AND p.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id
  FROM public.profiles
  WHERE id = auth.uid()
    AND status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.default_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT '00000000-0000-0000-0000-000000000001'::UUID;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite RECORD;
  profile_count INTEGER;
  new_org_id UUID;
  new_role public.org_role;
  display_name TEXT;
BEGIN
  SELECT count(*) INTO profile_count FROM public.profiles;

  SELECT *
  INTO invite
  FROM public.invitations
  WHERE lower(email) = lower(NEW.email)
    AND accepted_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF invite.id IS NOT NULL THEN
    new_org_id := invite.org_id;
    new_role := invite.role;

    UPDATE public.invitations
    SET accepted_at = now()
    WHERE id = invite.id;
  ELSIF profile_count = 0 THEN
    new_org_id := public.default_organization_id();
    new_role := 'owner';
  ELSE
    RAISE EXCEPTION 'Registration is invite-only';
  END IF;

  display_name := coalesce(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, org_id, name, email, role, status)
  VALUES (NEW.id, new_org_id, display_name, NEW.email, new_role, 'active');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS (org layer)
-- ---------------------------------------------------------------------------

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY organizations_select ON public.organizations
  FOR SELECT TO authenticated
  USING (public.is_org_member(id));

CREATE POLICY organizations_update ON public.organizations
  FOR UPDATE TO authenticated
  USING (public.has_org_role('owner'))
  WITH CHECK (public.has_org_role('owner'));

CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_org_member(org_id));

CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_owner ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_org_role('owner') AND public.is_org_member(org_id))
  WITH CHECK (public.has_org_role('owner') AND public.is_org_member(org_id));

CREATE POLICY invitations_select ON public.invitations
  FOR SELECT TO authenticated
  USING (public.has_org_role('owner') AND public.is_org_member(org_id));

CREATE POLICY invitations_insert ON public.invitations
  FOR INSERT TO authenticated
  WITH CHECK (public.has_org_role('owner') AND public.is_org_member(org_id));

CREATE POLICY invitations_update ON public.invitations
  FOR UPDATE TO authenticated
  USING (public.has_org_role('owner') AND public.is_org_member(org_id))
  WITH CHECK (public.has_org_role('owner') AND public.is_org_member(org_id));

CREATE POLICY invitations_delete ON public.invitations
  FOR DELETE TO authenticated
  USING (public.has_org_role('owner') AND public.is_org_member(org_id));
