-- Fix column name mismatch in triggers (form_id -> intake_form_id)

-- Update increment_form_submission_count function
CREATE OR REPLACE FUNCTION public.increment_form_submission_count()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE intake_forms
    SET submission_count = submission_count + 1
    WHERE id = NEW.intake_form_id;
    
    RETURN NEW;
END;
$function$;

-- Update log_form_submission_created function
CREATE OR REPLACE FUNCTION public.log_form_submission_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO activity_logs (
        organization_id,
        client_id,
        action,
        entity_type,
        entity_id,
        description,
        metadata
    ) VALUES (
        NEW.organization_id,
        NEW.client_id,
        'submitted',
        'submission',
        NEW.id,
        'Client submitted intake form',
        jsonb_build_object(
            'form_id', NEW.intake_form_id,
            'status', NEW.status,
            'completion', NEW.completion_percentage
        )
    );
    
    RETURN NEW;
END;
$function$;