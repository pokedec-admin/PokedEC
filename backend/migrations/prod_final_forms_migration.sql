-- MEGA MIGRATION FOR PROD (BLUE/GREEN)
-- Date: 2025-12-23
-- Focus: Full Form Support Architecture

BEGIN;

-- ============================================================================
-- 1. POKEMON_MASTER EVOLUTION
-- ============================================================================
DO $$ 
BEGIN
    -- Add form_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pokemon_master' AND column_name='form_name') THEN
        ALTER TABLE pokemon_master ADD COLUMN form_name VARCHAR(50) DEFAULT 'Normal';
    END IF;

    -- Add metadata columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pokemon_master' AND column_name='image_url') THEN
        ALTER TABLE pokemon_master ADD COLUMN image_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pokemon_master' AND column_name='is_regional') THEN
        ALTER TABLE pokemon_master ADD COLUMN is_regional BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pokemon_master' AND column_name='regional_description') THEN
        ALTER TABLE pokemon_master ADD COLUMN regional_description TEXT;
    END IF;

    -- Adjust Primary Key for pokemon_master
    -- Drop old PK if it is only on pokemon_id
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='pokemon_master_pkey' AND table_name='pokemon_master') THEN
        IF (SELECT count(*) FROM information_schema.key_column_usage WHERE constraint_name='pokemon_master_pkey' AND table_name='pokemon_master') = 1 THEN
            ALTER TABLE pokemon_master DROP CONSTRAINT pokemon_master_pkey;
            ALTER TABLE pokemon_master ADD PRIMARY KEY (pokemon_id, form_name);
        END IF;
    END IF;
END $$;

-- ============================================================================
-- 2. POKEDEX EVOLUTION
-- ============================================================================
DO $$ 
BEGIN
    -- Add form_name if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pokedex' AND column_name='form_name') THEN
        ALTER TABLE pokedex ADD COLUMN form_name VARCHAR(50) DEFAULT 'Normal';
    END IF;

    -- Adjust Primary Key for pokedex
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='pokedex_pkey' AND table_name='pokedex') THEN
        -- Check if it contains form_name
        IF NOT EXISTS (SELECT 1 FROM information_schema.key_column_usage WHERE constraint_name='pokedex_pkey' AND table_name='pokedex' AND column_name='form_name') THEN
            ALTER TABLE pokedex DROP CONSTRAINT pokedex_pkey;
            ALTER TABLE pokedex ADD PRIMARY KEY (user_id, pokemon_id, form_name);
        END IF;
    END IF;
END $$;

-- ============================================================================
-- 3. POKEMON_CATEGORY_AVAILABILITY EVOLUTION
-- ============================================================================
DO $$ 
BEGIN
    -- Add form_name if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pokemon_category_availability' AND column_name='form_name') THEN
        ALTER TABLE pokemon_category_availability ADD COLUMN form_name VARCHAR(50) DEFAULT 'Normal';
    END IF;

    -- Add can_be_normal if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pokemon_category_availability' AND column_name='can_be_normal') THEN
        ALTER TABLE pokemon_category_availability ADD COLUMN can_be_normal BOOLEAN DEFAULT TRUE;
    END IF;

    -- Adjust Primary Key for PCA
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='pokemon_category_availability_pkey' AND table_name='pokemon_category_availability') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.key_column_usage WHERE constraint_name='pokemon_category_availability_pkey' AND table_name='pokemon_category_availability' AND column_name='form_name') THEN
            ALTER TABLE pokemon_category_availability DROP CONSTRAINT pokemon_category_availability_pkey;
            ALTER TABLE pokemon_category_availability ADD PRIMARY KEY (pokemon_id, form_name);
        END IF;
    END IF;
END $$;

-- ============================================================================
-- 4. INSERT DATA & PEUPLEMENT
-- ============================================================================

-- Ensure all current pokemon have a 'Normal' availability entry
INSERT INTO pokemon_category_availability (pokemon_id, form_name)
SELECT pokemon_id, 'Normal' FROM pokemon_master WHERE form_name='Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- Populate Basic Regional Forms in pokemon_master
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT pokemon_id, 'Alola', name_fr || ' (Alola)', classification_id, 7, type_primary_id, type_secondary_id FROM pokemon_master WHERE pokemon_id IN (19,20,26,27,28,37,38,50,51,52,53,74,75,76,88,89,103,105) AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT pokemon_id, 'Galar', name_fr || ' (Galar)', classification_id, 8, type_primary_id, type_secondary_id FROM pokemon_master WHERE pokemon_id IN (52,77,78,79,80,83,110,122,144,145,146,263,264,554,555,562,618) AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT pokemon_id, 'Hisui', name_fr || ' (Hisui)', classification_id, 9, type_primary_id, type_secondary_id FROM pokemon_master WHERE pokemon_id IN (58,59,100,101,157,211,503,548,549,570,571,627,628,705,706,712,713,724) AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- Ensure availability entries for these new forms
INSERT INTO pokemon_category_availability (pokemon_id, form_name)
SELECT pm.pokemon_id, pm.form_name FROM pokemon_master pm
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- Update Legendary availability flags (derived from classification_id=2)
UPDATE pokemon_category_availability pca
SET can_be_legendary = true, can_be_normal = true
FROM pokemon_master pm
WHERE pca.pokemon_id = pm.pokemon_id AND pca.form_name = pm.form_name
AND pm.classification_id = 2;

-- Update Mythical flags (classification_id=3)
UPDATE pokemon_category_availability pca
SET can_be_mythical = true, can_be_normal = true
FROM pokemon_master pm
WHERE pca.pokemon_id = pm.pokemon_id AND pca.form_name = pm.form_name
AND pm.classification_id = 3;

-- Update Ultra Beast flags (classification_id=4)
UPDATE pokemon_category_availability pca
SET can_be_ultra_beast = true, can_be_normal = true
FROM pokemon_master pm
WHERE pca.pokemon_id = pm.pokemon_id AND pca.form_name = pm.form_name
AND pm.classification_id = 4;

-- Apply Regional Data cleanup
-- (Redundant if remediation is run, but better for fresh installs)
UPDATE pokemon_master SET is_regional = false;

-- Fin !
COMMIT;
