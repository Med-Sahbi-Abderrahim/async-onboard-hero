-- Create a function to trigger the process-email-queue edge function
CREATE OR REPLACE FUNCTION trigger_process_email_queue()
RETURNS trigger AS $$
BEGIN
  -- Use pg_net to invoke the edge function asynchronously
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/process-email-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to process emails when new pending emails are added
DROP TRIGGER IF EXISTS on_email_queued ON email_queue;
CREATE TRIGGER on_email_queued
  AFTER INSERT ON email_queue
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION trigger_process_email_queue();

-- Also create a scheduled job to process any stuck emails every 5 minutes
SELECT cron.schedule(
  'process-email-queue-job',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/process-email-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);