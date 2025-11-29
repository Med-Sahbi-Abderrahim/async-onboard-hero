-- Function to auto-create client signature requirement
CREATE OR REPLACE FUNCTION public.auto_create_client_signature()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_client_email TEXT;
  v_client_name TEXT;
BEGIN
  -- Only create signature requirement if contract needs signing
  IF NEW.status IN ('pending_signature', 'draft') THEN
    -- Get client details
    SELECT email, COALESCE(full_name, email) INTO v_client_email, v_client_name
    FROM clients
    WHERE id = NEW.client_id;
    
    -- Create signature requirement for the client
    IF v_client_email IS NOT NULL THEN
      INSERT INTO contract_signatures (
        contract_id,
        organization_id,
        signer_email,
        signer_name,
        signer_role,
        is_required,
        order_index
      ) VALUES (
        NEW.id,
        NEW.organization_id,
        v_client_email,
        v_client_name,
        'client',
        true,
        0
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create signature requirements
DROP TRIGGER IF EXISTS trigger_auto_create_client_signature ON contracts;
CREATE TRIGGER trigger_auto_create_client_signature
  AFTER INSERT ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_client_signature();

-- Backfill existing contracts that need signatures but don't have them
INSERT INTO contract_signatures (
  contract_id,
  organization_id,
  signer_email,
  signer_name,
  signer_role,
  is_required,
  order_index
)
SELECT 
  c.id,
  c.organization_id,
  cl.email,
  COALESCE(cl.full_name, cl.email),
  'client',
  true,
  0
FROM contracts c
JOIN clients cl ON c.client_id = cl.id
WHERE c.status IN ('pending_signature', 'draft', 'signed')
  AND c.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM contract_signatures cs
    WHERE cs.contract_id = c.id
  )
ON CONFLICT DO NOTHING;