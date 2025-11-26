-- Add soft-delete support to organization_members table
-- This enables audit trail and recovery capabilities for team member removals

ALTER TABLE public.organization_members 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for efficient filtering of active members
CREATE INDEX IF NOT EXISTS idx_organization_members_deleted_at 
ON public.organization_members(deleted_at);

-- Update RLS policies to respect soft-delete in member queries
DROP POLICY IF EXISTS "Members can view org members" ON public.organization_members;

CREATE POLICY "Members can view org members"
ON public.organization_members
FOR SELECT
USING (
  deleted_at IS NULL
  AND (
    SELECT EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid() 
      AND om.organization_id = organization_members.organization_id
      AND om.deleted_at IS NULL
    )
  )
);

-- Update activity logs to capture soft-deletes properly
DROP POLICY IF EXISTS "Members can view activity logs" ON public.activity_logs;

CREATE POLICY "Members can view activity logs"
ON public.activity_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = activity_logs.organization_id
    AND om.user_id = auth.uid()
    AND om.deleted_at IS NULL
  )
);
