-- Add language-specific name columns to pokedex table
DO $$
BEGIN
    -- Add name_fr column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pokedex' AND column_name = 'name_fr'
    ) THEN
        ALTER TABLE pokedex ADD COLUMN name_fr VARCHAR(255);
    END IF;

    -- Add name_en column  
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pokedex' AND column_name = 'name_en'
    ) THEN
        ALTER TABLE pokedex ADD COLUMN name_en VARCHAR(255);
    END IF;

    -- Add name_de column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pokedex' AND column_name = 'name_de'
    ) THEN
        ALTER TABLE pokedex ADD COLUMN name_de VARCHAR(255);
    END IF;

    -- Add name_it column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pokedex' AND column_name = 'name_it'
    ) THEN
        ALTER TABLE pokedex ADD COLUMN name_it VARCHAR(255);
    END IF;

    -- Add name_pt column (Portuguese)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pokedex' AND column_name = 'name_pt'
    ) THEN
        ALTER TABLE pokedex ADD COLUMN name_pt VARCHAR(255);
    END IF;

    -- Copy existing name to name_en (assuming current names are in English)
    UPDATE pokedex SET name_en = name WHERE name_en IS NULL;
END $$;

-- Verify
SELECT id, pokemon_id, name, name_fr, name_en, name_de, name_it, name_pt FROM pokedex LIMIT 5;
