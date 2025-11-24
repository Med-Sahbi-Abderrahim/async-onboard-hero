-- Fix RLS policies for form_submissions to work with user_id on clients table

-- Drop existing client policies
DROP POLICY IF EXISTS "Clients can create their own submissions" ON form_submissions;
DROP POLICY IF EXISTS "Clients can update their own submissions" ON form_submissions;
DROP POLICY IF EXISTS "Clients can view their own submissions" ON form_submissions;

-- Create new policies that check if the user owns the client record
CREATE POLICY "Clients can create submissions for their records"
ON form_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = form_submissions.client_id
    AND clients.user_id = auth.uid()
  )
);

CREATE POLICY "Clients can update submissions for their records"
ON form_submissions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = form_submissions.client_id
    AND clients.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = form_submissions.client_id
    AND clients.user_id = auth.uid()
  )
);

CREATE POLICY "Clients can view submissions for their records"
ON form_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = form_submissions.client_id
    AND clients.user_id = auth.uid()
  )
);