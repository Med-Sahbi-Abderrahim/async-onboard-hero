-- Fix link_clients_to_new_user trigger to read organization_id from metadata
CREATE OR REPLACE FUNCTION public.link_clients_to_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_org_id uuid;
BEGIN
  -- Get organization_id from user metadata
  v_org_id := (NEW.raw_user_meta_data->>'organization_id')::uuid;
  
  -- Only update if organization_id was provided in metadata
  IF v_org_id IS NOT NULL THEN
    UPDATE public.clients
    SET user_id = NEW.id,
        deleted_at = NULL
    WHERE LOWER(email) = LOWER(NEW.email)
      AND organization_id = v_org_id
      AND (user_id IS DISTINCT FROM NEW.id OR deleted_at IS NOT NULL);
  END IF;

  RETURN NEW;
END;
$function$;