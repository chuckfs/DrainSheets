-- Enable RLS on all application tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;

-- organizations
CREATE POLICY organizations_select ON public.organizations
  FOR SELECT TO authenticated
  USING (public.is_org_member(id));

CREATE POLICY organizations_update ON public.organizations
  FOR UPDATE TO authenticated
  USING (public.has_role('owner'))
  WITH CHECK (public.has_role('owner'));

-- profiles
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_org_member(org_id));

CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_owner ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role('owner') AND public.is_org_member(org_id))
  WITH CHECK (public.has_role('owner') AND public.is_org_member(org_id));

-- properties
CREATE POLICY properties_select ON public.properties
  FOR SELECT TO authenticated
  USING (public.can_access_property(id));

CREATE POLICY properties_insert ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('admin')
    AND org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY properties_update ON public.properties
  FOR UPDATE TO authenticated
  USING (
    public.has_role('admin')
    OR (
      public.has_role('editor')
      AND public.can_access_property(id)
    )
  )
  WITH CHECK (
    public.has_role('admin')
    OR (
      public.has_role('editor')
      AND public.can_access_property(id)
    )
  );

-- prospects
CREATE POLICY prospects_select ON public.prospects
  FOR SELECT TO authenticated
  USING (public.can_access_property(property_id));

CREATE POLICY prospects_insert ON public.prospects
  FOR INSERT TO authenticated
  WITH CHECK (public.can_access_property(property_id));

CREATE POLICY prospects_update ON public.prospects
  FOR UPDATE TO authenticated
  USING (public.can_access_property(property_id))
  WITH CHECK (public.can_access_property(property_id));

-- contacts
CREATE POLICY contacts_select ON public.contacts
  FOR SELECT TO authenticated
  USING (public.can_access_property(public.property_id_for_contact(id)));

CREATE POLICY contacts_insert ON public.contacts
  FOR INSERT TO authenticated
  WITH CHECK (public.can_access_property(public.property_id_for_prospect(prospect_id)));

CREATE POLICY contacts_update ON public.contacts
  FOR UPDATE TO authenticated
  USING (public.can_access_property(public.property_id_for_contact(id)))
  WITH CHECK (public.can_access_property(public.property_id_for_prospect(prospect_id)));

-- documents
CREATE POLICY documents_select ON public.documents
  FOR SELECT TO authenticated
  USING (public.can_access_property(property_id));

CREATE POLICY documents_insert ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (public.can_access_property(property_id));

CREATE POLICY documents_delete ON public.documents
  FOR DELETE TO authenticated
  USING (
    public.can_access_property(property_id)
    AND (
      public.has_role('admin')
      OR uploaded_by = auth.uid()
    )
  );

-- notes
CREATE POLICY notes_select ON public.notes
  FOR SELECT TO authenticated
  USING (public.can_access_property(property_id));

CREATE POLICY notes_insert ON public.notes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.can_access_property(property_id)
    AND user_id = auth.uid()
  );

CREATE POLICY notes_update ON public.notes
  FOR UPDATE TO authenticated
  USING (
    public.can_access_property(property_id)
    AND (
      public.has_role('admin')
      OR user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.can_access_property(property_id)
    AND (
      public.has_role('admin')
      OR user_id = auth.uid()
    )
  );

CREATE POLICY notes_delete ON public.notes
  FOR DELETE TO authenticated
  USING (
    public.can_access_property(property_id)
    AND (
      public.has_role('admin')
      OR user_id = auth.uid()
    )
  );

-- property_assignments
CREATE POLICY property_assignments_select ON public.property_assignments
  FOR SELECT TO authenticated
  USING (public.has_role('admin'));

CREATE POLICY property_assignments_insert ON public.property_assignments
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role('owner'));

CREATE POLICY property_assignments_delete ON public.property_assignments
  FOR DELETE TO authenticated
  USING (public.has_role('owner'));

-- invitations
CREATE POLICY invitations_select ON public.invitations
  FOR SELECT TO authenticated
  USING (public.has_role('owner') AND public.is_org_member(org_id));

CREATE POLICY invitations_insert ON public.invitations
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role('owner') AND public.is_org_member(org_id));

CREATE POLICY invitations_update ON public.invitations
  FOR UPDATE TO authenticated
  USING (public.has_role('owner') AND public.is_org_member(org_id))
  WITH CHECK (public.has_role('owner') AND public.is_org_member(org_id));

CREATE POLICY invitations_delete ON public.invitations
  FOR DELETE TO authenticated
  USING (public.has_role('owner') AND public.is_org_member(org_id));

-- activity
CREATE POLICY activity_select ON public.activity
  FOR SELECT TO authenticated
  USING (
    public.is_org_member(org_id)
    AND (
      property_id IS NULL
      OR public.can_access_property(property_id)
      OR public.has_role('admin')
    )
  );

-- activity inserts are server-side only (service role bypasses RLS)
