// Pokemon master table model
const createPokemonMasterTable = async (pool) => {
    const query = `
    CREATE TABLE IF NOT EXISTS pokemon_master (
      id SERIAL PRIMARY KEY,
      pokemon_id INTEGER NOT NULL,
      form_name VARCHAR(50) DEFAULT 'Normal',
      name_fr VARCHAR(255),
      classification_id INTEGER,
      region_id INTEGER,
      type_primary_id INTEGER,
      type_secondary_id INTEGER,
      image_url TEXT,
      is_mega BOOLEAN DEFAULT false,
      is_gmax BOOLEAN DEFAULT false,
      is_regional BOOLEAN DEFAULT false,
      region_description TEXT,
      UNIQUE(pokemon_id, form_name)
    )
  `;
    return pool.query(query);
};

module.exports = { createPokemonMasterTable };
