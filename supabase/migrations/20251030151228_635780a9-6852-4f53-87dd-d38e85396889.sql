-- Enable RLS on organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read organizations they are members of
CREATE POLICY "Members can view their organizations"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Allow the trigger to insert organizations (via SECURITY DEFINER function)
CREATE POLICY "Allow trigger to create organizations"
  ON public.organizations
  FOR INSERT
  WITH CHECK (true);