-- Cleanup and Fix Mega/Gigamax
-- 1. Delete incorrect Mega/Gigamax forms
DELETE FROM pokemon_master WHERE pokemon_id IN (1, 4, 7) AND form_name IN ('Méga', 'Gigamax');
DELETE FROM pokemon_category_availability WHERE pokemon_id IN (1, 4, 7) AND form_name IN ('Méga', 'Gigamax');

-- 2. Ensure IDs for Mega/Gigatamax are correct
-- Mega List (Excluding 6 and 150 which are special)
DO $$
DECLARE
    p_id INTEGER;
    m_list INTEGER[] := ARRAY[3, 9, 15, 18, 65, 80, 94, 115, 127, 130, 142, 181, 208, 212, 214, 229, 248, 254, 257, 260, 282, 302, 303, 306, 308, 310, 319, 323, 334, 354, 359, 362, 373, 376, 380, 381, 384, 428, 445, 448, 460, 475, 531, 719];
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
        
        INSERT INTO pokemon_category_availability (pokemon_id, form_name, can_be_normal, can_be_shiny, can_be_mega)
        VALUES (p_id, 'Méga', TRUE, TRUE, TRUE)
        ON CONFLICT (pokemon_id, form_name) DO UPDATE SET can_be_mega = TRUE, can_be_normal = TRUE;
    END LOOP;
END $$;

-- 3. Gigamax List
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
        
        INSERT INTO pokemon_category_availability (pokemon_id, form_name, can_be_normal, can_be_shiny, can_be_gmax)
        VALUES (p_id, 'Gigamax', TRUE, TRUE, TRUE)
        ON CONFLICT (pokemon_id, form_name) DO UPDATE SET can_be_gmax = TRUE, can_be_normal = TRUE;
    END LOOP;
END $$;

-- 4. Global updates for consistency
UPDATE pokemon_master SET trade_status = 'NO' WHERE form_name LIKE 'Méga%';
UPDATE pokemon_master SET trade_status = 'SPECIAL' WHERE form_name LIKE 'Gigamax%';
