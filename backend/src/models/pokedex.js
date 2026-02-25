const createPokedexTable = async (pool) => {
  const query = `
    CREATE TABLE IF NOT EXISTS pokedex (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES trainers(id) ON DELETE CASCADE,
      pokemon_id INTEGER NOT NULL,
      name VARCHAR(255) NOT NULL,
      name_fr VARCHAR(255),
      name_en VARCHAR(255),
      name_de VARCHAR(255),
      name_it VARCHAR(255),
      name_pt VARCHAR(255),
      image_url TEXT,
      has_normal BOOLEAN DEFAULT FALSE,
      has_shiny BOOLEAN DEFAULT FALSE,
      has_lucky BOOLEAN DEFAULT FALSE,
      has_trade BOOLEAN DEFAULT FALSE,
      has_xxl BOOLEAN DEFAULT FALSE,
      has_xxs BOOLEAN DEFAULT FALSE,
      has_gmax BOOLEAN DEFAULT FALSE,
      has_mega BOOLEAN DEFAULT FALSE,
      has_obscure BOOLEAN DEFAULT FALSE,
      has_purifie BOOLEAN DEFAULT FALSE,
      has_parfait BOOLEAN DEFAULT FALSE,
      has_dynamax BOOLEAN DEFAULT FALSE,
      trade_shiny BOOLEAN DEFAULT FALSE,
      trade_xxl BOOLEAN DEFAULT FALSE,
      trade_xxs BOOLEAN DEFAULT FALSE,
      trade_gmax BOOLEAN DEFAULT FALSE,
      trade_mega BOOLEAN DEFAULT FALSE,
      trade_purified BOOLEAN DEFAULT FALSE,
      trade_perfect BOOLEAN DEFAULT FALSE,
      trade_dynamax BOOLEAN DEFAULT FALSE,
      can_be_dynamax BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, pokemon_id)
    );
  `;
  return pool.query(query);
};

module.exports = { createPokedexTable };
