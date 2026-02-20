-- Migration script for BLUE-GREEN database
-- Adds email verification system schema changes

-- 1. Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- 2. Create email_verification_codes table
CREATE TABLE IF NOT EXISTS email_verification_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT false,
    attempts INTEGER DEFAULT 0
);

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_verification_email ON email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_created_at ON email_verification_codes(created_at);

-- 4. Update existing users to be active and email_verified
UPDATE users SET is_active = true WHERE is_active IS NULL;
UPDATE users SET email_verified = true WHERE email_verified IS NULL;

-- 5. Set default admin user to active (if exists)
UPDATE users SET is_admin = true, is_active = true, email_verified = true 
WHERE email = 'admin@YOUR_DOMAIN.com' OR email = 'thebestcoyotte@fec.ch';

-- Verification
SELECT 'Users table columns:' as info;
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

SELECT 'Email verification table created:' as info;
SELECT COUNT(*) as table_exists FROM information_schema.tables 
WHERE table_name = 'email_verification_codes';
