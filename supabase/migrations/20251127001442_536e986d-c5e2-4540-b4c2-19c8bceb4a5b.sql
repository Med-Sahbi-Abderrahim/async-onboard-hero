-- Add INSERT policies for clients on contracts, invoices, and meetings tables

-- Allow clients to insert their own contracts
CREATE POLICY "Clients can create their own contracts"
ON public.contracts
FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (
    SELECT id FROM clients 
    WHERE (user_id = auth.uid() OR lower(email) = lower(auth.email()))
    AND deleted_at IS NULL
  )
);

-- Allow clients to insert their own invoices  
CREATE POLICY "Clients can create their own invoices"
ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (
    SELECT id FROM clients 
    WHERE (user_id = auth.uid() OR lower(email) = lower(auth.email()))
    AND deleted_at IS NULL
  )
);

-- Allow clients to insert their own meetings
CREATE POLICY "Clients can create their own meetings"
ON public.meetings
FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (
    SELECT id FROM clients 
    WHERE (user_id = auth.uid() OR lower(email) = lower(auth.email()))
    AND deleted_at IS NULL
  )
);