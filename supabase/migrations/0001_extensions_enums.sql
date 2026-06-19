-- G1 Phase: native baseline — extensions and enums

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE public.org_role AS ENUM ('owner', 'admin', 'editor');
CREATE TYPE public.user_status AS ENUM ('active', 'invited', 'disabled');
CREATE TYPE public.access_role AS ENUM ('viewer', 'commenter', 'editor', 'admin', 'owner');
CREATE TYPE public.column_type AS ENUM (
  'text',
  'long_text',
  'number',
  'currency',
  'date',
  'url',
  'email',
  'phone',
  'select',
  'checkbox',
  'contact'
);
CREATE TYPE public.sheet_status AS ENUM ('active', 'archived');
CREATE TYPE public.share_resource_type AS ENUM ('workspace', 'folder', 'sheet');
CREATE TYPE public.favorite_target_type AS ENUM ('workspace', 'folder', 'sheet');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
