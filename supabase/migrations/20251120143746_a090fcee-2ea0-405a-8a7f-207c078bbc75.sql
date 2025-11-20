-- Allow clients to view their own client record
-- This is essential for client portal access
CREATE POLICY "Clients can view their own record"
ON public.clients
FOR SELECT
TO authenticated
USING (id = auth.uid() AND deleted_at IS NULL);

-- Also allow clients to update their own profile information
CREATE POLICY "Clients can update their own record"
ON public.clients
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());