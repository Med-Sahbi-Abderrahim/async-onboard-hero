-- Add preferences column to users table for notification settings
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb;