-- G1 Phase: unified shares

CREATE TABLE public.shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  grantee_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  resource_type public.share_resource_type NOT NULL,
  resource_id UUID NOT NULL,
  role public.access_role NOT NULL,
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (grantee_id, resource_type, resource_id)
);

CREATE INDEX shares_grantee_resource_idx
  ON public.shares (grantee_id, resource_type, resource_id);
CREATE INDEX shares_resource_lookup_idx
  ON public.shares (resource_type, resource_id, grantee_id);
CREATE INDEX shares_org_id_idx ON public.shares (org_id);

CREATE OR REPLACE FUNCTION public.validate_share_resource()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  grantee_org_id UUID;
  resource_org_id UUID;
BEGIN
  IF NEW.role = 'owner'::public.access_role THEN
    RAISE EXCEPTION 'shares.role cannot be owner; org ownership is separate from content shares';
  END IF;

  SELECT p.org_id
  INTO grantee_org_id
  FROM public.profiles p
  WHERE p.id = NEW.grantee_id;

  IF grantee_org_id IS NULL THEN
    RAISE EXCEPTION 'grantee_id must reference an existing profile';
  END IF;

  IF grantee_org_id IS DISTINCT FROM NEW.org_id THEN
    RAISE EXCEPTION 'grantee must belong to share org_id';
  END IF;

  IF NEW.grantee_id = NEW.created_by AND NEW.created_by IS NOT NULL THEN
    -- self-share allowed only if product needs it; blueprint recommends reject
    NULL;
  END IF;

  IF NEW.resource_type = 'workspace' THEN
    SELECT w.org_id INTO resource_org_id
    FROM public.workspaces w WHERE w.id = NEW.resource_id;
  ELSIF NEW.resource_type = 'folder' THEN
    SELECT f.org_id INTO resource_org_id
    FROM public.folders f WHERE f.id = NEW.resource_id;
  ELSIF NEW.resource_type = 'sheet' THEN
    SELECT s.org_id INTO resource_org_id
    FROM public.sheets s WHERE s.id = NEW.resource_id;
  END IF;

  IF resource_org_id IS NULL THEN
    RAISE EXCEPTION 'share resource_id must reference an existing %', NEW.resource_type;
  END IF;

  IF resource_org_id IS DISTINCT FROM NEW.org_id THEN
    RAISE EXCEPTION 'share resource must belong to share org_id';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER shares_validate_resource
  BEFORE INSERT OR UPDATE ON public.shares
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_share_resource();

ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;
