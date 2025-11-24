-- Add per-user pricing structure to organizations table

-- Add new columns for per-user billing
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS price_per_user INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS active_user_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS storage_per_user_gb INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS automation_runs_per_user INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS automation_runs_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS esignature_runs_per_user INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS esignature_runs_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS branding_level TEXT DEFAULT 'full',
ADD COLUMN IF NOT EXISTS support_level TEXT DEFAULT 'standard';

-- Update existing organizations to use new pricing model
-- Set price_per_user based on current plan
UPDATE organizations
SET 
  price_per_user = CASE 
    WHEN plan = 'free' THEN 0
    WHEN plan = 'starter' THEN 2900  -- $29 in cents
    WHEN plan = 'pro' THEN 4900      -- $49 in cents
    ELSE 0
  END,
  storage_per_user_gb = CASE 
    WHEN plan = 'free' THEN 1
    WHEN plan = 'starter' THEN 10
    WHEN plan = 'pro' THEN 100
    ELSE 1
  END,
  automation_runs_per_user = CASE 
    WHEN plan = 'free' THEN 0
    WHEN plan = 'starter' THEN 25
    WHEN plan = 'pro' THEN 500
    ELSE 0
  END,
  esignature_runs_per_user = CASE 
    WHEN plan = 'free' THEN 0
    WHEN plan = 'starter' THEN 10
    WHEN plan = 'pro' THEN 100
    ELSE 0
  END,
  branding_level = CASE 
    WHEN plan = 'free' THEN 'full'
    WHEN plan = 'starter' THEN 'standard'
    WHEN plan = 'pro' THEN 'custom'
    ELSE 'full'
  END,
  support_level = CASE 
    WHEN plan = 'free' THEN 'standard'
    WHEN plan = 'starter' THEN 'standard'
    WHEN plan = 'pro' THEN 'priority'
    ELSE 'standard'
  END,
  active_user_count = (
    SELECT COUNT(*) FROM organization_members 
    WHERE organization_members.organization_id = organizations.id
  );

-- Add enterprise plan to enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'plan_type' 
    AND e.enumlabel = 'enterprise'
  ) THEN
    ALTER TYPE plan_type ADD VALUE 'enterprise';
  END IF;
END $$;

-- Update max_portals and max_storage_gb to be unlimited for all plans
UPDATE organizations
SET 
  max_portals = 999999,
  max_storage_gb = CASE 
    WHEN plan = 'free' THEN active_user_count * 1
    WHEN plan = 'starter' THEN active_user_count * 10
    WHEN plan = 'pro' THEN active_user_count * 100
    WHEN plan = 'enterprise' THEN active_user_count * 1000
    ELSE active_user_count * 1
  END;

-- Create function to calculate monthly cost
CREATE OR REPLACE FUNCTION calculate_monthly_cost(org_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  monthly_cost INTEGER;
BEGIN
  SELECT (active_user_count * price_per_user) INTO monthly_cost
  FROM organizations
  WHERE id = org_id;
  
  RETURN monthly_cost;
END;
$$;

-- Create function to update active user count
CREATE OR REPLACE FUNCTION update_active_user_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE organizations
    SET active_user_count = (
      SELECT COUNT(*) FROM organization_members 
      WHERE organization_id = NEW.organization_id
    ),
    max_storage_gb = CASE 
      WHEN plan = 'free' THEN active_user_count * 1
      WHEN plan = 'starter' THEN active_user_count * 10
      WHEN plan = 'pro' THEN active_user_count * 100
      WHEN plan = 'enterprise' THEN active_user_count * 1000
      ELSE active_user_count * 1
    END
    WHERE id = NEW.organization_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE organizations
    SET active_user_count = (
      SELECT COUNT(*) FROM organization_members 
      WHERE organization_id = OLD.organization_id
    ),
    max_storage_gb = CASE 
      WHEN plan = 'free' THEN active_user_count * 1
      WHEN plan = 'starter' THEN active_user_count * 10
      WHEN plan = 'pro' THEN active_user_count * 100
      WHEN plan = 'enterprise' THEN active_user_count * 1000
      ELSE active_user_count * 1
    END
    WHERE id = OLD.organization_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to update active user count when members are added/removed
DROP TRIGGER IF EXISTS update_active_user_count_trigger ON organization_members;
CREATE TRIGGER update_active_user_count_trigger
AFTER INSERT OR DELETE ON organization_members
FOR EACH ROW
EXECUTE FUNCTION update_active_user_count();

-- Update plan limits function to reflect per-user pricing
CREATE OR REPLACE FUNCTION update_organization_plan_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set limits based on plan (per-user)
  IF NEW.plan = 'free' THEN
    NEW.price_per_user := 0;
    NEW.storage_per_user_gb := 1;
    NEW.automation_runs_per_user := 0;
    NEW.esignature_runs_per_user := 0;
    NEW.branding_level := 'full';
    NEW.support_level := 'standard';
    NEW.features := '{"custom_branding": false, "automations": false, "integrations": false, "white_label": false, "priority_support": false}'::jsonb;
  ELSIF NEW.plan = 'starter' THEN
    NEW.price_per_user := 2900;
    NEW.storage_per_user_gb := 10;
    NEW.automation_runs_per_user := 25;
    NEW.esignature_runs_per_user := 10;
    NEW.branding_level := 'standard';
    NEW.support_level := 'standard';
    NEW.features := '{"custom_branding": true, "automations": true, "integrations": false, "white_label": false, "priority_support": false}'::jsonb;
  ELSIF NEW.plan = 'pro' THEN
    NEW.price_per_user := 4900;
    NEW.storage_per_user_gb := 100;
    NEW.automation_runs_per_user := 500;
    NEW.esignature_runs_per_user := 100;
    NEW.branding_level := 'custom';
    NEW.support_level := 'priority';
    NEW.features := '{"custom_branding": true, "automations": true, "integrations": true, "white_label": true, "priority_support": true}'::jsonb;
  ELSIF NEW.plan = 'enterprise' THEN
    NEW.price_per_user := 19900;
    NEW.storage_per_user_gb := 1000;
    NEW.automation_runs_per_user := 999999;
    NEW.esignature_runs_per_user := 999999;
    NEW.branding_level := 'none';
    NEW.support_level := 'dedicated';
    NEW.features := '{"custom_branding": true, "automations": true, "integrations": true, "white_label": true, "priority_support": true, "sla": true, "dedicated_support": true}'::jsonb;
  END IF;
  
  -- Calculate total storage based on active users
  NEW.max_storage_gb := NEW.active_user_count * NEW.storage_per_user_gb;
  NEW.max_portals := 999999;
  
  RETURN NEW;
END;
$$;