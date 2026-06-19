-- Bootstrap org id used in seed.sql
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
  new_role public.user_role;
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
    -- First user becomes owner of the default organization
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
