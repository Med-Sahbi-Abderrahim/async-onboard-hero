-- Fix UPDATE policies to apply to authenticated role instead of public role
-- The issue: policies were created with 'public' role, but authenticated users have 'authenticated' role

-- ============================================
-- FIX CLIENTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Members can update clients" ON public.clients;

CREATE POLICY "Members can update clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (
  is_organization_member(organization_id, auth.uid())
  AND deleted_at IS NULL
)
WITH CHECK (
  is_organization_member(organization_id, auth.uid())
);

-- ============================================
-- FIX INTAKE_FORMS TABLE
-- ============================================
DROP POLICY IF EXISTS "Members can update forms" ON public.intake_forms;

CREATE POLICY "Members can update forms"
ON public.intake_forms
FOR UPDATE
TO authenticated
USING (
  is_organization_member(organization_id, auth.uid())
  AND deleted_at IS NULL
)
WITH CHECK (
  is_organization_member(organization_id, auth.uid())
);

-- ============================================
-- FIX FORM_SUBMISSIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Members can update submissions" ON public.form_submissions;

CREATE POLICY "Members can update submissions"
ON public.form_submissions
FOR UPDATE
TO authenticated
USING (
  is_organization_member(organization_id, auth.uid())
  AND deleted_at IS NULL
)
WITH CHECK (
  is_organization_member(organization_id, auth.uid())
);

-- ============================================
-- FIX EMAIL_TEMPLATES TABLE
-- ============================================
DROP POLICY IF EXISTS "Members can update templates" ON public.email_templates;

CREATE POLICY "Members can update templates"
ON public.email_templates
FOR UPDATE
TO authenticated
USING (
  is_organization_member(organization_id, auth.uid())
  AND deleted_at IS NULL
)
WITH CHECK (
  is_organization_member(organization_id, auth.uid())
);

-- ============================================
-- FIX AUTOMATION_WORKFLOWS TABLE
-- ============================================
DROP POLICY IF EXISTS "Members can update workflows" ON public.automation_workflows;

CREATE POLICY "Members can update workflows"
ON public.automation_workflows
FOR UPDATE
TO authenticated
USING (
  is_organization_member(organization_id, auth.uid())
  AND deleted_at IS NULL
)
WITH CHECK (
  is_organization_member(organization_id, auth.uid())
);