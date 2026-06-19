-- P0-3: server-backed favorites and recent property views

CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);

CREATE TABLE public.recent_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);

CREATE INDEX favorites_user_id_idx ON public.favorites (user_id);
CREATE INDEX favorites_property_id_idx ON public.favorites (property_id);
CREATE INDEX recent_views_user_id_viewed_at_idx ON public.recent_views (user_id, viewed_at DESC);
CREATE INDEX recent_views_property_id_idx ON public.recent_views (property_id);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY favorites_select ON public.favorites
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    AND public.can_access_property(property_id)
  );

CREATE POLICY favorites_insert ON public.favorites
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.can_access_property(property_id)
  );

CREATE POLICY favorites_delete ON public.favorites
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY recent_views_select ON public.recent_views
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    AND public.can_access_property(property_id)
  );

CREATE POLICY recent_views_insert ON public.recent_views
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.can_access_property(property_id)
  );

CREATE POLICY recent_views_update ON public.recent_views
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND public.can_access_property(property_id)
  );

CREATE POLICY recent_views_delete ON public.recent_views
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
