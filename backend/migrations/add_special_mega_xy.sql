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
