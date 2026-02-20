-- Add can_be_normal column to pokemon_category_availability table
ALTER TABLE pokemon_category_availability 
ADD COLUMN IF NOT EXISTS can_be_normal BOOLEAN DEFAULT true;

-- Update existing rows to have can_be_normal = true by default
UPDATE pokemon_category_availability 
SET can_be_normal = true 
WHERE can_be_normal IS NULL;

-- Add comment for the new column
COMMENT ON COLUMN pokemon_category_availability.can_be_normal IS 'Whether this Pokemon can exist in normal form. If false, all other categories are disabled.';
