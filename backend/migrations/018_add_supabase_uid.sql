-- Migration: Add supabase_uid column to link backend users with Supabase Auth
-- This allows a smooth transition from backend-managed auth to Supabase Auth

ALTER TABLE users ADD COLUMN supabase_uid UUID UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_users_supabase_uid ON users(supabase_uid);

-- Add comment for documentation
COMMENT ON COLUMN users.supabase_uid IS 'UUID from Supabase Auth service. Links this user to their Supabase authentication record.';
