-- Fix DELETE and UPDATE policies for all tables with soft delete support
-- The app uses UPDATE to set deleted_at (soft delete), so we need both UPDATE and DELETE policies

-- ============================================
-- CLIENTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Test: authenticated can update clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can hard delete clients" ON public.clients;

-- Allow organization members to soft delete (UPDATE with deleted_at)
CREATE POLICY "Members can update clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (is_organization_member(organization_id, auth.uid()))
WITH CHECK (is_organization_member(organization_id, auth.uid()));

-- Allow organization members to hard delete if needed
CREATE POLICY "Members can delete clients"
ON public.clients
FOR DELETE
TO authenticated
USING (is_organization_member(organization_id, auth.uid()));

-- ============================================
-- INTAKE_FORMS TABLE
-- ============================================
DROP POLICY IF EXISTS "Test: authenticated can update forms" ON public.intake_forms;
DROP POLICY IF EXISTS "Admins can hard delete forms" ON public.intake_forms;

-- Allow organization members to soft delete (UPDATE with deleted_at)
CREATE POLICY "Members can update forms"
ON public.intake_forms
FOR UPDATE
TO authenticated
USING (is_organization_member(organization_id, auth.uid()))
WITH CHECK (is_organization_member(organization_id, auth.uid()));

-- Allow organization members to hard delete if needed
CREATE POLICY "Members can delete forms"
ON public.intake_forms
FOR DELETE
TO authenticated
USING (is_organization_member(organization_id, auth.uid()));

-- ============================================
-- FORM_SUBMISSIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Members can update submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Admins can hard delete submissions" ON public.form_submissions;

-- Allow organization members to soft delete submissions
CREATE POLICY "Members can update submissions"
ON public.form_submissions
FOR UPDATE
TO authenticated
USING (is_organization_member(organization_id, auth.uid()))
WITH CHECK (is_organization_member(organization_id, auth.uid()));

-- Allow organization members to hard delete submissions
CREATE POLICY "Members can delete submissions"
ON public.form_submissions
FOR DELETE
TO authenticated
USING (is_organization_member(organization_id, auth.uid()));

-- ============================================
-- EMAIL_TEMPLATES TABLE
-- ============================================
DROP POLICY IF EXISTS "Members can update templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admins can hard delete templates" ON public.email_templates;

-- Allow organization members to soft delete templates
CREATE POLICY "Members can update templates"
ON public.email_templates
FOR UPDATE
TO authenticated
USING (is_organization_member(organization_id, auth.uid()))
WITH CHECK (is_organization_member(organization_id, auth.uid()));

-- Allow organization members to hard delete templates
CREATE POLICY "Members can delete templates"
ON public.email_templates
FOR DELETE
TO authenticated
USING (is_organization_member(organization_id, auth.uid()));

-- ============================================
-- AUTOMATION_WORKFLOWS TABLE
-- ============================================
DROP POLICY IF EXISTS "Members can update workflows" ON public.automation_workflows;
DROP POLICY IF EXISTS "Admins can hard delete workflows" ON public.automation_workflows;

-- Allow organization members to soft delete workflows
CREATE POLICY "Members can update workflows"
ON public.automation_workflows
FOR UPDATE
TO authenticated
USING (is_organization_member(organization_id, auth.uid()))
WITH CHECK (is_organization_member(organization_id, auth.uid()));

-- Allow organization members to hard delete workflows
CREATE POLICY "Members can delete workflows"
ON public.automation_workflows
FOR DELETE
TO authenticated
USING (is_organization_member(organization_id, auth.uid()));