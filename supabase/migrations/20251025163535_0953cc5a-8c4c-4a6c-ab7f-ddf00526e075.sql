-- Create trigger to automatically create organization for new users
CREATE TRIGGER on_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_personal_organization_for_new_user();

-- Backfill: Create organizations for existing users who don't have one
DO $$
DECLARE
  user_record RECORD;
  new_org_id UUID;
  user_slug VARCHAR(100);
BEGIN
  FOR user_record IN 
    SELECT u.id, u.email, u.full_name
    FROM public.users u
    LEFT JOIN public.organization_members om ON om.user_id = u.id
    WHERE om.id IS NULL AND u.deleted_at IS NULL
  LOOP
    -- Generate unique slug
    user_slug := LOWER(REGEXP_REPLACE(SPLIT_PART(user_record.email, '@', 1), '[^a-z0-9]', '-', 'g'));
    user_slug := user_slug || '-' || SUBSTRING(user_record.id::TEXT FROM 1 FOR 8);
    
    -- Create organization
    INSERT INTO public.organizations (
      name,
      slug,
      is_personal,
      subscription_tier,
      subscription_status,
      trial_ends_at
    ) VALUES (
      user_record.full_name || '''s Workspace',
      user_slug,
      true,
      'free',
      'trialing',
      NOW() + INTERVAL '14 days'
    )
    RETURNING id INTO new_org_id;
    
    -- Add user as owner
    INSERT INTO public.organization_members (
      organization_id,
      user_id,
      role,
      permissions,
      invitation_accepted_at
    ) VALUES (
      new_org_id,
      user_record.id,
      'owner',
      '["view_forms", "create_forms", "edit_forms", "delete_forms", "view_submissions", "edit_submissions", "delete_submissions", "manage_clients", "manage_team", "manage_billing", "manage_workflows"]'::jsonb,
      NOW()
    );
    
    RAISE NOTICE 'Created organization for user: %', user_record.email;
  END LOOP;
END $$;