const createPokemonNamesTable = async (pool) => {
  const query = `
    CREATE TABLE IF NOT EXISTS pokemon_names (
      pokemon_id INTEGER PRIMARY KEY,
      name_fr VARCHAR(100),
      name_en VARCHAR(100),
      name_de VARCHAR(100),
      name_it VARCHAR(100),
      name_pt VARCHAR(100)
    );
  `;
  return pool.query(query);
};

module.exports = { createPokemonNamesTable };
