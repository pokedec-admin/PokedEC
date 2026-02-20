-- Migration 008: Add mutually exclusive categories (Legendary, Mythical, Ultra Beast)
-- These categories are mutually exclusive with Normal

-- Add new columns to pokedex table
ALTER TABLE pokedex 
ADD COLUMN IF NOT EXISTS has_legendary BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_mythical BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_ultra_beast BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trade_legendary BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trade_mythical BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trade_ultra_beast BOOLEAN DEFAULT FALSE;

-- Add new columns to pokemon_category_availability table
ALTER TABLE pokemon_category_availability
ADD COLUMN IF NOT EXISTS can_be_legendary BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_be_mythical BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_be_ultra_beast BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_pokedex_legendary ON pokedex(has_legendary) WHERE has_legendary = true;
CREATE INDEX IF NOT EXISTS idx_pokedex_mythical ON pokedex(has_mythical) WHERE has_mythical = true;
CREATE INDEX IF NOT EXISTS idx_pokedex_ultra_beast ON pokedex(has_ultra_beast) WHERE has_ultra_beast = true;
