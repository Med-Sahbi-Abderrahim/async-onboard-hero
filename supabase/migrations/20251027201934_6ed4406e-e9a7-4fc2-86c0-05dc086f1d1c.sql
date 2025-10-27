-- Temporarily simplify policies to test
-- This will help us identify if it's the function or something else

-- Test with simpler policies that just check auth
DROP POLICY IF EXISTS "Members can update clients" ON public.clients;
DROP POLICY IF EXISTS "Members can update forms" ON public.intake_forms;

-- Super permissive test policy for clients
CREATE POLICY "Test: authenticated can update clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Super permissive test policy for forms  
CREATE POLICY "Test: authenticated can update forms"
ON public.intake_forms
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);