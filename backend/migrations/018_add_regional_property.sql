-- Migration to add Regional property to Pokémon Master
ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS is_regional BOOLEAN DEFAULT FALSE;
ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS regional_description TEXT;

COMMENT ON COLUMN pokemon_master.is_regional IS 'Whether the Pokemon is a regional exclusive (e.g. Pokemon GO regional exclusives)';
COMMENT ON COLUMN pokemon_master.regional_description IS 'Description of where the regional Pokemon can be found (Tooltip content)';
