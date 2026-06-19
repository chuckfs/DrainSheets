-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE public.user_role AS ENUM ('owner', 'admin', 'editor');
CREATE TYPE public.user_status AS ENUM ('active', 'invited', 'disabled');
CREATE TYPE public.property_status AS ENUM ('active', 'archived');
CREATE TYPE public.prospect_status AS ENUM (
  'researching',
  'contacted',
  'interested',
  'passed',
  'closed'
);

-- Shared updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
