-- Manually add the 6 missing Pokemon that don't exist in pokemon_names
-- These are likely regional variants or forms not previously imported

INSERT INTO pokemon_master (
    pokemon_id, name_fr, name_en, name_de, name_it,
    is_available, classification_id, region_id, type_primary_id, trade_status
) VALUES
-- 161: Sentret (Fouinette)
(161, 'Fouinette', 'Sentret', 'Wiesor', 'Sentret', true,
 (SELECT id FROM classifications WHERE name_key = 'normal'),
 (SELECT id FROM regions WHERE name_key = 'johto'),
 (SELECT id FROM types WHERE name_key = 'normal'), 'YES'),

-- 180: Flaaffy (Lainergie)
(180, 'Lainergie', 'Flaaffy', 'Waaty', 'Flaaffy', true,
 (SELECT id FROM classifications WHERE name_key = 'normal'),
 (SELECT id FROM regions WHERE name_key = 'johto'),
 (SELECT id FROM types WHERE name_key = 'electric'), 'YES'),

-- 325: Spoink (Spoink)
(325, 'Spoink', 'Spoink', 'Spoink', 'Spoink', true,
 (SELECT id FROM classifications WHERE name_key = 'normal'),
 (SELECT id FROM regions WHERE name_key = 'hoenn'),
 (SELECT id FROM types WHERE name_key = 'psychic'), 'YES'),

-- 326: Grumpig (Groret)
(326, 'Groret', 'Grumpig', 'Groink', 'Grumpig', true,
 (SELECT id FROM classifications WHERE name_key = 'normal'),
 (SELECT id FROM regions WHERE name_key = 'hoenn'),
 (SELECT id FROM types WHERE name_key = 'psychic'), 'YES'),

-- 661: Fletchling (Passerouge)
(661, 'Passerouge', 'Fletchling', 'Dartiri', 'Fletchling', true,
 (SELECT id FROM classifications WHERE name_key = 'normal'),
 (SELECT id FROM regions WHERE name_key = 'kalos'),
 (SELECT id FROM types WHERE name_key = 'normal'), 'YES'),

-- 674: Pancham (Pandespiègle)
(674, 'Pandespiègle', 'Pancham', 'Pam-Pam', 'Pancham', true,
 (SELECT id FROM classifications WHERE name_key = 'normal'),
 (SELECT id FROM regions WHERE name_key = 'kalos'),
 (SELECT id FROM types WHERE name_key = 'fighting'), 'YES')

ON CONFLICT (pokemon_id) DO NOTHING;

-- Add secondary types where applicable
UPDATE pokemon_master SET type_secondary_id = (SELECT id FROM types WHERE name_key = 'flying') WHERE pokemon_id = 661;

-- Create category availability
INSERT INTO pokemon_category_availability (
    pokemon_id, 
    can_be_normal, can_be_legendary, can_be_mythical, can_be_ultra_beast,
    can_be_shiny, can_be_lucky, can_be_xxl, can_be_xxs,
    can_be_gmax, can_be_dynamax, can_be_mega,
    can_be_obscure, can_be_purified, can_be_perfect
)
VALUES
(161, TRUE, FALSE, FALSE, FALSE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, TRUE, TRUE),
(180, TRUE, FALSE, FALSE, FALSE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, TRUE, TRUE),
(325, TRUE, FALSE, FALSE, FALSE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, TRUE, TRUE),
(326, TRUE, FALSE, FALSE, FALSE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, TRUE, TRUE),
(661, TRUE, FALSE, FALSE, FALSE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, TRUE, TRUE),
(674, TRUE, FALSE, FALSE, FALSE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, TRUE, TRUE)
ON CONFLICT (pokemon_id) DO NOTHING;

SELECT COUNT(*) as total FROM pokemon_master;
