-- Drop and recreate the trigger for automatic user profile and organization creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the trigger to call the existing function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user_and_organization();

-- Ensure RLS policies allow authenticated users to insert their own profile
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;

CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure RLS policies allow authenticated users to read their own profile  
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);