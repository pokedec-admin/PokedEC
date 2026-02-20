-- Clean up Pokedex inconsistencies based on pokemon_category_availability rules

-- Normal
UPDATE pokedex p
SET has_normal = false
FROM pokemon_category_availability pca
WHERE p.pokemon_id = pca.pokemon_id AND pca.can_be_normal = false AND p.has_normal = true;

-- Shiny
UPDATE pokedex p
SET has_shiny = false, trade_shiny = false
FROM pokemon_category_availability pca
WHERE p.pokemon_id = pca.pokemon_id AND pca.can_be_shiny = false AND (p.has_shiny = true OR p.trade_shiny = true);

-- Lucky
UPDATE pokedex p
SET has_lucky = false
FROM pokemon_category_availability pca
WHERE p.pokemon_id = pca.pokemon_id AND pca.can_be_lucky = false AND p.has_lucky = true;

-- XXL
UPDATE pokedex p
SET has_xxl = false, trade_xxl = false
FROM pokemon_category_availability pca
WHERE p.pokemon_id = pca.pokemon_id AND pca.can_be_xxl = false AND (p.has_xxl = true OR p.trade_xxl = true);

-- XXS
UPDATE pokedex p
SET has_xxs = false, trade_xxs = false
FROM pokemon_category_availability pca
WHERE p.pokemon_id = pca.pokemon_id AND pca.can_be_xxs = false AND (p.has_xxs = true OR p.trade_xxs = true);

-- G-Max
UPDATE pokedex p
SET has_gmax = false, trade_gmax = false
FROM pokemon_category_availability pca
WHERE p.pokemon_id = pca.pokemon_id AND pca.can_be_gmax = false AND (p.has_gmax = true OR p.trade_gmax = true);

-- Dynamax
UPDATE pokedex p
SET has_dynamax = false, trade_dynamax = false
FROM pokemon_category_availability pca
WHERE p.pokemon_id = pca.pokemon_id AND pca.can_be_dynamax = false AND (p.has_dynamax = true OR p.trade_dynamax = true);

-- Mega
UPDATE pokedex p
SET has_mega = false, trade_mega = false
FROM pokemon_category_availability pca
WHERE p.pokemon_id = pca.pokemon_id AND pca.can_be_mega = false AND (p.has_mega = true OR p.trade_mega = true);

-- Obscure (Shadow)
UPDATE pokedex p
SET has_obscure = false
FROM pokemon_category_availability pca
WHERE p.pokemon_id = pca.pokemon_id AND pca.can_be_obscure = false AND p.has_obscure = true;

-- Purified
UPDATE pokedex p
SET has_purifie = false, trade_purified = false
FROM pokemon_category_availability pca
WHERE p.pokemon_id = pca.pokemon_id AND pca.can_be_purified = false AND (p.has_purifie = true OR p.trade_purified = true);

-- Perfect
UPDATE pokedex p
SET has_parfait = false
FROM pokemon_category_availability pca
WHERE p.pokemon_id = pca.pokemon_id AND pca.can_be_perfect = false AND p.has_parfait = true;

-- Legendary
UPDATE pokedex p
SET has_legendary = false, trade_legendary = false
FROM pokemon_category_availability pca
WHERE p.pokemon_id = pca.pokemon_id AND pca.can_be_legendary = false AND (p.has_legendary = true OR p.trade_legendary = true);

-- Mythical
UPDATE pokedex p
SET has_mythical = false, trade_mythical = false
FROM pokemon_category_availability pca
WHERE p.pokemon_id = pca.pokemon_id AND pca.can_be_mythical = false AND (p.has_mythical = true OR p.trade_mythical = true);

-- Ultra Beast
UPDATE pokedex p
SET has_ultra_beast = false, trade_ultra_beast = false
FROM pokemon_category_availability pca
WHERE p.pokemon_id = pca.pokemon_id AND pca.can_be_ultra_beast = false AND (p.has_ultra_beast = true OR p.trade_ultra_beast = true);
