// Pokemon master table model
const createPokemonMasterTable = async (pool) => {
    const query = `
    CREATE TABLE IF NOT EXISTS pokemon_master (
      id SERIAL PRIMARY KEY,
      pokemon_id INTEGER NOT NULL,
      name_fr VARCHAR(100),
      name_en VARCHAR(100),
      name_de VARCHAR(100),
      name_it VARCHAR(100),
      image_url TEXT,
      is_available BOOLEAN NOT NULL DEFAULT true,
      classification_id INTEGER NOT NULL,
      region_id INTEGER NOT NULL,
      type_primary_id INTEGER NOT NULL,
      type_secondary_id INTEGER,
      trade_status VARCHAR(20) NOT NULL DEFAULT 'YES',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_by INTEGER,
      form_name VARCHAR(50) DEFAULT 'Normal',
      is_mega BOOLEAN DEFAULT false,
      is_gmax BOOLEAN DEFAULT false,
      is_regional BOOLEAN DEFAULT false,
      region_description TEXT,
      regional_description TEXT,
      UNIQUE(pokemon_id, form_name)
    )
  `;
    return pool.query(query);
};

module.exports = { createPokemonMasterTable };
