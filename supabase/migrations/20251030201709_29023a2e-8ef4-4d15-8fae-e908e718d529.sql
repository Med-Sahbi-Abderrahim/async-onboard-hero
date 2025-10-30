-- Create storage bucket for client uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-uploads', 'client-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for client uploads
CREATE POLICY "Clients can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'client-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Clients can view their own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'client-uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Members can view all client uploads"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'client-uploads'
  AND EXISTS (
    SELECT 1 FROM clients c
    WHERE c.access_token IS NOT NULL
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
);

-- Client files table
CREATE TABLE public.client_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  file_name VARCHAR NOT NULL,
  file_type VARCHAR NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.client_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own files"
ON public.client_files FOR SELECT
USING (client_id IN (
  SELECT id FROM clients WHERE access_token IS NOT NULL
));

CREATE POLICY "Members can manage client files"
ON public.client_files FOR ALL
USING (is_organization_member(organization_id, auth.uid()));

-- Contracts table
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  file_path TEXT,
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'rejected')),
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own contracts"
ON public.contracts FOR SELECT
USING (client_id IN (
  SELECT id FROM clients WHERE access_token IS NOT NULL
));

CREATE POLICY "Clients can update contract status"
ON public.contracts FOR UPDATE
USING (client_id IN (
  SELECT id FROM clients WHERE access_token IS NOT NULL
))
WITH CHECK (client_id IN (
  SELECT id FROM clients WHERE access_token IS NOT NULL
));

CREATE POLICY "Members can manage contracts"
ON public.contracts FOR ALL
USING (is_organization_member(organization_id, auth.uid()));

-- Invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_number VARCHAR NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR NOT NULL DEFAULT 'USD',
  due_date DATE NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  description TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own invoices"
ON public.invoices FOR SELECT
USING (client_id IN (
  SELECT id FROM clients WHERE access_token IS NOT NULL
));

CREATE POLICY "Members can manage invoices"
ON public.invoices FOR ALL
USING (is_organization_member(organization_id, auth.uid()));

-- Meetings table
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  notes TEXT,
  meeting_link TEXT,
  status VARCHAR NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own meetings"
ON public.meetings FOR SELECT
USING (client_id IN (
  SELECT id FROM clients WHERE access_token IS NOT NULL
));

CREATE POLICY "Members can manage meetings"
ON public.meetings FOR ALL
USING (is_organization_member(organization_id, auth.uid()));

-- Feedback table
CREATE TABLE public.client_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.client_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can create their own feedback"
ON public.client_feedback FOR INSERT
WITH CHECK (client_id IN (
  SELECT id FROM clients WHERE access_token IS NOT NULL
));

CREATE POLICY "Clients can view their own feedback"
ON public.client_feedback FOR SELECT
USING (client_id IN (
  SELECT id FROM clients WHERE access_token IS NOT NULL
));

CREATE POLICY "Members can view feedback"
ON public.client_feedback FOR SELECT
USING (is_organization_member(organization_id, auth.uid()));

-- Add project info to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS project_title VARCHAR,
ADD COLUMN IF NOT EXISTS project_status VARCHAR DEFAULT 'active' CHECK (project_status IN ('active', 'on-hold', 'completed', 'cancelled'));

-- Create indexes for better performance
CREATE INDEX idx_client_files_client ON public.client_files(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contracts_client ON public.contracts(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_client ON public.invoices(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_meetings_client ON public.meetings(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_feedback_client ON public.client_feedback(client_id) WHERE deleted_at IS NULL;