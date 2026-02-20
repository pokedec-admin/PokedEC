-- Migration: Add Mega and Gigamax Forms
-- Description: Creates missing Mega and Gigamax forms in pokemon_master and sets trade rules.
-- Mega: trade_status = 'NO'
-- Gigamax: trade_status = 'SPECIAL'

-- 1. Ensure Charizard/Mewtwo Megas have trade_status = 'NO'
UPDATE pokemon_master SET trade_status = 'NO' WHERE (pokemon_id = 6 OR pokemon_id = 150) AND form_name LIKE 'Méga%';

-- 2. Function to add Mega form
DO $$
DECLARE
    p_id INTEGER;
    m_list INTEGER[] := ARRAY[1, 3, 9, 15, 18, 65, 80, 94, 115, 127, 130, 142, 181, 208, 212, 214, 229, 248, 254, 257, 260, 282, 302, 303, 306, 308, 310, 319, 323, 334, 354, 359, 362, 373, 376, 380, 381, 384, 428, 445, 448, 460, 475, 531, 719];
BEGIN
    FOREACH p_id IN ARRAY m_list LOOP
        INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, name_en, name_de, name_it, image_url, classification_id, region_id, type_primary_id, type_secondary_id, trade_status, is_available)
        SELECT 
            p_id, 
            'Méga', 
            name_fr || ' (Méga)', 
            name_en || ' (Mega)', 
            name_de || ' (Mega)', 
            name_it || ' (Mega)', 
            '/images/pokemon/' || p_id || '_Méga.png',
            classification_id, 
            region_id, 
            type_primary_id, 
            type_secondary_id, 
            'NO', 
            TRUE
        FROM pokemon_master 
        WHERE pokemon_id = p_id AND form_name = 'Normal'
        ON CONFLICT (pokemon_id, form_name) DO UPDATE SET trade_status = 'NO';
        
        -- PCA entry
        INSERT INTO pokemon_category_availability (pokemon_id, form_name, can_be_normal, can_be_shiny, can_be_mega)
        VALUES (p_id, 'Méga', TRUE, TRUE, TRUE)
        ON CONFLICT (pokemon_id, form_name) DO UPDATE SET can_be_mega = TRUE, can_be_normal = TRUE;
    END LOOP;
END $$;

-- 3. Function to add Gigamax form
DO $$
DECLARE
    p_id INTEGER;
    g_list INTEGER[] := ARRAY[3, 6, 9, 12, 25, 52, 68, 94, 99, 131, 133, 143, 569, 809, 810, 813, 816, 823, 826, 834, 838, 841, 842, 844, 849, 851, 858, 861, 869, 879, 884, 892];
BEGIN
    FOREACH p_id IN ARRAY g_list LOOP
        INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, name_en, name_de, name_it, image_url, classification_id, region_id, type_primary_id, type_secondary_id, trade_status, is_available)
        SELECT 
            p_id, 
            'Gigamax', 
            name_fr || ' (Gigamax)', 
            name_en || ' (Gigantamax)', 
            name_de || ' (Gigadynamax)', 
            name_it || ' (Gigamax)', 
            '/images/pokemon/' || p_id || '_Gigamax.png',
            classification_id, 
            region_id, 
            type_primary_id, 
            type_secondary_id, 
            'SPECIAL', 
            TRUE
        FROM pokemon_master 
        WHERE pokemon_id = p_id AND form_name = 'Normal'
        ON CONFLICT (pokemon_id, form_name) DO UPDATE SET trade_status = 'SPECIAL';
        
        -- PCA entry
        INSERT INTO pokemon_category_availability (pokemon_id, form_name, can_be_normal, can_be_shiny, can_be_gmax)
        VALUES (p_id, 'Gigamax', TRUE, TRUE, TRUE)
        ON CONFLICT (pokemon_id, form_name) DO UPDATE SET can_be_gmax = TRUE, can_be_normal = TRUE;
    END LOOP;
END $$;

-- Update PCA for existing Charizard/Mewtwo Mega forms if missing
UPDATE pokemon_category_availability SET can_be_mega = TRUE, can_be_normal = TRUE WHERE pokemon_id = 6 AND form_name LIKE 'Méga%';
UPDATE pokemon_category_availability SET can_be_mega = TRUE, can_be_normal = TRUE WHERE pokemon_id = 150 AND form_name LIKE 'Méga%';
-- Migration: Add special Mega X/Y forms for Charizard and Mewtwo
-- Charizard (6)
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, name_en, name_de, name_it, image_url, classification_id, region_id, type_primary_id, type_secondary_id, trade_status, is_available)
SELECT 6, 'Méga-Dracaufeu X', 'Méga-Dracaufeu X', 'Mega Charizard X', 'Mega-Glurak X', 'Mega Charizard X', '/images/pokemon/6_Méga-Dracaufeu_X.png', classification_id, region_id, type_primary_id, type_secondary_id, 'NO', TRUE
FROM pokemon_master WHERE pokemon_id = 6 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO UPDATE SET trade_status = 'NO';

INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, name_en, name_de, name_it, image_url, classification_id, region_id, type_primary_id, type_secondary_id, trade_status, is_available)
SELECT 6, 'Méga-Dracaufeu Y', 'Méga-Dracaufeu Y', 'Mega Charizard Y', 'Mega-Glurak Y', 'Mega Charizard Y', '/images/pokemon/6_Méga-Dracaufeu_Y.png', classification_id, region_id, type_primary_id, type_secondary_id, 'NO', TRUE
FROM pokemon_master WHERE pokemon_id = 6 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO UPDATE SET trade_status = 'NO';

-- Mewtwo (150)
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, name_en, name_de, name_it, image_url, classification_id, region_id, type_primary_id, type_secondary_id, trade_status, is_available)
SELECT 150, 'Méga X', 'Méga-Mewtwo X', 'Mega Mewtwo X', 'Mega-Mewtu X', 'Mega Mewtwo X', '/images/pokemon/150_Méga_X.png', classification_id, region_id, type_primary_id, type_secondary_id, 'NO', TRUE
FROM pokemon_master WHERE pokemon_id = 150 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO UPDATE SET trade_status = 'NO';

INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, name_en, name_de, name_it, image_url, classification_id, region_id, type_primary_id, type_secondary_id, trade_status, is_available)
SELECT 150, 'Méga Y', 'Méga-Mewtwo Y', 'Mega Mewtwo Y', 'Mega-Mewtu Y', 'Mega Mewtwo Y', '/images/pokemon/150_Méga_Y.png', classification_id, region_id, type_primary_id, type_secondary_id, 'NO', TRUE
FROM pokemon_master WHERE pokemon_id = 150 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO UPDATE SET trade_status = 'NO';

-- PCA entries
INSERT INTO pokemon_category_availability (pokemon_id, form_name, can_be_normal, can_be_shiny, can_be_mega)
VALUES (6, 'Méga-Dracaufeu X', TRUE, TRUE, TRUE),
       (6, 'Méga-Dracaufeu Y', TRUE, TRUE, TRUE),
       (150, 'Méga X', TRUE, TRUE, TRUE),
       (150, 'Méga Y', TRUE, TRUE, TRUE)
ON CONFLICT (pokemon_id, form_name) DO UPDATE SET can_be_mega = TRUE, can_be_normal = TRUE;
-- Migration: Migrate user data for Mega and Gigamax forms
-- This script moves the "checked" status from the 'has_mega'/'has_gmax' columns on 'Normal' form
-- to the 'has_normal' column on the new 'Méga'/'Gigamax' form rows.

-- 1. Migrate Megas (General)
INSERT INTO pokedex (user_id, pokemon_id, form_name, has_normal)
SELECT 
    p.user_id, 
    p.pokemon_id, 
    'Méga', 
    true
FROM pokedex p
WHERE p.form_name = 'Normal' AND p.has_mega = true AND p.pokemon_id NOT IN (6, 150)
ON CONFLICT (user_id, pokemon_id, form_name) DO UPDATE SET has_normal = true;

-- 2. Migrate Megas for Dracaufeu (6)
INSERT INTO pokedex (user_id, pokemon_id, form_name, has_normal)
SELECT p.user_id, p.pokemon_id, 'Méga-Dracaufeu X', true FROM pokedex p WHERE p.pokemon_id = 6 AND p.form_name = 'Normal' AND p.has_mega = true
ON CONFLICT (user_id, pokemon_id, form_name) DO UPDATE SET has_normal = true;

INSERT INTO pokedex (user_id, pokemon_id, form_name, has_normal)
SELECT p.user_id, p.pokemon_id, 'Méga-Dracaufeu Y', true FROM pokedex p WHERE p.pokemon_id = 6 AND p.form_name = 'Normal' AND p.has_mega = true
ON CONFLICT (user_id, pokemon_id, form_name) DO UPDATE SET has_normal = true;

-- 3. Migrate Megas for Mewtwo (150)
INSERT INTO pokedex (user_id, pokemon_id, form_name, has_normal)
SELECT p.user_id, p.pokemon_id, 'Méga X', true FROM pokedex p WHERE p.pokemon_id = 150 AND p.form_name = 'Normal' AND p.has_mega = true
ON CONFLICT (user_id, pokemon_id, form_name) DO UPDATE SET has_normal = true;

INSERT INTO pokedex (user_id, pokemon_id, form_name, has_normal)
SELECT p.user_id, p.pokemon_id, 'Méga Y', true FROM pokedex p WHERE p.pokemon_id = 150 AND p.form_name = 'Normal' AND p.has_mega = true
ON CONFLICT (user_id, pokemon_id, form_name) DO UPDATE SET has_normal = true;

-- 4. Migrate Gigamax
INSERT INTO pokedex (user_id, pokemon_id, form_name, has_normal)
SELECT 
    p.user_id, 
    p.pokemon_id, 
    'Gigamax', 
    true
