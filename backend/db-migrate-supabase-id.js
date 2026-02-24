const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: "postgresql://postgres.fkcktcwtnmuflasiueji:x%2BDEqb$GR%2B5_%25p%25@aws-0-eu-central-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        console.log('Adding supabase_uid column to users table...');
        await pool.query('ALTER TABLE trainers ADD COLUMN IF NOT EXISTS supabase_uid VARCHAR(255) UNIQUE');
        console.log('Column added successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
