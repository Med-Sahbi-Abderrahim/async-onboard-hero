-- Add storage policies for client-uploads bucket
-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Agency members can upload client files" ON storage.objects;
  DROP POLICY IF EXISTS "Agency members can download client files" ON storage.objects;
  DROP POLICY IF EXISTS "Agency members can delete storage files" ON storage.objects;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Agency members can upload files to their organization's client folders
CREATE POLICY "Agency members can upload client files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-uploads'
  AND (storage.foldername(name))[1] IN (
    SELECT c.id::text 
    FROM public.clients c
    INNER JOIN public.users u ON u.organization_id = c.organization_id
    WHERE u.id = auth.uid()
  )
);

-- Agency members can download files from their organization's clients
CREATE POLICY "Agency members can download client files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'client-uploads'
  AND (storage.foldername(name))[1] IN (
    SELECT c.id::text 
    FROM public.clients c
    INNER JOIN public.users u ON u.organization_id = c.organization_id
    WHERE u.id = auth.uid()
  )
);

-- Agency members can delete files from their organization's clients
CREATE POLICY "Agency members can delete storage files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'client-uploads'
  AND (storage.foldername(name))[1] IN (
    SELECT c.id::text 
    FROM public.clients c
    INNER JOIN public.users u ON u.organization_id = c.organization_id
    WHERE u.id = auth.uid()
  )
);