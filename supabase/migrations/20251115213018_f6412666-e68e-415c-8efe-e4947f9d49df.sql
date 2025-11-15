-- First, drop all existing policies on client_files table
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Clients can view their own files" ON public.client_files;
  DROP POLICY IF EXISTS "Members can manage client files" ON public.client_files;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Create comprehensive RLS policies for agency members
CREATE POLICY "Agency members can insert client files"
ON public.client_files
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_organization_member(organization_id, auth.uid())
);

CREATE POLICY "Agency members can view client files"
ON public.client_files
FOR SELECT
TO authenticated
USING (
  public.is_organization_member(organization_id, auth.uid())
  AND deleted_at IS NULL
);

CREATE POLICY "Agency members can update client files"
ON public.client_files
FOR UPDATE
TO authenticated
USING (
  public.is_organization_member(organization_id, auth.uid())
)
WITH CHECK (
  public.is_organization_member(organization_id, auth.uid())
);

CREATE POLICY "Agency members can delete client files"
ON public.client_files
FOR DELETE
TO authenticated
USING (
  public.is_organization_member(organization_id, auth.uid())
);