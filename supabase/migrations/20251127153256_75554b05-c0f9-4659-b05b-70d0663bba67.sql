-- Fix RLS policies for public form file uploads
-- The policy was checking for 'temp' at wrong position

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Public can upload to temp submissions" ON storage.objects;

-- Create a more permissive policy for public form uploads
-- Allow unauthenticated uploads to submissions bucket
CREATE POLICY "Public can upload submission files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'submissions'
);

-- Update the SELECT policy to be simpler
DROP POLICY IF EXISTS "Users can view their submission files" ON storage.objects;

CREATE POLICY "Anyone can view submission files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'submissions'
);