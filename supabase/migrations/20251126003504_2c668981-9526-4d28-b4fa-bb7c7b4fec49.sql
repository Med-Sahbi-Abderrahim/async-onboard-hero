-- Drop the conflicting client self-update policy
DROP POLICY IF EXISTS "Clients can update their own records" ON public.clients;

-- Recreate it with proper scoping that doesn't interfere with org member updates
CREATE POLICY "Clients can update their own records" 
ON public.clients
FOR UPDATE 
USING (user_id = auth.uid() AND user_id IS NOT NULL)
WITH CHECK (user_id = auth.uid() AND user_id IS NOT NULL);