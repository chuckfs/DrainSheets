-- G1 Phase: workspaces and nestable folders

CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX workspaces_org_id_name_idx ON public.workspaces (org_id, name);

CREATE TRIGGER workspaces_set_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  workspace_id UUID NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES public.folders (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX folders_workspace_parent_position_idx
  ON public.folders (workspace_id, parent_folder_id, position);
CREATE INDEX folders_org_id_idx ON public.folders (org_id);
CREATE INDEX folders_parent_folder_id_idx ON public.folders (parent_folder_id);

CREATE TRIGGER folders_set_updated_at
  BEFORE UPDATE ON public.folders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.validate_folder_hierarchy()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  parent_workspace_id UUID;
  cycle_id UUID;
  depth INTEGER;
BEGIN
  IF NEW.parent_folder_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.parent_folder_id = NEW.id THEN
    RAISE EXCEPTION 'folder cannot be its own parent';
  END IF;

  SELECT f.workspace_id
  INTO parent_workspace_id
  FROM public.folders f
  WHERE f.id = NEW.parent_folder_id;

  IF parent_workspace_id IS NULL THEN
    RAISE EXCEPTION 'parent_folder_id must reference an existing folder';
  END IF;

  IF parent_workspace_id IS DISTINCT FROM NEW.workspace_id THEN
    RAISE EXCEPTION 'parent folder must belong to the same workspace';
  END IF;

  WITH RECURSIVE chain AS (
    SELECT f.id, f.parent_folder_id, 1 AS depth
    FROM public.folders f
    WHERE f.id = NEW.parent_folder_id

    UNION ALL

    SELECT f.id, f.parent_folder_id, c.depth + 1
    FROM public.folders f
    JOIN chain c ON f.id = c.parent_folder_id
    WHERE c.depth < 8
  )
  SELECT c.id, max(c.depth)
  INTO cycle_id, depth
  FROM chain c
  WHERE c.id = NEW.id
  GROUP BY c.id;

  IF cycle_id IS NOT NULL THEN
    RAISE EXCEPTION 'folder hierarchy would create a cycle';
  END IF;

  WITH RECURSIVE chain AS (
    SELECT f.id, f.parent_folder_id, 1 AS depth
    FROM public.folders f
    WHERE f.id = NEW.parent_folder_id

    UNION ALL

    SELECT f.id, f.parent_folder_id, c.depth + 1
    FROM public.folders f
    JOIN chain c ON f.id = c.parent_folder_id
    WHERE c.depth < 8
  )
  SELECT coalesce(max(depth), 0) + 1
  INTO depth
  FROM chain;

  IF depth > 8 THEN
    RAISE EXCEPTION 'folder hierarchy exceeds maximum depth of 8';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER folders_validate_hierarchy
  BEFORE INSERT OR UPDATE ON public.folders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_folder_hierarchy();

-- Default workspace for new users (replaces handle_new_user from 0002)
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

  INSERT INTO public.workspaces (org_id, name, created_by)
  VALUES (new_org_id, 'My Workspace', NEW.id);

  RETURN NEW;
END;
$$;

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
