const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const prodPool = new Pool({
    user: process.env.PROD_DB_USER || 'postgres',
    host: process.env.PROD_DB_HOST || '192.168.1.199',
    database: process.env.PROD_DB_NAME || 'postgres',
    password: process.env.PROD_DB_PASSWORD || 'postgres',
    port: process.env.PROD_DB_PORT || 5433,
    ssl: process.env.PROD_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000
});

async function runMigration() {
    console.log(`🔌 Connecting to PROD DB at ${process.env.PROD_DB_HOST}:${process.env.PROD_DB_PORT}...`);
    const client = await prodPool.connect();
    try {
        await client.query('SELECT 1');
        console.log('✅ Connected to PROD DB');

        const sqlPath = path.join(__dirname, 'migration_prod.sql');
        console.log(`📖 Reading SQL file: ${sqlPath}`);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('🚀 Executing migration...');
        await client.query(sql);

        console.log('✅ Migration executed successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        await prodPool.end();
    }
}

runMigration();
