const { Client } = require('pg');
const connectionString = 'postgresql://postgres:x%2BDEqb%24GR%2B5_%25p%25@db.fkcktcwtnmuflasiueji.supabase.co:5432/postgres?sslmode=require';

async function test() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        console.log('Connected!');
        const res = await client.query('SELECT 1');
        console.log(res.rows[0]);
    } catch (err) {
        console.error('Connection error:', err.message);
    } finally {
        await client.end();
    }
}

test();
