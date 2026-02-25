-- Create Pokemon Master Table
CREATE TABLE IF NOT EXISTS pokemon_master (
    pokemon_id INTEGER PRIMARY KEY,
    
    -- Identification (multilingual names)
    name_fr VARCHAR(100),
    name_en VARCHAR(100),
    name_de VARCHAR(100),
    name_it VARCHAR(100),
    image_url TEXT,
    
    -- Classification & Region (admin-defined)
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    classification_id INTEGER NOT NULL REFERENCES classifications(id),
    region_id INTEGER NOT NULL REFERENCES regions(id),
    
    -- Pokemon Types (1 or 2)
    type_primary_id INTEGER NOT NULL REFERENCES types(id),
    type_secondary_id INTEGER REFERENCES types(id),
    
    -- Trade Status
    trade_status VARCHAR(20) NOT NULL DEFAULT 'YES' CHECK (trade_status IN ('YES', 'SPECIAL', 'NO')),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by INTEGER REFERENCES trainers(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pokemon_master_available ON pokemon_master(is_available);
CREATE INDEX IF NOT EXISTS idx_pokemon_master_classification ON pokemon_master(classification_id);
CREATE INDEX IF NOT EXISTS idx_pokemon_master_region ON pokemon_master(region_id);
CREATE INDEX IF NOT EXISTS idx_pokemon_master_type_primary ON pokemon_master(type_primary_id);
CREATE INDEX IF NOT EXISTS idx_pokemon_master_type_secondary ON pokemon_master(type_secondary_id);
