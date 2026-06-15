INSERT INTO public.organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'A-Team Real Estate')
ON CONFLICT (id) DO NOTHING;
