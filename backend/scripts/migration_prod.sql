-- Migration script for PROD database update V2025.11.10

BEGIN;

-- 1. Add new columns to pokemon_category_availability
ALTER TABLE pokemon_category_availability 
ADD COLUMN IF NOT EXISTS can_be_legendary BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_be_mythical BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_be_ultra_beast BOOLEAN DEFAULT FALSE;

-- 2. Populate Legendary Pokemon
UPDATE pokemon_category_availability
SET can_be_legendary = true, can_be_normal = false
WHERE pokemon_id IN (
    144, 145, 146, 150, 243, 244, 245, 249, 250, 377, 378, 379, 380, 381, 382, 383, 384, 
    480, 481, 482, 483, 484, 485, 486, 487, 488, 638, 639, 640, 641, 642, 643, 644, 645, 646, 
    716, 717, 718, 785, 786, 787, 788, 789, 790, 791, 792, 800, 888, 889, 890, 891, 892, 
    894, 895, 896, 897, 898, 905, 1001, 1002, 1003, 1004, 1007, 1008, 1014, 1015, 1016, 1017, 1024
);

-- 3. Populate Mythical Pokemon
UPDATE pokemon_category_availability
SET can_be_mythical = true, can_be_normal = false
WHERE pokemon_id IN (
    151, 251, 385, 386, 489, 490, 491, 492, 493, 494, 647, 648, 649, 719, 720, 721, 
    801, 802, 807, 808, 809, 893, 1025
);

-- 4. Populate Ultra Beast Pokemon
UPDATE pokemon_category_availability
SET can_be_ultra_beast = true, can_be_normal = false
WHERE pokemon_id IN (
    793, 794, 795, 796, 797, 798, 799, 803, 804, 805, 806
);

COMMIT;
