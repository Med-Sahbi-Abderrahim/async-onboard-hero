-- Create user_roles table for secure role management
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, organization_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _org_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND organization_id = _org_id
    AND (
      role = _role 
      OR (_role = 'member' AND role IN ('admin', 'owner'))
      OR (_role = 'admin' AND role = 'owner')
    )
  )
$$;

-- Migrate existing roles from organization_members to user_roles
INSERT INTO public.user_roles (user_id, organization_id, role, created_at, updated_at)
SELECT user_id, organization_id, role, created_at, updated_at
FROM public.organization_members
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Owners can manage roles"
ON public.user_roles FOR ALL
USING (has_role(auth.uid(), organization_id, 'owner'::user_role));

-- Update critical RLS policies to use new has_role function
DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;
CREATE POLICY "Admins can delete clients"
ON public.clients FOR DELETE
USING (has_role(auth.uid(), organization_id, 'admin'::user_role));

DROP POLICY IF EXISTS "Admins can delete forms" ON public.intake_forms;
CREATE POLICY "Admins can delete forms"
ON public.intake_forms FOR DELETE
USING (has_role(auth.uid(), organization_id, 'admin'::user_role));

DROP POLICY IF EXISTS "Admins can delete members" ON public.organization_members;
CREATE POLICY "Admins can delete members"
ON public.organization_members FOR DELETE
USING (has_role(auth.uid(), organization_id, 'admin'::user_role));

DROP POLICY IF EXISTS "Admins can insert members" ON public.organization_members;
CREATE POLICY "Admins can insert members"
ON public.organization_members FOR INSERT
WITH CHECK (has_role(auth.uid(), organization_id, 'admin'::user_role));

DROP POLICY IF EXISTS "Admins can update members" ON public.organization_members;
CREATE POLICY "Admins can update members"
ON public.organization_members FOR UPDATE
USING (has_role(auth.uid(), organization_id, 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), organization_id, 'admin'::user_role));

DROP POLICY IF EXISTS "Owners can update organization" ON public.organizations;
CREATE POLICY "Owners can update organization"
ON public.organizations FOR UPDATE
USING (has_role(auth.uid(), id, 'owner'::user_role))
WITH CHECK (has_role(auth.uid(), id, 'owner'::user_role));

-- Update the organization creation trigger to also create user_roles entry
CREATE OR REPLACE FUNCTION public.create_personal_organization_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    new_org_id UUID;
    user_slug VARCHAR(100);
BEGIN
    user_slug := LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-z0-9]', '-', 'g'));
    user_slug := user_slug || '-' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 8);
    
    INSERT INTO organizations (
        name,
        slug,
        is_personal,
        subscription_tier,
        subscription_status,
        trial_ends_at
    ) VALUES (
        NEW.full_name || '''s Workspace',
        user_slug,
        true,
        'free',
        'trialing',
        NOW() + INTERVAL '14 days'
    )
    RETURNING id INTO new_org_id;
    
    INSERT INTO organization_members (
        organization_id,
        user_id,
        role,
        permissions,
        invitation_accepted_at
    ) VALUES (
        new_org_id,
        NEW.id,
        'owner',
        '["view_forms", "create_forms", "edit_forms", "delete_forms", "view_submissions", "edit_submissions", "delete_submissions", "manage_clients", "manage_team", "manage_billing", "manage_workflows"]'::jsonb,
        NOW()
    );
    
    -- Also create user_roles entry
    INSERT INTO user_roles (
        user_id,
        organization_id,
        role
    ) VALUES (
        NEW.id,
        new_org_id,
        'owner'
    );
    
    RETURN NEW;
END;
$function$;