-- Fix can_upload_file function (recreate with correct signature)
CREATE OR REPLACE FUNCTION can_upload_file(
  org_id uuid,
  file_size_bytes bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_record RECORD;
  current_storage bigint;
  max_storage bigint;
BEGIN
  -- Get organization storage info
  SELECT 
    storage_used_bytes,
    max_storage_gb
  INTO org_record
  FROM organizations
  WHERE id = org_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Calculate max storage in bytes
  max_storage := org_record.max_storage_gb::bigint * 1024 * 1024 * 1024;
  
  -- Check if adding this file would exceed limit
  current_storage := COALESCE(org_record.storage_used_bytes, 0);
  
  RETURN (current_storage + file_size_bytes) <= max_storage;
END;
$$;

-- Drop the existing problematic RLS policy for clients viewing files
DROP POLICY IF EXISTS "Clients can view their own files" ON client_files;

-- Create new RLS policy that properly checks client ownership via the clients table
CREATE POLICY "Clients can view their files"
ON client_files
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = client_files.client_id
    AND clients.user_id = auth.uid()
    AND clients.deleted_at IS NULL
  )
  AND deleted_at IS NULL
);

-- Also update the policy for clients uploading files
DROP POLICY IF EXISTS "Clients can upload their own files" ON client_files;

CREATE POLICY "Clients can upload their files"
ON client_files
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = client_files.client_id
    AND clients.user_id = auth.uid()
    AND clients.deleted_at IS NULL
  )
);