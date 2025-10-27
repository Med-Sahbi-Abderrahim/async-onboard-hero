-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read) WHERE is_read = false;

-- Enable realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Function to create notification for organization members
CREATE OR REPLACE FUNCTION public.create_notification_for_org(
  p_organization_id UUID,
  p_type VARCHAR,
  p_title TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notifications (organization_id, user_id, type, title, message, metadata)
  SELECT 
    p_organization_id,
    om.user_id,
    p_type,
    p_title,
    p_message,
    p_metadata
  FROM organization_members om
  WHERE om.organization_id = p_organization_id;
END;
$$;

-- Trigger to notify when client is created
CREATE OR REPLACE FUNCTION public.notify_client_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM create_notification_for_org(
    NEW.organization_id,
    'client_added',
    'New client added',
    'A new client "' || COALESCE(NEW.full_name, NEW.email) || '" has been added',
    jsonb_build_object('client_id', NEW.id, 'client_name', NEW.full_name)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_client_created
  AFTER INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_client_created();

-- Trigger to notify when form is submitted
CREATE OR REPLACE FUNCTION public.notify_form_submitted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_name TEXT;
  v_form_title TEXT;
BEGIN
  -- Get client and form details
  SELECT c.full_name, f.title INTO v_client_name, v_form_title
  FROM clients c, intake_forms f
  WHERE c.id = NEW.client_id AND f.id = NEW.intake_form_id;
  
  PERFORM create_notification_for_org(
    NEW.organization_id,
    'form_submitted',
    'Form submission received',
    'Client "' || COALESCE(v_client_name, 'Unknown') || '" submitted "' || COALESCE(v_form_title, 'a form') || '"',
    jsonb_build_object(
      'submission_id', NEW.id,
      'client_id', NEW.client_id,
      'form_id', NEW.intake_form_id,
      'status', NEW.status
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_form_submitted
  AFTER INSERT ON public.form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_form_submitted();

-- Trigger to notify when reminder is sent
CREATE OR REPLACE FUNCTION public.notify_reminder_sent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_name TEXT;
BEGIN
  SELECT full_name INTO v_client_name
  FROM clients
  WHERE id = NEW.client_id;
  
  PERFORM create_notification_for_org(
    NEW.organization_id,
    'reminder_sent',
    'Form reminder sent',
    'Reminder sent to "' || COALESCE(v_client_name, 'client') || '"',
    jsonb_build_object(
      'reminder_id', NEW.id,
      'client_id', NEW.client_id,
      'reminder_type', NEW.reminder_type
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_reminder_sent
  AFTER INSERT ON public.reminder_logs
  FOR EACH ROW
  WHEN (NEW.email_status = 'sent')
  EXECUTE FUNCTION public.notify_reminder_sent();

-- Trigger to notify when submission is incomplete
CREATE OR REPLACE FUNCTION public.notify_incomplete_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_name TEXT;
  v_form_title TEXT;
BEGIN
  -- Only notify if status changed to pending and completion is low
  IF NEW.status = 'pending' AND NEW.completion_percentage < 100 AND 
     (OLD.status IS NULL OR OLD.status != 'pending' OR OLD.completion_percentage >= 100) THEN
    
    SELECT c.full_name, f.title INTO v_client_name, v_form_title
    FROM clients c, intake_forms f
    WHERE c.id = NEW.client_id AND f.id = NEW.intake_form_id;
    
    PERFORM create_notification_for_org(
      NEW.organization_id,
      'submission_incomplete',
      'Incomplete form submission',
      'Client "' || COALESCE(v_client_name, 'Unknown') || '" has an incomplete submission for "' || COALESCE(v_form_title, 'a form') || '"',
      jsonb_build_object(
        'submission_id', NEW.id,
        'client_id', NEW.client_id,
        'form_id', NEW.intake_form_id,
        'completion_percentage', NEW.completion_percentage
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_incomplete_submission
  AFTER INSERT OR UPDATE ON public.form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_incomplete_submission();