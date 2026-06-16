-- Minimal bootstrap for local development (first-user signup).
INSERT INTO public.organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Default Organization')
ON CONFLICT (id) DO NOTHING;
