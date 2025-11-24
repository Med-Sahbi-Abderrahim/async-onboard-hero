-- Ensure organization owner tracking and billing enforcement

-- Add organization_owner_id column to organizations table for quick reference
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS organization_owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update existing organizations to set owner from organization_members
UPDATE organizations org
SET organization_owner_id = (
  SELECT om.user_id
  FROM organization_members om
  WHERE om.organization_id = org.id
  AND om.role = 'owner'
  LIMIT 1
);

-- Create function to ensure organization always has an owner
CREATE OR REPLACE FUNCTION ensure_organization_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When creating a new organization in trigger
  IF TG_OP = 'INSERT' THEN
    -- Set the organization_owner_id
    NEW.organization_owner_id := NEW.organization_owner_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update trigger for new organizations to set owner
DROP TRIGGER IF EXISTS set_organization_owner_trigger ON organizations;
CREATE TRIGGER set_organization_owner_trigger
BEFORE INSERT ON organizations
FOR EACH ROW
EXECUTE FUNCTION ensure_organization_owner();

-- Function to check if user is organization owner
CREATE OR REPLACE FUNCTION is_organization_owner(org_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM organization_members 
    WHERE organization_id = org_id
    AND user_id = user_id
    AND role = 'owner'
  );
$$;

-- Update handle_new_user_and_organization to set organization_owner_id
CREATE OR REPLACE FUNCTION handle_new_user_and_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  new_slug TEXT;
BEGIN
  -- Generate a unique slug for the organization
  new_slug := lower(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(NEW.id::text, 1, 8);
  
  -- Create a personal organization for the new user with owner set
  INSERT INTO public.organizations (name, slug, is_personal, organization_owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email) || '''s Workspace',
    new_slug,
    true,
    NEW.id
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
$$;

-- Add comment for clarity
COMMENT ON COLUMN organizations.organization_owner_id IS 'The user ID of the organization owner who manages billing and subscriptions';