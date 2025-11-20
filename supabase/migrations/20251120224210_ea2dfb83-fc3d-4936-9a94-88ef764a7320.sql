-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization members
CREATE POLICY "Members can view tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  is_organization_member(organization_id, auth.uid()) 
  AND deleted_at IS NULL
);

CREATE POLICY "Members can create tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Members can update tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (is_organization_member(organization_id, auth.uid()))
WITH CHECK (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Members can delete tasks"
ON public.tasks
FOR DELETE
TO authenticated
USING (is_organization_member(organization_id, auth.uid()));

-- RLS Policies for clients
CREATE POLICY "Clients can view their own tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  client_id = auth.uid() 
  AND deleted_at IS NULL
);

CREATE POLICY "Clients can update their task status"
ON public.tasks
FOR UPDATE
TO authenticated
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_tasks_organization_id ON public.tasks(organization_id);
CREATE INDEX idx_tasks_client_id ON public.tasks(client_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);