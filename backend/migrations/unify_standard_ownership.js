const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }); // Adjust path to root .env

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5434, // Default to 5434 for local Docker DEV
});

console.log(`Connecting to DB at ${pool.options.host}:${pool.options.port}...`);

async function runMigration() {
    try {
        console.log('Running migration: Unify Standard Ownership...');

        // 1. Set has_normal = true where user has special classification variants
        const res = await pool.query(`
      UPDATE pokedex 
      SET has_normal = true 
      WHERE (has_legendary = true OR has_mythical = true OR has_ultra_beast = true)
      AND has_normal = false;
    `);

        console.log(`SUCCESS: Updated ${res.rowCount} rows to have has_normal=true.`);

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
