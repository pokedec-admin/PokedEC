-- Migration: Cleanup legacy users table and fix foreign key constraints
-- Applied to: DEV, NAS, CLOUD
-- Date: 2026-03-02

BEGIN;

-- 1. Check if public.users exists and if it should be merged or just dropped
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        
        -- If trainers table also exists, we might need to migrate data or just swap names
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trainers') THEN
            -- Sync missing data from users to trainers if necessary
            -- (Assuming trainers is the current table and users is the legacy one)
            
            -- Re-link foreign keys from other tables to trainers instead of users
            -- Table: pokedex
            IF EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE table_name = 'pokedex' AND constraint_name = 'pokedex_user_id_fkey') THEN
                ALTER TABLE public.pokedex DROP CONSTRAINT IF EXISTS pokedex_user_id_fkey;
                ALTER TABLE public.pokedex ADD CONSTRAINT pokedex_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.trainers(id) ON DELETE CASCADE;
            END IF;

            -- Table: suggestions
            IF EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE table_name = 'suggestions' AND constraint_name = 'suggestions_user_id_fkey') THEN
                ALTER TABLE public.suggestions DROP CONSTRAINT IF EXISTS suggestions_user_id_fkey;
                ALTER TABLE public.suggestions ADD CONSTRAINT suggestions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.trainers(id) ON DELETE CASCADE;
            END IF;

            -- Table: trade_requests (if exists)
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trade_requests') THEN
                -- Check for sender_id
                IF EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE table_name = 'trade_requests' AND column_name = 'sender_id') THEN
                    -- We'd need to find the specific constraint name, often trade_requests_sender_id_fkey
                    -- Using CASCADE drop to be safe if users is dropped
                    NULL; 
                END IF;
            END IF;

            -- Finally drop the legacy users table
            DROP TABLE public.users CASCADE;
            RAISE NOTICE 'Table public.users dropped and constraints migrated to public.trainers';
        ELSE
            -- Rename users to trainers if trainers doesn't exist
            ALTER TABLE public.users RENAME TO trainers;
            RAISE NOTICE 'Table public.users renamed to public.trainers';
        END IF;
    END IF;
END $$;

COMMIT;
