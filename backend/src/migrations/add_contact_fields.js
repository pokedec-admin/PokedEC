const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function addContactFields() {
    try {
        console.log('[Migration] Adding contact fields to users table...');

        // Add campfire_name column
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS campfire_name VARCHAR(255);
        `);
        console.log('[Migration] Added campfire_name column');

        // Add whatsapp_group column
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS whatsapp_group VARCHAR(255);
        `);
        console.log('[Migration] Added whatsapp_group column');

        console.log('[Migration] Contact fields migration completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('[Migration] Error:', err);
        process.exit(1);
    }
}

addContactFields();
