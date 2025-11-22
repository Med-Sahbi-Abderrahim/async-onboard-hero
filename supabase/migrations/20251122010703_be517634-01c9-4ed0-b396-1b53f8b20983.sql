-- Create enums for user status and plan types
CREATE TYPE public.user_status AS ENUM ('early_access', 'free_trial', 'active', 'suspended');
CREATE TYPE public.plan_type AS ENUM ('free', 'starter', 'pro', 'enterprise');

-- Create early_access_invites table
CREATE TABLE public.early_access_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Add new columns to users table
ALTER TABLE public.users
ADD COLUMN status user_status DEFAULT 'active',
ADD COLUMN plan plan_type DEFAULT 'free',
ADD COLUMN early_access_end_date TIMESTAMPTZ,
ADD COLUMN trial_start_date TIMESTAMPTZ,
ADD COLUMN trial_end_date TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX idx_users_early_access_end_date ON public.users(early_access_end_date) WHERE early_access_end_date IS NOT NULL;
CREATE INDEX idx_users_trial_end_date ON public.users(trial_end_date) WHERE trial_end_date IS NOT NULL;
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_early_access_invites_code ON public.early_access_invites(code) WHERE is_active = true;

-- Enable RLS on early_access_invites
ALTER TABLE public.early_access_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for early_access_invites
CREATE POLICY "Admins can view invites"
ON public.early_access_invites
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

CREATE POLICY "Admins can create invites"
ON public.early_access_invites
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Function to validate and use an early access invite code
CREATE OR REPLACE FUNCTION public.use_early_access_invite(invite_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
  result JSONB;
BEGIN
  -- Find and lock the invite
  SELECT * INTO invite_record
  FROM early_access_invites
  WHERE code = invite_code
    AND is_active = true
    AND expires_at > NOW()
    AND (max_uses IS NULL OR used_count < max_uses)
  FOR UPDATE;

  -- Check if invite exists and is valid
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid or expired invite code'
    );
  END IF;

  -- Increment used count
  UPDATE early_access_invites
  SET used_count = used_count + 1
  WHERE id = invite_record.id;

  -- Return success with plan details
  RETURN jsonb_build_object(
    'valid', true,
    'plan', 'pro',
    'status', 'early_access',
    'early_access_days', 30
  );
END;
$$;

-- Function to get remaining early access days for a user
CREATE OR REPLACE FUNCTION public.get_early_access_days_remaining(user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN status = 'early_access' AND early_access_end_date IS NOT NULL
    THEN GREATEST(0, EXTRACT(DAY FROM early_access_end_date - NOW())::INTEGER)
    ELSE 0
  END
  FROM users
  WHERE id = user_id;
$$;