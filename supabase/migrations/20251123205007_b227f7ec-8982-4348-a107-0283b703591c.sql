-- Allow unauthenticated users to view active forms by slug for public form submissions
CREATE POLICY "Anyone can view active forms by slug"
ON intake_forms
FOR SELECT
TO public
USING (
  status = 'active' 
  AND deleted_at IS NULL
);