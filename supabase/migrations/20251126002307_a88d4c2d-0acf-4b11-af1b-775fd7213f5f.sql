-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Members can update clients" ON public.clients;

-- Create two separate UPDATE policies:
-- 1. For regular updates (not setting deleted_at)
CREATE POLICY "Members can update client details" 
ON public.clients
FOR UPDATE 
USING (is_organization_member(organization_id, auth.uid()))
WITH CHECK (
  is_organization_member(organization_id, auth.uid()) 
  AND deleted_at IS NULL
);

-- 2. For soft deletes (setting deleted_at)
CREATE POLICY "Members can soft delete clients" 
ON public.clients
FOR UPDATE 
USING (
  is_organization_member(organization_id, auth.uid())
  AND deleted_at IS NULL
)
WITH CHECK (
  is_organization_member(organization_id, auth.uid())
  AND deleted_at IS NOT NULL
);