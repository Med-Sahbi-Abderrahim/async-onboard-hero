-- Remove automatic organization creation on signup
-- Users must be invited to or create organizations explicitly

-- Drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the function to only create user profile, not organization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only insert into public.users
  INSERT INTO public.users (id, full_name, email, avatar_url, last_seen_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    NOW()
  );

  RETURN NEW;
END;
$$;

-- Create new trigger with updated function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Add constraint to ensure organizations always have at least one owner
-- This is handled by the ensure_organization_has_owner trigger already

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile without automatic organization. Users must be invited or create organizations explicitly.';