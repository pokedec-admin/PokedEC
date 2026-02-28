const createPokemonCategoryAvailabilityTable = async (pool) => {
  const query = `
    CREATE TABLE IF NOT EXISTS pokemon_category_availability (
      pokemon_id INTEGER,
      form_name VARCHAR(50) DEFAULT 'Normal',
      can_be_normal BOOLEAN DEFAULT TRUE,
      can_be_shiny BOOLEAN DEFAULT TRUE,
      can_be_lucky BOOLEAN DEFAULT TRUE,
      can_be_xxl BOOLEAN DEFAULT TRUE,
      can_be_xxs BOOLEAN DEFAULT TRUE,
      can_be_gmax BOOLEAN DEFAULT FALSE,
      can_be_dynamax BOOLEAN DEFAULT FALSE,
      can_be_mega BOOLEAN DEFAULT FALSE,
      can_be_obscure BOOLEAN DEFAULT TRUE,
      can_be_purified BOOLEAN DEFAULT TRUE,
      can_be_perfect BOOLEAN DEFAULT TRUE,
      updated_by INTEGER REFERENCES trainers(id),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (pokemon_id, form_name)
    );
  `;
  return pool.query(query);
};

module.exports = { createPokemonCategoryAvailabilityTable };
