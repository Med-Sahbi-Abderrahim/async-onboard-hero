-- Create the missing function for user signup with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user_and_organization()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create a personal organization for the new user
  INSERT INTO public.organizations (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email) || '''s Workspace')
  RETURNING id INTO new_org_id;

  -- Insert into public.users (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO public.users (id, full_name, organization_id)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    new_org_id
  );

  -- Add user as owner of their organization
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user_and_organization();

-- Update RLS policies to allow service/trigger inserts
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "allow insert by authenticated" ON public.users;
DROP POLICY IF EXISTS "allow select by authenticated" ON public.users;

-- Allow authenticated users to read their own data
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow the trigger (via SECURITY DEFINER function) to insert
CREATE POLICY "Allow trigger to insert users"
  ON public.users
  FOR INSERT
  WITH CHECK (true);