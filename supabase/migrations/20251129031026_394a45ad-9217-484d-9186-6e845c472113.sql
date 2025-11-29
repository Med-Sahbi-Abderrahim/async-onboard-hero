-- Create function to notify organization about new client requests
CREATE OR REPLACE FUNCTION public.notify_org_new_client_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_name TEXT;
  v_request_type_display TEXT;
BEGIN
  -- Get client name
  SELECT COALESCE(full_name, email) INTO v_client_name
  FROM clients
  WHERE id = NEW.client_id;
  
  -- Format request type for display
  v_request_type_display := CASE NEW.request_type
    WHEN 'meeting' THEN 'Meeting Request'
    WHEN 'change_request' THEN 'Change Request'
    WHEN 'contract' THEN 'Contract Request'
    WHEN 'task' THEN 'Task Request'
    WHEN 'file_access' THEN 'File Access Request'
    ELSE 'Request'
  END;
  
  -- Create notification for all organization members
  PERFORM create_notification_for_org(
    NEW.organization_id,
    'client_request',
    v_request_type_display || ' from Client',
    v_client_name || ' submitted: ' || NEW.title,
    jsonb_build_object(
      'request_id', NEW.id,
      'client_id', NEW.client_id,
      'request_type', NEW.request_type,
      'title', NEW.title
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new client requests
DROP TRIGGER IF EXISTS trigger_notify_org_new_client_request ON client_requests;
CREATE TRIGGER trigger_notify_org_new_client_request
  AFTER INSERT ON client_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_org_new_client_request();