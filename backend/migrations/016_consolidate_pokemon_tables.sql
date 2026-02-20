-- Migration 016: Consolidate pokemon_names and pokemon_category_availability into pokemon_master
-- This eliminates redundancy and simplifies the schema
-- Date: 2025-12-06

BEGIN;

-- Step 1: Verify pokemon_master can accommodate all data
DO $$
DECLARE
    missing_count INTEGER;
BEGIN
    -- Check if all pokemon_names entries have a pokemon_master record
    SELECT COUNT(*) INTO missing_count
    FROM pokemon_names pn
    LEFT JOIN pokemon_master pm ON pn.pokemon_id = pm.pokemon_id
    WHERE pm.pokemon_id IS NULL;
    
    IF missing_count > 0 THEN
        RAISE EXCEPTION 'Found % pokemon_names entries without pokemon_master records!', missing_count;
    END IF;
    
    -- Check if all pokemon_category_availability entries have a pokemon_master record
    SELECT COUNT(*) INTO missing_count
    FROM pokemon_category_availability pca
    LEFT JOIN pokemon_master pm ON pca.pokemon_id = pm.pokemon_id
    WHERE pm.pokemon_id IS NULL;
    
    IF missing_count > 0 THEN
        RAISE EXCEPTION 'Found % pokemon_category_availability entries without pokemon_master records!', missing_count;
    END IF;
    
    RAISE NOTICE 'Data integrity check passed. All data can be migrated.';
END $$;

-- Step 2: Add category availability columns to pokemon_master if they don't exist
ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS can_be_normal BOOLEAN DEFAULT true;
ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS can_be_shiny BOOLEAN DEFAULT true;
ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS can_be_lucky BOOLEAN DEFAULT true;
ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS can_be_xxl BOOLEAN DEFAULT true;
ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS can_be_xxs BOOLEAN DEFAULT true;
ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS can_be_gmax BOOLEAN DEFAULT false;
ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS can_be_dynamax BOOLEAN DEFAULT false;
ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS can_be_mega BOOLEAN DEFAULT false;
ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS can_be_obscure BOOLEAN DEFAULT true;
ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS can_be_purified BOOLEAN DEFAULT true;
ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS can_be_perfect BOOLEAN DEFAULT true;
ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS can_be_legendary BOOLEAN DEFAULT false;
ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS can_be_mythical BOOLEAN DEFAULT false;
ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS can_be_ultra_beast BOOLEAN DEFAULT false;

-- Step 3: Migrate data from pokemon_category_availability to pokemon_master
UPDATE pokemon_master pm
SET 
    can_be_normal = COALESCE(pca.can_be_normal, true),
    can_be_shiny = COALESCE(pca.can_be_shiny, true),
    can_be_lucky = COALESCE(pca.can_be_lucky, true),
    can_be_xxl = COALESCE(pca.can_be_xxl, true),
    can_be_xxs = COALESCE(pca.can_be_xxs, true),
    can_be_gmax = COALESCE(pca.can_be_gmax, false),
    can_be_dynamax = COALESCE(pca.can_be_dynamax, false),
    can_be_mega = COALESCE(pca.can_be_mega, false),
    can_be_obscure = COALESCE(pca.can_be_obscure, true),
    can_be_purified = COALESCE(pca.can_be_purified, true),
    can_be_perfect = COALESCE(pca.can_be_perfect, true),
    can_be_legendary = COALESCE(pca.can_be_legendary, false),
    can_be_mythical = COALESCE(pca.can_be_mythical, false),
    can_be_ultra_beast = COALESCE(pca.can_be_ultra_beast, false)
FROM pokemon_category_availability pca
WHERE pm.pokemon_id = pca.pokemon_id;

-- Step 4: Drop the now-redundant tables
DROP TABLE IF EXISTS pokemon_names CASCADE;
DROP TABLE IF EXISTS pokemon_category_availability CASCADE;

-- Step 5: Add comment to document changes
COMMENT ON TABLE pokemon_master IS 'Master Pokemon data with all names and category availability. Consolidated from pokemon_names and pokemon_category_availability. Migration 016 - 2025-12-06.';

COMMIT;

-- Verification queries:
-- Check pokemon_master now has all columns:
-- SELECT pokemon_id, name_fr, can_be_shiny, can_be_legendary FROM pokemon_master LIMIT 5;

-- Verify tables are dropped:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'pokemon%';
