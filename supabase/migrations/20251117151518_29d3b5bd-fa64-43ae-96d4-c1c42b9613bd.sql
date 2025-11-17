-- Task 2: Update RLS policies to use auth.uid() instead of access_token

-- 1. Drop old storage policy that checks access_token
DROP POLICY IF EXISTS "Members can view all client uploads" ON storage.objects;

-- 2. Update contracts policies
DROP POLICY IF EXISTS "Clients can view their own contracts" ON public.contracts;
CREATE POLICY "Clients can view their own contracts"
ON public.contracts
FOR SELECT
TO authenticated
USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can update contract status" ON public.contracts;
CREATE POLICY "Clients can update contract status"
ON public.contracts
FOR UPDATE
TO authenticated
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

-- 3. Update invoices policies
DROP POLICY IF EXISTS "Clients can view their own invoices" ON public.invoices;
CREATE POLICY "Clients can view their own invoices"
ON public.invoices
FOR SELECT
TO authenticated
USING (client_id = auth.uid());

-- 4. Update meetings policies
DROP POLICY IF EXISTS "Clients can view their own meetings" ON public.meetings;
CREATE POLICY "Clients can view their own meetings"
ON public.meetings
FOR SELECT
TO authenticated
USING (client_id = auth.uid());

-- 5. Update client_feedback policies
DROP POLICY IF EXISTS "Clients can create their own feedback" ON public.client_feedback;
CREATE POLICY "Clients can create their own feedback"
ON public.client_feedback
FOR INSERT
TO authenticated
WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can view their own feedback" ON public.client_feedback;
CREATE POLICY "Clients can view their own feedback"
ON public.client_feedback
FOR SELECT
TO authenticated
USING (client_id = auth.uid());

-- Now drop the access_token columns
ALTER TABLE public.clients
DROP COLUMN IF EXISTS access_token,
DROP COLUMN IF EXISTS access_token_expires_at;

-- Remove the trigger that generates access tokens (no longer needed)
DROP TRIGGER IF EXISTS on_client_created_generate_token ON public.clients;
DROP FUNCTION IF EXISTS public.generate_client_access_token();