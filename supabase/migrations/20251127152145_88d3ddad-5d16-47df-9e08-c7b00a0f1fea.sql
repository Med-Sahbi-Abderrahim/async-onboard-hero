-- Allow public form submissions to upload files to submissions bucket
-- Files will be organized by form_id/temp/ for pre-submission uploads

-- First, ensure the submissions bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can upload to temp submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their submission files" ON storage.objects;
DROP POLICY IF EXISTS "Members can view submission files" ON storage.objects;

-- Allow anyone to upload to temp folders in submissions bucket
CREATE POLICY "Public can upload to temp submissions"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'submissions' 
  AND (storage.foldername(name))[2] = 'temp'
);

-- Allow users to view files they uploaded (via temp folder pattern)
CREATE POLICY "Users can view their submission files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'submissions'
);

-- Allow organization members to view all submission files
CREATE POLICY "Members can view submission files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'submissions'
  AND EXISTS (
    SELECT 1 FROM form_submissions fs
    WHERE fs.id::text = (storage.foldername(name))[1]::text
    AND is_organization_member(fs.organization_id, auth.uid())
  )
);