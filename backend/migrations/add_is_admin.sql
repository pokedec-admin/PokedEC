-- Migration: Add is_admin field to users table
-- Run this script to add admin functionality

-- Add is_admin column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Set Admin_YOUR_DOMAIN as admin
UPDATE users SET is_admin = TRUE WHERE email = 'admin@YOUR_DOMAIN.com';

-- Verify
SELECT id, email, trainer_name, is_admin FROM users WHERE is_admin = TRUE;
