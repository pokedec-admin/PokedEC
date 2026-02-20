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
