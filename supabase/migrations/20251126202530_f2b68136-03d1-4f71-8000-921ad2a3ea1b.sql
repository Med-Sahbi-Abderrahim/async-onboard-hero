-- Fix search_path for can_upload_file function to resolve security warning
CREATE OR REPLACE FUNCTION can_upload_file(
  org_id uuid,
  file_size_bytes bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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