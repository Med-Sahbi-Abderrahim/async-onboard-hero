-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Clients can view their meetings" ON meetings;
DROP POLICY IF EXISTS "Clients can view their contracts" ON contracts;
DROP POLICY IF EXISTS "Clients can view their invoices" ON invoices;
DROP POLICY IF EXISTS "Clients can view their files" ON client_files;

-- Add SELECT policies for clients to view their meetings, contracts, invoices, and files

-- Meetings: Clients can view their own meetings OR shared meetings
CREATE POLICY "Clients can view their meetings"
ON meetings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = meetings.client_id
    AND (clients.user_id = auth.uid() OR lower(clients.email) = lower(auth.email()))
  )
  OR is_shared_with_all_clients = true
);

-- Contracts: Clients can view their own contracts OR shared contracts
CREATE POLICY "Clients can view their contracts"
ON contracts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = contracts.client_id
    AND (clients.user_id = auth.uid() OR lower(clients.email) = lower(auth.email()))
  )
  OR is_shared_with_all_clients = true
);

-- Invoices: Clients can view their own invoices OR shared invoices
CREATE POLICY "Clients can view their invoices"
ON invoices
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = invoices.client_id
    AND (clients.user_id = auth.uid() OR lower(clients.email) = lower(auth.email()))
  )
  OR is_shared_with_all_clients = true
);

-- Client Files: Clients can view their own files OR shared files
CREATE POLICY "Clients can view their files"
ON client_files
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = client_files.client_id
    AND (clients.user_id = auth.uid() OR lower(clients.email) = lower(auth.email()))
  )
  OR is_shared_with_all_clients = true
);

-- Create notification functions for when org adds items to clients
CREATE OR REPLACE FUNCTION notify_client_new_meeting()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_email TEXT;
  v_client_name TEXT;
BEGIN
  -- Get client email
  SELECT email, full_name INTO v_client_email, v_client_name
  FROM clients
  WHERE id = NEW.client_id;
  
  -- Only notify if it's a specific client (not shared with all)
  IF v_client_email IS NOT NULL AND NEW.is_shared_with_all_clients = false THEN
    -- Create notification
    INSERT INTO notifications (
      organization_id,
      user_id,
      type,
      title,
      message,
      metadata
    )
    SELECT 
      NEW.organization_id,
      clients.user_id,
      'meeting_scheduled',
      'New Meeting Scheduled',
      'A new meeting "' || NEW.title || '" has been scheduled for ' || to_char(NEW.scheduled_at, 'Mon DD, YYYY at HH:MI AM'),
      jsonb_build_object('meeting_id', NEW.id, 'client_email', v_client_email)
    FROM clients
    WHERE clients.id = NEW.client_id AND clients.user_id IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION notify_client_new_contract()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_email TEXT;
  v_client_name TEXT;
BEGIN
  SELECT email, full_name INTO v_client_email, v_client_name
  FROM clients
  WHERE id = NEW.client_id;
  
  IF v_client_email IS NOT NULL AND NEW.is_shared_with_all_clients = false THEN
    INSERT INTO notifications (
      organization_id,
      user_id,
      type,
      title,
      message,
      metadata
    )
    SELECT 
      NEW.organization_id,
      clients.user_id,
      'contract_added',
      'New Contract Added',
      'A new contract "' || NEW.title || '" has been added for you',
      jsonb_build_object('contract_id', NEW.id, 'client_email', v_client_email)
    FROM clients
    WHERE clients.id = NEW.client_id AND clients.user_id IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION notify_client_new_invoice()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_email TEXT;
  v_client_name TEXT;
BEGIN
  SELECT email, full_name INTO v_client_email, v_client_name
  FROM clients
  WHERE id = NEW.client_id;
  
  IF v_client_email IS NOT NULL AND NEW.is_shared_with_all_clients = false THEN
    INSERT INTO notifications (
      organization_id,
      user_id,
      type,
      title,
      message,
      metadata
    )
    SELECT 
      NEW.organization_id,
      clients.user_id,
      'invoice_added',
      'New Invoice Added',
      'A new invoice #' || NEW.invoice_number || ' for $' || (NEW.amount_cents::FLOAT / 100)::TEXT || ' has been added',
      jsonb_build_object('invoice_id', NEW.id, 'client_email', v_client_email)
    FROM clients
    WHERE clients.id = NEW.client_id AND clients.user_id IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION notify_client_new_file()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_email TEXT;
  v_client_name TEXT;
BEGIN
  SELECT email, full_name INTO v_client_email, v_client_name
  FROM clients
  WHERE id = NEW.client_id;
  
  IF v_client_email IS NOT NULL AND NEW.is_shared_with_all_clients = false THEN
    INSERT INTO notifications (
      organization_id,
      user_id,
      type,
      title,
      message,
      metadata
    )
    SELECT 
      NEW.organization_id,
      clients.user_id,
      'file_added',
      'New File Added',
      'A new file "' || NEW.file_name || '" has been shared with you',
      jsonb_build_object('file_id', NEW.id, 'client_email', v_client_email)
    FROM clients
    WHERE clients.id = NEW.client_id AND clients.user_id IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS on_meeting_created_notify_client ON meetings;
CREATE TRIGGER on_meeting_created_notify_client
AFTER INSERT ON meetings
FOR EACH ROW
EXECUTE FUNCTION notify_client_new_meeting();

DROP TRIGGER IF EXISTS on_contract_created_notify_client ON contracts;
CREATE TRIGGER on_contract_created_notify_client
AFTER INSERT ON contracts
FOR EACH ROW
EXECUTE FUNCTION notify_client_new_contract();

DROP TRIGGER IF EXISTS on_invoice_created_notify_client ON invoices;
CREATE TRIGGER on_invoice_created_notify_client
AFTER INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION notify_client_new_invoice();

DROP TRIGGER IF EXISTS on_file_created_notify_client ON client_files;
CREATE TRIGGER on_file_created_notify_client
AFTER INSERT ON client_files
FOR EACH ROW
EXECUTE FUNCTION notify_client_new_file();