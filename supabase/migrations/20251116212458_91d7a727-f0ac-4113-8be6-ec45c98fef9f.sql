-- Task 1: Add Client RLS Policies

-- 1. Allow clients to view their own form submissions
CREATE POLICY "Clients can view their own submissions"
ON public.form_submissions
FOR SELECT
TO authenticated
USING (client_id = auth.uid());

-- 2. Allow clients to create their own submissions (for form autosave)
CREATE POLICY "Clients can create their own submissions"
ON public.form_submissions
FOR INSERT
TO authenticated
WITH CHECK (client_id = auth.uid());

-- 3. Allow clients to update their own submissions (for form autosave)
CREATE POLICY "Clients can update their own submissions"
ON public.form_submissions
FOR UPDATE
TO authenticated
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

-- 4. Allow clients to view forms that have submissions assigned to them
CREATE POLICY "Clients can view forms they have access to"
ON public.intake_forms
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT intake_form_id 
    FROM form_submissions 
    WHERE client_id = auth.uid()
  )
  AND status = 'active'
  AND deleted_at IS NULL
);

-- 5. Storage: Allow clients to upload to client-uploads bucket
CREATE POLICY "Clients can upload their own files to client-uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Storage: Allow clients to read their own files from client-uploads
CREATE POLICY "Clients can read their own files from client-uploads"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'client-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 7. Storage: Allow clients to read files from submissions bucket (for form file uploads)
CREATE POLICY "Clients can read submission files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'submissions'
  AND EXISTS (
    SELECT 1 
    FROM submission_files sf
    WHERE sf.storage_path = name
    AND sf.uploaded_by = auth.uid()
  )
);