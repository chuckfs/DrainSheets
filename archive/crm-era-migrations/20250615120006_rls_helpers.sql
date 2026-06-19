-- Role hierarchy: owner (3) > admin (2) > editor (1)
CREATE OR REPLACE FUNCTION public.role_level(role public.user_role)
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

CREATE OR REPLACE FUNCTION public.has_role(min_role public.user_role)
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
      AND public.role_level(p.role) >= public.role_level(min_role)
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

CREATE OR REPLACE FUNCTION public.can_access_property(check_property_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.properties pr
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE pr.id = check_property_id
      AND pr.org_id = p.org_id
      AND p.status = 'active'
      AND (
        public.role_level(p.role) >= public.role_level('admin'::public.user_role)
        OR EXISTS (
          SELECT 1
          FROM public.property_assignments pa
          WHERE pa.property_id = pr.id
            AND pa.user_id = p.id
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.property_id_for_prospect(check_prospect_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT property_id
  FROM public.prospects
  WHERE id = check_prospect_id;
$$;

CREATE OR REPLACE FUNCTION public.property_id_for_contact(check_contact_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.property_id
  FROM public.contacts c
  JOIN public.prospects p ON p.id = c.prospect_id
  WHERE c.id = check_contact_id;
$$;
