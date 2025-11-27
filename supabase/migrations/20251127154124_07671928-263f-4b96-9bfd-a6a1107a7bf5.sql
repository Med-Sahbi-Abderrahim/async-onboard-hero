-- Upgrade contracts system for e-signature capability
-- Carefully ordered to avoid constraint violations

-- Step 1: Create enum for contract types
CREATE TYPE contract_type AS ENUM (
  'nda',
  'service_agreement',
  'consulting_agreement',
  'master_service_agreement',
  'sow',
  'amendment',
  'other'
);

-- Step 2: Drop existing constraint temporarily
ALTER TABLE contracts 
  DROP CONSTRAINT IF EXISTS contracts_status_check;

-- Step 3: Add new columns WITHOUT constraint
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS contract_type contract_type DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS effective_date DATE,
  ADD COLUMN IF NOT EXISTS expiration_date DATE,
  ADD COLUMN IF NOT EXISTS amount_cents INTEGER,
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS signature_fields JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS file_type VARCHAR(50);

-- Step 4: Update existing contract statuses to match new values
UPDATE contracts 
SET status = 'pending_signature' 
WHERE status = 'pending';

UPDATE contracts 
SET status = 'cancelled' 
WHERE status = 'rejected';

-- Step 5: Now add the constraint after data is migrated
ALTER TABLE contracts
  ADD CONSTRAINT contracts_status_check 
  CHECK (status IN ('draft', 'pending_signature', 'signed', 'cancelled'));

-- Update status default to draft
ALTER TABLE contracts 
  ALTER COLUMN status SET DEFAULT 'draft';

-- Create contract_signatures table
CREATE TABLE IF NOT EXISTS contract_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  signer_user_id UUID REFERENCES auth.users(id),
  signer_email VARCHAR(255) NOT NULL,
  signer_name VARCHAR(255) NOT NULL,
  signer_role VARCHAR(50),
  signature_data TEXT,
  signature_type VARCHAR(20) DEFAULT 'drawn',
  signed_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contract_signatures_contract ON contract_signatures(contract_id);
CREATE INDEX idx_contract_signatures_signer ON contract_signatures(signer_user_id);

ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contract_signatures
CREATE POLICY "Members can view contract signatures"
ON contract_signatures FOR SELECT
USING (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Clients can view their contract signatures"
ON contract_signatures FOR SELECT
USING (
  signer_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM clients
    WHERE clients.user_id = auth.uid()
    AND clients.id = (SELECT client_id FROM contracts WHERE id = contract_signatures.contract_id)
  )
);

CREATE POLICY "Members can create signature requirements"
ON contract_signatures FOR INSERT
WITH CHECK (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Signers can add their signature"
ON contract_signatures FOR UPDATE
USING (signer_user_id = auth.uid() OR (signer_email = auth.email() AND signed_at IS NULL))
WITH CHECK (signer_user_id = auth.uid() OR signer_email = auth.email());

CREATE POLICY "Members can delete unsigned signatures"
ON contract_signatures FOR DELETE
USING (is_organization_member(organization_id, auth.uid()) AND signed_at IS NULL);

-- Create storage bucket for contracts
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Members can upload contracts" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contracts'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM organizations WHERE is_organization_member(id, auth.uid())
  )
);

CREATE POLICY "Members can view org contracts" ON storage.objects FOR SELECT
USING (
  bucket_id = 'contracts'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM organizations WHERE is_organization_member(id, auth.uid())
  )
);

CREATE POLICY "Clients can view their contracts" ON storage.objects FOR SELECT
USING (
  bucket_id = 'contracts'
  AND (storage.foldername(name))[2] IN (
    SELECT id::text FROM contracts WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Members can update contracts" ON storage.objects FOR UPDATE
USING (
  bucket_id = 'contracts'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM organizations WHERE is_organization_member(id, auth.uid())
  )
);

CREATE POLICY "Members can delete contracts" ON storage.objects FOR DELETE
USING (
  bucket_id = 'contracts'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM organizations WHERE is_organization_member(id, auth.uid())
  )
);

-- Trigger to auto-complete contract when all signatures are done
CREATE OR REPLACE FUNCTION check_contract_signatures_complete()
RETURNS TRIGGER AS $$
DECLARE
  total_required INTEGER;
  total_signed INTEGER;
  contract_org_id UUID;
BEGIN
  SELECT organization_id INTO contract_org_id FROM contracts WHERE id = NEW.contract_id;
  SELECT COUNT(*) INTO total_required FROM contract_signatures WHERE contract_id = NEW.contract_id AND is_required = true;
  SELECT COUNT(*) INTO total_signed FROM contract_signatures WHERE contract_id = NEW.contract_id AND is_required = true AND signed_at IS NOT NULL;
  
  IF total_required > 0 AND total_signed = total_required THEN
    UPDATE contracts SET status = 'signed', signed_at = NOW() WHERE id = NEW.contract_id;
    PERFORM create_notification_for_org(contract_org_id, 'contract_signed', 'Contract Fully Signed', 'All parties have signed the contract', jsonb_build_object('contract_id', NEW.contract_id));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_check_signatures_complete
AFTER INSERT OR UPDATE OF signed_at ON contract_signatures
FOR EACH ROW EXECUTE FUNCTION check_contract_signatures_complete();

CREATE TRIGGER update_contract_signatures_updated_at
BEFORE UPDATE ON contract_signatures
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();