CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  description TEXT,
  status public.property_status NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties (id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  category TEXT,
  website TEXT,
  status public.prospect_status,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX properties_org_id_status_idx ON public.properties (org_id, status);
CREATE INDEX properties_org_id_name_idx ON public.properties (org_id, name);
CREATE INDEX properties_city_idx ON public.properties (city);
CREATE INDEX properties_state_idx ON public.properties (state);

CREATE INDEX prospects_property_id_idx ON public.prospects (property_id);
CREATE INDEX prospects_company_name_idx ON public.prospects (company_name);

CREATE TRIGGER properties_set_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER prospects_set_updated_at
  BEFORE UPDATE ON public.prospects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
