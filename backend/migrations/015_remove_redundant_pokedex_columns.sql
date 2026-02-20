-- Migration 015: Remove redundant columns from pokedex table
-- These columns are already in pokemon_master and cause data duplication
-- Date: 2025-12-06

BEGIN;

-- Step 1: Verify that pokemon_master has all necessary data
-- Check for any pokedex entries without a corresponding pokemon_master entry
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM pokedex p
    LEFT JOIN pokemon_master pm ON p.pokemon_id = pm.pokemon_id
    WHERE pm.pokemon_id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE EXCEPTION 'Found % pokedex entries without corresponding pokemon_master records. Fix data first!', orphaned_count;
    END IF;
    
    RAISE NOTICE 'Data integrity check passed. All pokedex entries have pokemon_master records.';
END $$;

-- Step 2: Drop redundant columns from pokedex table
-- These are now referenced via JOIN with pokemon_master
ALTER TABLE pokedex DROP COLUMN IF EXISTS name CASCADE;
ALTER TABLE pokedex DROP COLUMN IF EXISTS name_fr CASCADE;
ALTER TABLE pokedex DROP COLUMN IF EXISTS name_en CASCADE;
ALTER TABLE pokedex DROP COLUMN IF EXISTS name_de CASCADE;
ALTER TABLE pokedex DROP COLUMN IF EXISTS name_it CASCADE;
ALTER TABLE pokedex DROP COLUMN IF EXISTS name_pt CASCADE;
ALTER TABLE pokedex DROP COLUMN IF EXISTS image_url CASCADE;

-- Step 3: Add comment to document the change
COMMENT ON TABLE pokedex IS 'User Pokemon collection. Names and images are in pokemon_master (JOIN required). Migrated 2025-12-06 to remove redundancy.';

COMMIT;

-- Note: Run VACUUM FULL pokedex; manually after migration to reclaim disk space
-- (VACUUM cannot run inside a transaction block)

-- Verification query to run after migration:
-- SELECT p.pokemon_id, pm.name_fr, pm.image_url, p.has_shiny 
-- FROM pokedex p 
-- INNER JOIN pokemon_master pm ON p.pokemon_id = pm.pokemon_id 
-- LIMIT 5;
