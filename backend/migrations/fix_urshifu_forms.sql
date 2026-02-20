-- Migration: Fix Urshifu (#892) forms and names
-- Description: Adds the different styles for Urshifu to allow proper tracking of its 5+ forms.

-- 1. Update existing "Normal" form name for #892 to be more specific
UPDATE pokemon_master 
SET form_name = 'Style Poing Final',
    name_fr = 'Shifours (Style Poing Final)',
    name_en = 'Urshifu (Single Strike Style)'
WHERE pokemon_id = 892 AND form_name = 'Normal';

-- 2. Add the second "Normal" form (Mille Poings)
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, name_en, classification_id, region_id, type_primary_id, type_secondary_id, image_url, trade_status, is_available)
SELECT 892, 'Style Mille Poings', 'Shifours (Style Mille Poings)', 'Urshifu (Rapid Strike Style)', classification_id, region_id, 4, 2, '/images/pokemon/892_Style_Mille_Poings.png', 'YES', TRUE
FROM pokemon_master WHERE pokemon_id = 892 AND form_name = 'Style Poing Final'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 3. Update existing "Gigamax" form to be specific (Single Strike)
UPDATE pokemon_master
SET form_name = 'Gigamax (Style Poing Final)',
    name_fr = 'Shifours Gigamax (Style Poing Final)',
    name_en = 'Gigantamax Urshifu (Single Strike Style)'
WHERE pokemon_id = 892 AND form_name = 'Gigamax';

-- 4. Add the second "Gigamax" form (Rapid Strike)
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, name_en, classification_id, region_id, type_primary_id, type_secondary_id, image_url, trade_status, is_available)
SELECT 892, 'Gigamax (Style Mille Poings)', 'Shifours Gigamax (Style Mille Poings)', 'Gigantamax Urshifu (Rapid Strike Style)', classification_id, region_id, 4, 2, '/images/pokemon/892_Gigamax_Style_Mille_Poings.png', 'SPECIAL', TRUE
FROM pokemon_master WHERE pokemon_id = 892 AND form_name = 'Style Poing Final'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 5. Add Dynamax forms for both styles
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, name_en, classification_id, region_id, type_primary_id, type_secondary_id, image_url, trade_status, is_available)
SELECT 892, 'Dynamax (Style Poing Final)', 'Shifours Dynamax (Style Poing Final)', 'Dynamax Urshifu (Single Strike Style)', classification_id, region_id, type_primary_id, type_secondary_id, '/images/pokemon/892_Dynamax_Style_Poing_Final.png', 'YES', TRUE
FROM pokemon_master WHERE pokemon_id = 892 AND form_name = 'Style Poing Final'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, name_en, classification_id, region_id, type_primary_id, type_secondary_id, image_url, trade_status, is_available)
SELECT 892, 'Dynamax (Style Mille Poings)', 'Shifours Dynamax (Style Mille Poings)', 'Dynamax Urshifu (Rapid Strike Style)', classification_id, region_id, 4, 2, '/images/pokemon/892_Dynamax_Style_Mille_Poings.png', 'YES', TRUE
FROM pokemon_master WHERE pokemon_id = 892 AND form_name = 'Style Mille Poings'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 6. Update PCA availability
INSERT INTO pokemon_category_availability (pokemon_id, form_name, can_be_normal, can_be_shiny, can_be_gmax, can_be_dynamax)
VALUES 
(892, 'Style Poing Final', TRUE, TRUE, FALSE, FALSE),
(892, 'Style Mille Poings', TRUE, TRUE, FALSE, FALSE),
(892, 'Gigamax (Style Poing Final)', TRUE, TRUE, TRUE, FALSE),
(892, 'Gigamax (Style Mille Poings)', TRUE, TRUE, TRUE, FALSE),
(892, 'Dynamax (Style Poing Final)', TRUE, TRUE, FALSE, TRUE),
(892, 'Dynamax (Style Mille Poings)', TRUE, TRUE, FALSE, TRUE)
ON CONFLICT (pokemon_id, form_name) DO UPDATE SET 
    can_be_normal = EXCLUDED.can_be_normal,
    can_be_gmax = EXCLUDED.can_be_gmax,
    can_be_dynamax = EXCLUDED.can_be_dynamax;
