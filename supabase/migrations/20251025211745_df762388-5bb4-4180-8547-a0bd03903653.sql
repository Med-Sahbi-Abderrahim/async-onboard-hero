-- Fix search_path for the new function
CREATE OR REPLACE FUNCTION public.get_submissions_needing_reminders()
RETURNS TABLE (
    submission_id UUID,
    client_id UUID,
    organization_id UUID,
    client_email TEXT,
    client_full_name TEXT,
    form_title TEXT,
    form_slug TEXT,
    hours_since_update INTEGER,
    reminder_delay_hours INTEGER
) 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        fs.id as submission_id,
        fs.client_id,
        fs.organization_id,
        c.email as client_email,
        c.full_name as client_full_name,
        if.title as form_title,
        if.slug as form_slug,
        EXTRACT(EPOCH FROM (NOW() - fs.updated_at))/3600 as hours_since_update,
        if.reminder_delay_hours
    FROM form_submissions fs
    JOIN clients c ON fs.client_id = c.id
    JOIN intake_forms if ON fs.intake_form_id = if.id
    WHERE 
        fs.status = 'pending'
        AND if.reminder_enabled = true
        AND EXTRACT(EPOCH FROM (NOW() - fs.updated_at))/3600 >= if.reminder_delay_hours
        AND NOT EXISTS (
            SELECT 1 FROM reminder_logs rl
            WHERE rl.submission_id = fs.id
            AND rl.reminder_type = 'incomplete_reminder'
            AND rl.sent_at > NOW() - INTERVAL '1 day' * if.reminder_delay_hours / 24
        );
$$;