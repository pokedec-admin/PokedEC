const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function addIsReadColumn() {
    try {
        console.log('[Migration] Adding is_read column to suggestions table...');

        // Add is_read column
        await pool.query(`
            ALTER TABLE suggestions 
            ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
        `);
        console.log('[Migration] Added is_read column');

        console.log('[Migration] is_read column migration completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('[Migration] Error:', err);
        process.exit(1);
    }
}

addIsReadColumn();
