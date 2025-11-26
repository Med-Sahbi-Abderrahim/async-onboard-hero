-- Drop both update policies
DROP POLICY IF EXISTS "Members can update client details" ON public.clients;
DROP POLICY IF EXISTS "Members can soft delete clients" ON public.clients;

-- Create a single, simple UPDATE policy
-- USING checks the OLD row (before update)
-- WITH CHECK checks the NEW row (after update)
CREATE POLICY "Members can update clients" 
ON public.clients
FOR UPDATE 
USING (is_organization_member(organization_id, auth.uid()))
WITH CHECK (is_organization_member(organization_id, auth.uid()));