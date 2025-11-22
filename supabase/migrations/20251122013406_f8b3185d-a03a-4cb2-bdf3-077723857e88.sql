-- Set up cron job to run early access transition daily at midnight
-- This requires pg_cron and pg_net extensions to be enabled

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to run the transition function daily at midnight UTC
SELECT cron.schedule(
  'transition-early-access-daily',
  '0 0 * * *', -- Run at midnight every day
  $$
  SELECT
    net.http_post(
        url:=current_setting('app.settings.supabase_url') || '/functions/v1/transition-early-access',
        headers:=jsonb_build_object(
          'Content-Type', 'application/json', 
          'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
        ),
        body:=jsonb_build_object('time', now())
    ) as request_id;
  $$
);

-- Store the Supabase URL and anon key as runtime settings
-- Note: These need to be set with actual values after migration
-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://xcvupdkdrrqjrgjzvhoy.supabase.co';
-- ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'your_anon_key_here';