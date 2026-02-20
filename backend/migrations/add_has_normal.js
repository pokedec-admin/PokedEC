const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function runMigration() {
  try {
    console.log('Running migration: Add has_normal to pokedex table...');
    
    // Check if column exists
    const checkRes = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='pokedex' AND column_name='has_normal';
    `);

    if (checkRes.rows.length === 0) {
      await pool.query(`
        ALTER TABLE pokedex 
        ADD COLUMN has_normal BOOLEAN DEFAULT FALSE;
      `);
      console.log('SUCCESS: Added has_normal column.');
    } else {
      console.log('SKIPPED: has_normal column already exists.');
    }

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

runMigration();
