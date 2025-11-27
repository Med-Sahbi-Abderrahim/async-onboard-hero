-- Enable http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Update function to send email notifications via edge function
CREATE OR REPLACE FUNCTION send_notification_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_role_key TEXT;
  v_response extensions.http_response;
BEGIN
  -- Only send emails for specific notification types
  IF NEW.type IN ('meeting_scheduled', 'contract_added', 'invoice_added', 'file_added') THEN
    -- Get environment variables
    v_supabase_url := current_setting('app.settings.supabase_url', true);
    v_service_role_key := current_setting('app.settings.service_role_key', true);
    
    -- If env vars not set, use defaults (will be set via Supabase dashboard)
    IF v_supabase_url IS NULL THEN
      v_supabase_url := 'https://xcvupdkdrrqjrgjzvhoy.supabase.co';
    END IF;
    
    -- Call edge function to send email (fire and forget)
    BEGIN
      SELECT * INTO v_response FROM extensions.http((
        'POST',
        v_supabase_url || '/functions/v1/send-status-emails',
        ARRAY[
          extensions.http_header('Content-Type', 'application/json'),
          extensions.http_header('Authorization', 'Bearer ' || v_service_role_key)
        ],
        'application/json',
        jsonb_build_object(
          'type', NEW.type,
          'userId', NEW.user_id,
          'metadata', NEW.metadata
        )::text
      ));
      
      -- Log response for debugging
      RAISE NOTICE 'Email sent for notification %, status: %', NEW.id, v_response.status;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the transaction
      RAISE NOTICE 'Failed to send email for notification %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;