-- Fix DELETE/UPDATE RLS policies to allow soft deletes by organization members
-- The application uses soft deletes (UPDATE with deleted_at), not hard DELETE

-- ============================================
-- CLIENTS TABLE - Allow members to soft-delete
-- ============================================

-- Drop existing restrictive admin-only delete policy
DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;

-- Update the update policy to ensure members can soft-delete their org's clients
DROP POLICY IF EXISTS "Members can update clients" ON public.clients;

CREATE POLICY "Members can update clients"
ON public.clients
FOR UPDATE
USING (
  is_organization_member(organization_id, auth.uid())
  AND deleted_at IS NULL
)
WITH CHECK (
  is_organization_member(organization_id, auth.uid())
  -- Allow setting deleted_at or updating fields
);

-- Add proper delete policy for hard deletes (admin only)
CREATE POLICY "Admins can hard delete clients"
ON public.clients
FOR DELETE
USING (
  has_role(auth.uid(), organization_id, 'admin'::user_role)
);

-- ============================================
-- INTAKE_FORMS TABLE - Allow members to soft-delete
-- ============================================

-- Drop existing restrictive admin-only delete policy
DROP POLICY IF EXISTS "Admins can delete forms" ON public.intake_forms;

-- Update the update policy to ensure members can soft-delete their org's forms
DROP POLICY IF EXISTS "Members can update forms" ON public.intake_forms;

CREATE POLICY "Members can update forms"
ON public.intake_forms
FOR UPDATE
USING (
  is_organization_member(organization_id, auth.uid())
  AND deleted_at IS NULL
)
WITH CHECK (
  is_organization_member(organization_id, auth.uid())
  -- Allow setting deleted_at or updating fields
);

-- Add proper delete policy for hard deletes (admin only)
CREATE POLICY "Admins can hard delete forms"
ON public.intake_forms
FOR DELETE
USING (
  has_role(auth.uid(), organization_id, 'admin'::user_role)
);

-- ============================================
-- FORM_SUBMISSIONS TABLE - Allow members to soft-delete
-- ============================================

-- Update the update policy to ensure members can soft-delete submissions
DROP POLICY IF EXISTS "Members can update submissions" ON public.form_submissions;

CREATE POLICY "Members can update submissions"
ON public.form_submissions
FOR UPDATE
USING (
  is_organization_member(organization_id, auth.uid())
  AND deleted_at IS NULL
)
WITH CHECK (
  is_organization_member(organization_id, auth.uid())
);

-- Add delete policy for hard deletes (admin only)
CREATE POLICY "Admins can hard delete submissions"
ON public.form_submissions
FOR DELETE
USING (
  has_role(auth.uid(), organization_id, 'admin'::user_role)
);

-- ============================================
-- EMAIL_TEMPLATES TABLE - Allow members to soft-delete
-- ============================================

DROP POLICY IF EXISTS "Members can update templates" ON public.email_templates;

CREATE POLICY "Members can update templates"
ON public.email_templates
FOR UPDATE
USING (
  is_organization_member(organization_id, auth.uid())
  AND deleted_at IS NULL
)
WITH CHECK (
  is_organization_member(organization_id, auth.uid())
);

-- Add delete policy for hard deletes (admin only)
CREATE POLICY "Admins can hard delete templates"
ON public.email_templates
FOR DELETE
USING (
  has_role(auth.uid(), organization_id, 'admin'::user_role)
);

-- ============================================
-- AUTOMATION_WORKFLOWS TABLE - Allow members to soft-delete
-- ============================================

DROP POLICY IF EXISTS "Members can update workflows" ON public.automation_workflows;

CREATE POLICY "Members can update workflows"
ON public.automation_workflows
FOR UPDATE
USING (
  is_organization_member(organization_id, auth.uid())
  AND deleted_at IS NULL
)
WITH CHECK (
  is_organization_member(organization_id, auth.uid())
);

-- Add delete policy for hard deletes (admin only)
CREATE POLICY "Admins can hard delete workflows"
ON public.automation_workflows
FOR DELETE
USING (
  has_role(auth.uid(), organization_id, 'admin'::user_role)
);