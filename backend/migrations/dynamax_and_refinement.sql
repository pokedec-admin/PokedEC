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
