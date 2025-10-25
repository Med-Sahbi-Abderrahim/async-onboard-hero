-- Explicitly drop all policies first
DROP POLICY IF EXISTS "Members can create clients" ON public.clients;
DROP POLICY IF EXISTS "Members can update clients" ON public.clients;
DROP POLICY IF EXISTS "Members can create forms" ON public.intake_forms;
DROP POLICY IF EXISTS "Members can update forms" ON public.intake_forms;
DROP POLICY IF EXISTS "Members can create submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Members can update submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Members can upload files" ON public.submission_files;
DROP POLICY IF EXISTS "Members can create templates" ON public.email_templates;
DROP POLICY IF EXISTS "Members can update templates" ON public.email_templates;
DROP POLICY IF EXISTS "Members can create workflows" ON public.automation_workflows;
DROP POLICY IF EXISTS "Members can update workflows" ON public.automation_workflows;
DROP POLICY IF EXISTS "Users can view own memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Members can view org members" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.organization_members;

-- Drop and recreate functions with proper security settings
DROP FUNCTION IF EXISTS public.is_organization_member(uuid, uuid);
DROP FUNCTION IF EXISTS public.has_organization_role(uuid, uuid, user_role);

CREATE OR REPLACE FUNCTION public.is_organization_member(p_org_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = p_org_id
    AND om.user_id = p_user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.has_organization_role(p_org_id uuid, p_user_id uuid, required_role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = p_org_id
    AND om.user_id = p_user_id
    AND (
      om.role = required_role 
      OR (required_role = 'member' AND om.role IN ('admin', 'owner'))
      OR (required_role = 'admin' AND om.role = 'owner')
    )
  )
$$;

-- Recreate all RLS policies
CREATE POLICY "Members can create clients" ON public.clients
FOR INSERT TO authenticated
WITH CHECK (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Members can update clients" ON public.clients
FOR UPDATE TO authenticated
USING (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Members can create forms" ON public.intake_forms
FOR INSERT TO authenticated
WITH CHECK (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Members can update forms" ON public.intake_forms
FOR UPDATE TO authenticated
USING (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Members can create submissions" ON public.form_submissions
FOR INSERT TO authenticated
WITH CHECK (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Members can update submissions" ON public.form_submissions
FOR UPDATE TO authenticated
USING (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Members can upload files" ON public.submission_files
FOR INSERT TO authenticated
WITH CHECK (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Members can create templates" ON public.email_templates
FOR INSERT TO authenticated
WITH CHECK (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Members can update templates" ON public.email_templates
FOR UPDATE TO authenticated
USING (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Members can create workflows" ON public.automation_workflows
FOR INSERT TO authenticated
WITH CHECK (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Members can update workflows" ON public.automation_workflows
FOR UPDATE TO authenticated
USING (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Users can view own memberships" ON public.organization_members
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Members can view org members" ON public.organization_members
FOR SELECT TO authenticated
USING (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Admins can manage members" ON public.organization_members
FOR ALL TO authenticated
USING (has_organization_role(organization_id, auth.uid(), 'admin'))
WITH CHECK (has_organization_role(organization_id, auth.uid(), 'admin'));