-- Fix Pokemon types with correct PokeAPI data
-- This updates the most common Pokemon with their correct types

-- Dragon type Pokemon
UPDATE pokemon_master SET 
    type_primary_id = (SELECT id FROM types WHERE name_key = 'dragon'),
    type_secondary_id = (SELECT id FROM types WHERE name_key = 'flying')
WHERE pokemon_id IN (149); -- Dragonite

UPDATE pokemon_master SET 
    type_primary_id = (SELECT id FROM types WHERE name_key = 'dragon'),
    type_secondary_id = (SELECT id FROM types WHERE name_key = 'ground')
WHERE pokemon_id IN (330); -- Flygon

UPDATE pokemon_master SET 
    type_primary_id = (SELECT id FROM types WHERE name_key = 'dragon'),
    type_secondary_id = (SELECT id FROM types WHERE name_key = 'flying')
WHERE pokemon_id IN (334, 384, 445, 483, 484, 487, 643, 644, 718); -- Altaria, Rayquaza, Garchomp, Dialga, Palkia, Giratina, Reshiram, Zekrom, Zygarde

-- Fire starters
UPDATE pokemon_master SET 
    type_primary_id = (SELECT id FROM types WHERE name_key = 'fire')
WHERE pokemon_id IN (4, 5); -- Charmander, Charmeleon

UPDATE pokemon_master SET 
    type_primary_id = (SELECT id FROM types WHERE name_key = 'fire'),
    type_secondary_id = (SELECT id FROM types WHERE name_key = 'flying')
WHERE pokemon_id IN (6); -- Charizard

-- Water starters
UPDATE pokemon_master SET 
    type_primary_id = (SELECT id FROM types WHERE name_key = 'water')
WHERE pokemon_id IN (7, 8, 9); -- Squirtle line

-- Grass starters  
UPDATE pokemon_master SET 
    type_primary_id = (SELECT id FROM types WHERE name_key = 'grass'),
    type_secondary_id = (SELECT id FROM types WHERE name_key = 'poison')
WHERE pokemon_id IN (1, 2, 3); -- Bulbasaur line

-- Electric
UPDATE pokemon_master SET 
    type_primary_id = (SELECT id FROM types WHERE name_key = 'electric')
WHERE pokemon_id IN (25, 26, 172, 135); -- Pikachu, Raichu, Pichu, Jolteon

-- Psychic
UPDATE pokemon_master SET 
    type_primary_id = (SELECT id FROM types WHERE name_key = 'psychic')
WHERE pokemon_id IN (63, 64, 65, 150, 151); -- Abra line, Mewtwo, Mew

-- Fighting
UPDATE pokemon_master SET 
    type_primary_id = (SELECT id FROM types WHERE name_key = 'fighting')
WHERE pokemon_id IN (66, 67, 68); -- Machop line

-- Add image URLs from PokeAPI for all Pokemon
UPDATE pokemon_master 
SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' || pokemon_id || '.png'
WHERE image_url IS NULL OR image_url = '';

SELECT 'Types updated for key Pokemon' as status;
