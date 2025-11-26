-- The issue is WITH CHECK clauses are AND'd together
-- We need to make sure client updates and member updates don't conflict
-- Solution: Make the client policy only apply when user_id IS NOT NULL and matches

-- Drop both policies
DROP POLICY IF EXISTS "Clients can update their own records" ON public.clients;
DROP POLICY IF EXISTS "Members can update clients" ON public.clients;

-- Recreate with non-conflicting logic
-- Policy 1: Clients can update ONLY their own records (when they ARE the client)
CREATE POLICY "Clients can update their own records" 
ON public.clients
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy 2: Org members can update ANY client in their org (even if not the client user)
CREATE POLICY "Members can update org clients" 
ON public.clients
FOR UPDATE 
USING (
  is_organization_member(organization_id, auth.uid())
  AND (user_id != auth.uid() OR user_id IS NULL)
)
WITH CHECK (
  is_organization_member(organization_id, auth.uid())
);