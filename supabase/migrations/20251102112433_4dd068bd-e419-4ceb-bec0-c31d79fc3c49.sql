-- Add plan and limits to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro')),
ADD COLUMN IF NOT EXISTS max_portals integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_storage_gb integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS storage_used_bytes bigint NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '{"custom_branding": false, "automations": false, "integrations": false, "white_label": false, "priority_support": false}'::jsonb;

-- Create function to update plan limits based on plan type
CREATE OR REPLACE FUNCTION update_organization_plan_limits()
RETURNS TRIGGER AS $$
BEGIN
  -- Set limits based on plan
  IF NEW.plan = 'free' THEN
    NEW.max_portals := 1;
    NEW.max_storage_gb := 1;
    NEW.features := '{"custom_branding": false, "automations": false, "integrations": false, "white_label": false, "priority_support": false}'::jsonb;
  ELSIF NEW.plan = 'starter' THEN
    NEW.max_portals := 5;
    NEW.max_storage_gb := 3;
    NEW.features := '{"custom_branding": true, "automations": false, "integrations": false, "white_label": false, "priority_support": false}'::jsonb;
  ELSIF NEW.plan = 'pro' THEN
    NEW.max_portals := 999999; -- effectively unlimited
    NEW.max_storage_gb := 10;
    NEW.features := '{"custom_branding": true, "automations": true, "integrations": true, "white_label": true, "priority_support": true}'::jsonb;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update limits when plan changes
DROP TRIGGER IF EXISTS trigger_update_plan_limits ON organizations;
CREATE TRIGGER trigger_update_plan_limits
BEFORE INSERT OR UPDATE OF plan ON organizations
FOR EACH ROW
EXECUTE FUNCTION update_organization_plan_limits();

-- Update existing organizations to have proper limits
UPDATE organizations
SET plan = COALESCE(plan, 'free')
WHERE plan IS NULL;

-- Function to check if organization can create new client
CREATE OR REPLACE FUNCTION can_create_client(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM clients WHERE organization_id = org_id AND deleted_at IS NULL) < 
    (SELECT max_portals FROM organizations WHERE id = org_id)
$$;

-- Function to check storage limit
CREATE OR REPLACE FUNCTION can_upload_file(org_id uuid, file_size_bytes bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT storage_used_bytes + file_size_bytes FROM organizations WHERE id = org_id) <= 
    (SELECT max_storage_gb * 1073741824 FROM organizations WHERE id = org_id)
$$;

-- Function to update storage usage
CREATE OR REPLACE FUNCTION update_storage_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE organizations
    SET storage_used_bytes = storage_used_bytes + NEW.file_size
    WHERE id = NEW.organization_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE organizations
    SET storage_used_bytes = GREATEST(0, storage_used_bytes - OLD.file_size)
    WHERE id = OLD.organization_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add triggers to track storage usage
DROP TRIGGER IF EXISTS trigger_client_files_storage ON client_files;
CREATE TRIGGER trigger_client_files_storage
AFTER INSERT OR DELETE ON client_files
FOR EACH ROW
EXECUTE FUNCTION update_storage_usage();

DROP TRIGGER IF EXISTS trigger_submission_files_storage ON submission_files;
CREATE TRIGGER trigger_submission_files_storage
AFTER INSERT OR DELETE ON submission_files
FOR EACH ROW
EXECUTE FUNCTION update_storage_usage();

-- Update RLS policy to allow members to view plan info
CREATE POLICY "Members can update organization plan" 
ON organizations 
FOR UPDATE 
USING (is_organization_member(id, auth.uid()))
WITH CHECK (is_organization_member(id, auth.uid()));