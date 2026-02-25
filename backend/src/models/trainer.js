const createTrainersTable = async (pool) => {
  const query = `
    CREATE TABLE IF NOT EXISTS trainers (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255),
      google_id VARCHAR(255) UNIQUE,
      trainer_name VARCHAR(255),
      team VARCHAR(20),
      phone VARCHAR(20),
      email_verified BOOLEAN DEFAULT FALSE,
      is_admin BOOLEAN DEFAULT FALSE,
      preferred_language VARCHAR(10) DEFAULT 'fr',
      campfire_name VARCHAR(255),
      whatsapp_group VARCHAR(255),
      supabase_uid VARCHAR(255) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  return pool.query(query);
};

module.exports = { createTrainersTable };
