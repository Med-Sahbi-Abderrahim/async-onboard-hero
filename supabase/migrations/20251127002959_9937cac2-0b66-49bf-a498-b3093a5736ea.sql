-- Update notification functions to also send emails via edge function

CREATE OR REPLACE FUNCTION notify_client_new_meeting()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_email TEXT;
  v_client_name TEXT;
  v_client_user_id UUID;
BEGIN
  -- Get client info
  SELECT email, full_name, user_id INTO v_client_email, v_client_name, v_client_user_id
  FROM clients
  WHERE id = NEW.client_id;
  
  -- Only notify if it's a specific client (not shared with all)
  IF v_client_email IS NOT NULL AND NEW.is_shared_with_all_clients = false THEN
    -- Create in-app notification
    IF v_client_user_id IS NOT NULL THEN
      INSERT INTO notifications (
        organization_id,
        user_id,
        type,
        title,
        message,
        metadata
      )
      VALUES (
        NEW.organization_id,
        v_client_user_id,
        'meeting_scheduled',
        'New Meeting Scheduled',
        'A new meeting "' || NEW.title || '" has been scheduled for ' || to_char(NEW.scheduled_at, 'Mon DD, YYYY at HH:MI AM'),
        jsonb_build_object(
          'meeting_id', NEW.id,
          'client_email', v_client_email,
          'meeting_title', NEW.title,
          'meeting_date', to_char(NEW.scheduled_at, 'Mon DD, YYYY at HH:MI AM')
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION notify_client_new_contract()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_email TEXT;
  v_client_name TEXT;
  v_client_user_id UUID;
BEGIN
  SELECT email, full_name, user_id INTO v_client_email, v_client_name, v_client_user_id
  FROM clients
  WHERE id = NEW.client_id;
  
  IF v_client_email IS NOT NULL AND NEW.is_shared_with_all_clients = false THEN
    IF v_client_user_id IS NOT NULL THEN
      INSERT INTO notifications (
        organization_id,
        user_id,
        type,
        title,
        message,
        metadata
      )
      VALUES (
        NEW.organization_id,
        v_client_user_id,
        'contract_added',
        'New Contract Added',
        'A new contract "' || NEW.title || '" has been added for you',
        jsonb_build_object(
          'contract_id', NEW.id,
          'client_email', v_client_email,
          'contract_title', NEW.title
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION notify_client_new_invoice()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_email TEXT;
  v_client_name TEXT;
  v_client_user_id UUID;
BEGIN
  SELECT email, full_name, user_id INTO v_client_email, v_client_name, v_client_user_id
  FROM clients
  WHERE id = NEW.client_id;
  
  IF v_client_email IS NOT NULL AND NEW.is_shared_with_all_clients = false THEN
    IF v_client_user_id IS NOT NULL THEN
      INSERT INTO notifications (
        organization_id,
        user_id,
        type,
        title,
        message,
        metadata
      )
      VALUES (
        NEW.organization_id,
        v_client_user_id,
        'invoice_added',
        'New Invoice Added',
        'A new invoice #' || NEW.invoice_number || ' for $' || (NEW.amount_cents::FLOAT / 100)::TEXT || ' has been added',
        jsonb_build_object(
          'invoice_id', NEW.id,
          'client_email', v_client_email,
          'invoice_number', NEW.invoice_number,
          'invoice_amount', '$' || (NEW.amount_cents::FLOAT / 100)::TEXT
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION notify_client_new_file()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_email TEXT;
  v_client_name TEXT;
  v_client_user_id UUID;
BEGIN
  SELECT email, full_name, user_id INTO v_client_email, v_client_name, v_client_user_id
  FROM clients
  WHERE id = NEW.client_id;
  
  IF v_client_email IS NOT NULL AND NEW.is_shared_with_all_clients = false THEN
    IF v_client_user_id IS NOT NULL THEN
      INSERT INTO notifications (
        organization_id,
        user_id,
        type,
        title,
        message,
        metadata
      )
      VALUES (
        NEW.organization_id,
        v_client_user_id,
        'file_added',
        'New File Added',
        'A new file "' || NEW.file_name || '" has been shared with you',
        jsonb_build_object(
          'file_id', NEW.id,
          'client_email', v_client_email,
          'file_name', NEW.file_name
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;