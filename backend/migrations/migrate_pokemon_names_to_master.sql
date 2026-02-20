-- Migration: Populate pokemon_master from pokemon_names
-- This script migrates existing data from pokemon_names to pokemon_master

-- Step 1: Insert data from pokemon_names with default values
INSERT INTO pokemon_master (
    pokemon_id, 
    name_fr, name_en, name_de, name_it, 
    is_available, 
    classification_id, 
    region_id, 
    type_primary_id, 
    trade_status
)
SELECT 
    pn.pokemon_id,
    pn.name_fr,
    pn.name_en,
    pn.name_de,
    pn.name_it,
    TRUE, -- Default: available
    COALESCE(
        (SELECT id FROM classifications WHERE name_key = 
            CASE 
                WHEN pca.can_be_legendary = TRUE AND pca.can_be_normal = FALSE THEN 'legendary'
                WHEN pca.can_be_mythical = TRUE AND pca.can_be_normal = FALSE THEN 'mythical'
                WHEN pca.can_be_ultra_beast = TRUE AND pca.can_be_normal = FALSE THEN 'ultra_beast'
                ELSE 'normal'
            END
        ),
        (SELECT id FROM classifications WHERE name_key = 'normal')
    ), -- Default classification based on category availability
    CASE 
        WHEN pn.pokemon_id BETWEEN 1 AND 151 THEN (SELECT id FROM regions WHERE name_key = 'kanto')
        WHEN pn.pokemon_id BETWEEN 152 AND 251 THEN (SELECT id FROM regions WHERE name_key = 'johto')
        WHEN pn.pokemon_id BETWEEN 252 AND 386 THEN (SELECT id FROM regions WHERE name_key = 'hoenn')
        WHEN pn.pokemon_id BETWEEN 387 AND 493 THEN (SELECT id FROM regions WHERE name_key = 'sinnoh')
        WHEN pn.pokemon_id BETWEEN 494 AND 649 THEN (SELECT id FROM regions WHERE name_key = 'unova')
        WHEN pn.pokemon_id BETWEEN 650 AND 721 THEN (SELECT id FROM regions WHERE name_key = 'kalos')
        WHEN pn.pokemon_id BETWEEN 722 AND 809 THEN (SELECT id FROM regions WHERE name_key = 'alola')
        WHEN pn.pokemon_id BETWEEN 810 AND 905 THEN (SELECT id FROM regions WHERE name_key = 'galar')
        WHEN pn.pokemon_id BETWEEN 906 AND 1025 THEN (SELECT id FROM regions WHERE name_key = 'paldea')
        ELSE (SELECT id FROM regions WHERE name_key = 'unknown')
    END, -- Assign region based on National Dex number
    (SELECT id FROM types WHERE name_key = 'normal'), -- Default type: Normal
    'YES' -- Default trade status
FROM pokemon_names pn
LEFT JOIN pokemon_category_availability pca ON pn.pokemon_id = pca.pokemon_id
ON CONFLICT (pokemon_id) DO NOTHING;

-- Step 2: Log migration results
DO $$
DECLARE
    migrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migrated_count FROM pokemon_master;
    RAISE NOTICE 'Migration complete: % Pokemon migrated to pokemon_master', migrated_count;
END $$;
