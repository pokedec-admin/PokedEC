const createUserSearchFiltersTable = async (pool) => {
  const query = `
    CREATE TABLE IF NOT EXISTS user_search_filters (
      user_id INTEGER PRIMARY KEY REFERENCES trainers(id) ON DELETE CASCADE,
      wanted_filters JSONB DEFAULT '{}'::jsonb,
      wanted_presets JSONB DEFAULT '[]'::jsonb,
      pokedex_filters JSONB DEFAULT '{}'::jsonb,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  return pool.query(query);
};

module.exports = { createUserSearchFiltersTable };
