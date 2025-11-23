-- Add user_id column to clients table (nullable, no foreign key yet)
ALTER TABLE clients ADD COLUMN user_id UUID;

-- Create index for performance
CREATE INDEX idx_clients_user_id ON clients(user_id);

-- Backfill user_id by matching client email to auth.users email
UPDATE clients c
SET user_id = au.id
FROM auth.users au
WHERE c.email = au.email AND c.user_id IS NULL;

-- Now add the foreign key constraint
ALTER TABLE clients 
ADD CONSTRAINT clients_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update RLS policies to use user_id instead of id
DROP POLICY IF EXISTS "Clients can view their own record" ON clients;
DROP POLICY IF EXISTS "Clients can update their own record" ON clients;

CREATE POLICY "Clients can view their own records"
ON clients
FOR SELECT
USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Clients can update their own records"
ON clients
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());