-- Add preferred_language column to users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trainers' AND column_name = 'preferred_language'
    ) THEN
        ALTER TABLE trainers ADD COLUMN preferred_language VARCHAR(10) DEFAULT 'fr';
    END IF;
END $$;

-- Verify
SELECT id, email, trainer_name, preferred_language FROM trainers LIMIT 5;
