-- Add RLS policies for clients to access their own files
-- Clients can view their own files
CREATE POLICY "Clients can view their own files"
ON public.client_files
FOR SELECT
TO authenticated
USING (
  client_id = auth.uid()
  AND deleted_at IS NULL
);

-- Clients can upload their own files
CREATE POLICY "Clients can upload their own files"
ON public.client_files
FOR INSERT
TO authenticated
WITH CHECK (
  client_id = auth.uid()
);

-- Add storage policies for clients
-- Clients can upload to their own folder
CREATE POLICY "Clients can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Clients can download from their own folder
CREATE POLICY "Clients can download own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'client-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);