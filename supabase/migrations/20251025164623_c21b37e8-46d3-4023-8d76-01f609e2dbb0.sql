-- Fix ambiguous column references by using CASCADE
-- This will drop and recreate dependent policies automatically

DROP FUNCTION IF EXISTS public.is_organization_member(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.has_organization_role(uuid, uuid, user_role) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_organizations(uuid) CASCADE;

-- Recreate functions with prefixed parameters to avoid ambiguity
CREATE OR REPLACE FUNCTION public.is_organization_member(p_org_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.organization_id = p_org_id
        AND om.user_id = p_user_id
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_organization_role(p_org_id uuid, p_user_id uuid, required_role user_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.organization_id = p_org_id
        AND om.user_id = p_user_id
        AND (
            om.role = required_role 
            OR (required_role = 'member' AND om.role IN ('admin', 'owner'))
            OR (required_role = 'admin' AND om.role = 'owner')
        )
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_organizations(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT om.organization_id
    FROM organization_members om
    WHERE om.user_id = p_user_id;
END;
$function$;

-- Recreate all RLS policies that were dropped
-- Clients table policies
CREATE POLICY "Members can create clients" ON public.clients
FOR INSERT TO authenticated
WITH CHECK (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Members can update clients" ON public.clients
FOR UPDATE TO authenticated
USING (is_organization_member(organization_id, auth.uid()));

-- Intake forms policies
CREATE POLICY "Members can create forms" ON public.intake_forms
FOR INSERT TO authenticated
WITH CHECK (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Members can update forms" ON public.intake_forms
FOR UPDATE TO authenticated
USING (is_organization_member(organization_id, auth.uid()));

-- Form submissions policies
CREATE POLICY "Members can create submissions" ON public.form_submissions
FOR INSERT TO authenticated
WITH CHECK (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Members can update submissions" ON public.form_submissions
FOR UPDATE TO authenticated
USING (is_organization_member(organization_id, auth.uid()));

-- Submission files policies
CREATE POLICY "Members can upload files" ON public.submission_files
FOR INSERT TO authenticated
WITH CHECK (is_organization_member(organization_id, auth.uid()));

-- Email templates policies
CREATE POLICY "Members can create templates" ON public.email_templates
FOR INSERT TO authenticated
WITH CHECK (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Members can update templates" ON public.email_templates
FOR UPDATE TO authenticated
USING (is_organization_member(organization_id, auth.uid()));

-- Automation workflows policies
CREATE POLICY "Members can create workflows" ON public.automation_workflows
FOR INSERT TO authenticated
WITH CHECK (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Members can update workflows" ON public.automation_workflows
FOR UPDATE TO authenticated
USING (is_organization_member(organization_id, auth.uid()));