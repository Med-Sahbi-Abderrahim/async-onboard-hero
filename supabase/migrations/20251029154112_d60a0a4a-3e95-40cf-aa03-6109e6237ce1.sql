-- Drop existing function
DROP FUNCTION IF EXISTS public.get_submissions_needing_reminders();

-- Create updated function that supports multiple reminder intervals
CREATE OR REPLACE FUNCTION public.get_submissions_needing_reminders()
RETURNS TABLE(
  submission_id uuid,
  client_id uuid,
  organization_id uuid,
  client_email text,
  client_full_name text,
  form_title text,
  form_slug text,
  hours_since_update numeric,
  reminder_delay_hours integer,
  reminder_interval integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Get submissions needing 2-hour reminder
  SELECT 
    fs.id as submission_id,
    fs.client_id,
    fs.organization_id,
    c.email as client_email,
    c.full_name as client_full_name,
    if.title as form_title,
    if.slug as form_slug,
    EXTRACT(EPOCH FROM (NOW() - fs.updated_at))/3600 as hours_since_update,
    if.reminder_delay_hours,
    2 as reminder_interval
  FROM form_submissions fs
  JOIN clients c ON fs.client_id = c.id
  JOIN intake_forms if ON fs.intake_form_id = if.id
  WHERE 
    fs.status = 'pending'
    AND if.reminder_enabled = true
    AND EXTRACT(EPOCH FROM (NOW() - fs.updated_at))/3600 >= 2
    AND NOT EXISTS (
      SELECT 1 FROM reminder_logs rl
      WHERE rl.submission_id = fs.id
      AND rl.reminder_type = 'incomplete_reminder'
      AND rl.metadata->>'reminder_interval' = '2'
    )
  
  UNION ALL
  
  -- Get submissions needing configured delay reminder
  SELECT 
    fs.id as submission_id,
    fs.client_id,
    fs.organization_id,
    c.email as client_email,
    c.full_name as client_full_name,
    if.title as form_title,
    if.slug as form_slug,
    EXTRACT(EPOCH FROM (NOW() - fs.updated_at))/3600 as hours_since_update,
    if.reminder_delay_hours,
    if.reminder_delay_hours as reminder_interval
  FROM form_submissions fs
  JOIN clients c ON fs.client_id = c.id
  JOIN intake_forms if ON fs.intake_form_id = if.id
  WHERE 
    fs.status = 'pending'
    AND if.reminder_enabled = true
    AND EXTRACT(EPOCH FROM (NOW() - fs.updated_at))/3600 >= if.reminder_delay_hours
    AND if.reminder_delay_hours > 2
    AND NOT EXISTS (
      SELECT 1 FROM reminder_logs rl
      WHERE rl.submission_id = fs.id
      AND rl.reminder_type = 'incomplete_reminder'
      AND rl.metadata->>'reminder_interval' = if.reminder_delay_hours::text
    );
$$;