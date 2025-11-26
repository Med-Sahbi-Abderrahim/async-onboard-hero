-- Simplify to a single UPDATE policy that covers both cases
DROP POLICY IF EXISTS "Clients can update their own records" ON public.clients;
DROP POLICY IF EXISTS "Members can update org clients" ON public.clients;

-- Single policy: you can update if you're either the client OR an org member
CREATE POLICY "Update clients policy" 
ON public.clients
FOR UPDATE 
USING (
  user_id = auth.uid() 
  OR is_organization_member(organization_id, auth.uid())
)
WITH CHECK (
  user_id = auth.uid() 
  OR is_organization_member(organization_id, auth.uid())
);