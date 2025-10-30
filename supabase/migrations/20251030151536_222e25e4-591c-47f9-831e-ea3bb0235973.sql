-- Add missing columns to organizations table
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS is_personal BOOLEAN DEFAULT true;

-- Add missing columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update handle_new_user_and_organization to populate new fields
CREATE OR REPLACE FUNCTION public.handle_new_user_and_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_org_id UUID;
  new_slug TEXT;
BEGIN
  -- Generate a unique slug for the organization
  new_slug := lower(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(NEW.id::text, 1, 8);
  
  -- Create a personal organization for the new user
  INSERT INTO public.organizations (name, slug, is_personal)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email) || '''s Workspace',
    new_slug,
    true
  )
  RETURNING id INTO new_org_id;

  -- Insert into public.users (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO public.users (id, full_name, email, avatar_url, organization_id, last_seen_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    new_org_id,
    NOW()
  );

  -- Add user as owner of their organization
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  RETURN NEW;
END;
$function$;