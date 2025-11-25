-- Add email and full_name to organization_members for pending invites
-- This allows us to display invited users before they complete signup

ALTER TABLE organization_members 
ADD COLUMN IF NOT EXISTS invited_email TEXT,
ADD COLUMN IF NOT EXISTS invited_full_name TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organization_members_invited_email 
ON organization_members(invited_email) 
WHERE invited_email IS NOT NULL;