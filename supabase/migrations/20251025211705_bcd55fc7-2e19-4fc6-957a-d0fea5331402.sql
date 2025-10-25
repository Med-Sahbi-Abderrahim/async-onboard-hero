-- Create reminder_logs table to track all email reminders
CREATE TABLE IF NOT EXISTS public.reminder_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('incomplete_reminder', 'submission_confirmation', 'follow_up')),
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    email_status TEXT NOT NULL DEFAULT 'sent' CHECK (email_status IN ('sent', 'failed', 'pending', 'retry')),
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_reminder_logs_submission ON reminder_logs(submission_id);
CREATE INDEX idx_reminder_logs_client ON reminder_logs(client_id);
CREATE INDEX idx_reminder_logs_org ON reminder_logs(organization_id);
CREATE INDEX idx_reminder_logs_sent_at ON reminder_logs(sent_at);
CREATE INDEX idx_reminder_logs_status ON reminder_logs(email_status);

-- Enable RLS
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reminder_logs
CREATE POLICY "Users can view reminder logs for their organization"
    ON public.reminder_logs FOR SELECT
    USING (organization_id IN (SELECT get_user_organizations(auth.uid())));

CREATE POLICY "System can insert reminder logs"
    ON public.reminder_logs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update reminder logs"
    ON public.reminder_logs FOR UPDATE
    USING (true);

-- Add reminder settings to intake_forms table
ALTER TABLE public.intake_forms 
ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS reminder_delay_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS confirmation_email_enabled BOOLEAN DEFAULT true;

-- Create function to find submissions needing reminders
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