FROM pokedex p
WHERE p.form_name = 'Normal' AND p.has_gmax = true
ON CONFLICT (user_id, pokemon_id, form_name) DO UPDATE SET has_normal = true;

-- 5. Set has_mega/has_gmax to special values or just leave them? 
-- The user said "seule sa forme normale est échangeable", so we should also migrate trade status if they had it.
-- But wait, Megas are NOT exchangeable. Gigamax ARE exchangeable Special.

UPDATE pokedex p_mega
SET has_trade = false
FROM pokedex p_norm
WHERE p_mega.user_id = p_norm.user_id 
  AND p_mega.pokemon_id = p_norm.pokemon_id 
  AND p_mega.form_name LIKE 'Méga%'
  AND p_norm.form_name = 'Normal';

-- Gigamax: they might have had 'trade_gmax' checked.
UPDATE pokedex p_gmax
SET has_trade = p_norm.trade_gmax
FROM pokedex p_norm
WHERE p_gmax.user_id = p_norm.user_id 
  AND p_gmax.pokemon_id = p_norm.pokemon_id 
  AND p_gmax.form_name = 'Gigamax'
  AND p_norm.form_name = 'Normal';

-- 6. Cleanup legacy columns to avoid confusion
UPDATE pokedex
SET has_mega = false,
    has_gmax = false,
    has_dynamax = false
WHERE form_name = 'Normal';
-- Migration: Revamp Dynamax and Refine Special Forms
-- 1. Create Dynamax forms for eligible Pokemon
DO $$
DECLARE
    p_id INTEGER;
    -- Pokemon that had can_be_dynamax on Normal form
    d_list INTEGER[] := ARRAY[1, 2, 4, 5, 6, 7, 8, 9, 3, 133, 134, 135, 136, 780, 810, 811, 812];
BEGIN
    FOREACH p_id IN ARRAY d_list LOOP
        -- Insert into pokemon_master
        INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, name_en, name_de, name_it, image_url, classification_id, region_id, type_primary_id, type_secondary_id, trade_status, is_available)
        SELECT 
            p_id, 
            'Dynamax', 
            name_fr || ' (Dynamax)', 
            name_en || ' (Dynamax)', 
            name_de || ' (Dynamax)', 
            name_it || ' (Dynamax)', 
            '/images/pokemon/' || p_id || '_Dynamax.png',
            classification_id, 
            region_id, 
            type_primary_id, 
            type_secondary_id, 
            'YES',  -- Dynamax are exchangeable normally
            TRUE
        FROM pokemon_master 
        WHERE pokemon_id = p_id AND form_name = 'Normal'
        ON CONFLICT (pokemon_id, form_name) DO UPDATE SET trade_status = 'YES';
        
        -- Insert into PCA for Dynamax form
        INSERT INTO pokemon_category_availability (pokemon_id, form_name, can_be_normal, can_be_shiny, can_be_dynamax, can_be_obscure, can_be_purified)
        VALUES (p_id, 'Dynamax', TRUE, TRUE, TRUE, FALSE, FALSE)
        ON CONFLICT (pokemon_id, form_name) DO UPDATE SET can_be_dynamax = TRUE, can_be_normal = TRUE, can_be_obscure = FALSE, can_be_purified = FALSE;
    END LOOP;
END $$;

-- 2. Migrate User Dynamax Data
INSERT INTO pokedex (user_id, pokemon_id, form_name, has_normal, has_dynamax, has_trade)
SELECT 
    p.user_id, 
    p.pokemon_id, 
    'Dynamax', 
    true,
    true,
    p.trade_dynamax
FROM pokedex p
WHERE p.form_name = 'Normal' AND p.has_dynamax = true
ON CONFLICT (user_id, pokemon_id, form_name) DO UPDATE SET has_normal = true, has_dynamax = true, has_trade = EXCLUDED.has_trade;

-- 3. Deactivate Mega, Gmax, Dynamax on "Normal" form in PCA
UPDATE pokemon_category_availability 
SET can_be_mega = false, 
    can_be_gmax = false, 
    can_be_dynamax = false 
WHERE form_name = 'Normal';

-- 5. Cleanup legacy flags on "Normal" form in pokedex
UPDATE pokedex
SET has_mega = false,
    has_gmax = false,
    has_dynamax = false
WHERE form_name = 'Normal';

-- 6. Refine flags for all special forms (Mega, Gmax, Dynamax)
-- They cannot be obscure/purified
UPDATE pokemon_category_availability
SET can_be_obscure = false,
    can_be_purified = false
WHERE form_name LIKE 'Méga%' 
   OR form_name = 'Gigamax' 
   OR form_name = 'Dynamax';

-- Cleanup pokedex entries for these forms that might have obscure/purified checked
UPDATE pokedex
SET has_obscure = false,
    has_purifie = false
WHERE form_name LIKE 'Méga%' 
   OR form_name = 'Gigamax' 
   OR form_name = 'Dynamax';
