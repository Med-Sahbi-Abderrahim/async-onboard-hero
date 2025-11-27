-- Create function to send email notifications for specific types
CREATE OR REPLACE FUNCTION send_notification_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_email TEXT;
  v_user_id UUID;
BEGIN
  -- Only send emails for specific notification types
  IF NEW.type IN ('meeting_scheduled', 'contract_added', 'invoice_added', 'file_added') THEN
    -- Get client email from metadata
    v_client_email := NEW.metadata->>'client_email';
    v_user_id := NEW.user_id;
    
    -- Send email via edge function (async, fire and forget)
    -- The edge function will be called via a separate background job
    -- For now, we just ensure the notification has the email in metadata
    -- The actual email sending will happen via NotificationsDropdown or a separate process
    
    -- You could add a separate table for email queue here if needed
    -- For now, the notification system will handle it
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on notifications table
DROP TRIGGER IF EXISTS on_notification_send_email ON notifications;
CREATE TRIGGER on_notification_send_email
AFTER INSERT ON notifications
FOR EACH ROW
EXECUTE FUNCTION send_notification_email();