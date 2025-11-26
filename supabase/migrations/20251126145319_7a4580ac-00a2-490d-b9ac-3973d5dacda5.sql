-- Fix infinite recursion in organization_members policies
-- The problem: "Members can view org members" policy queries organization_members within itself

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Members can view org members" ON organization_members;

-- Drop duplicate policies
DROP POLICY IF EXISTS "Users can view own memberships" ON organization_members;

-- Keep only the simple, non-recursive policy for viewing own memberships
-- This policy already exists: "Users can view their own memberships"
-- It simply checks: auth.uid() = user_id (no recursion)

-- Add a SECURITY DEFINER function to safely check membership without recursion
CREATE OR REPLACE FUNCTION public.check_org_membership_safe(check_org_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE user_id = check_user_id
      AND organization_id = check_org_id
      AND deleted_at IS NULL
  )
$$;

-- Now add a safe policy for viewing other org members
-- This uses the SECURITY DEFINER function which bypasses RLS
CREATE POLICY "Members can view org members safe"
ON organization_members
FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL 
  AND check_org_membership_safe(organization_id, auth.uid())
);