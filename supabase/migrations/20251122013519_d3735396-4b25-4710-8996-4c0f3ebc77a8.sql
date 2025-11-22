-- Update the cron job to use hardcoded values instead of runtime settings
-- First, unschedule the existing job
SELECT cron.unschedule('transition-early-access-daily');

-- Recreate the cron job with hardcoded values
SELECT cron.schedule(
  'transition-early-access-daily',
  '0 0 * * *', -- Run at midnight every day
  $$
  SELECT
    net.http_post(
        url:='https://xcvupdkdrrqjrgjzvhoy.supabase.co/functions/v1/transition-early-access',
        headers:=jsonb_build_object(
          'Content-Type', 'application/json', 
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjdnVwZGtkcnJxanJnanp2aG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNTA1ODEsImV4cCI6MjA3NjgyNjU4MX0.U-9eAhTlQZWyoADxh69poA6V_bg9swACUhN7U5_10ZI'
        ),
        body:=jsonb_build_object('time', now())
    ) as request_id;
  $$
);