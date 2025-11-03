-- Add Lemon Squeezy subscription fields to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS lemonsqueezy_customer_id TEXT,
ADD COLUMN IF NOT EXISTS lemonsqueezy_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_renewal_date TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_lemonsqueezy_subscription 
ON organizations(lemonsqueezy_subscription_id);

CREATE INDEX IF NOT EXISTS idx_organizations_lemonsqueezy_customer 
ON organizations(lemonsqueezy_customer_id);