const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const connectionString = 'postgresql://postgres:x%2BDEqb%24GR%2B5_%25p%25@fkcktcwtnmuflasiueji.supabase.co:6543/postgres?sslmode=require';

async function test() {
    const client = new Client({
        user: 'postgres.fkcktcwtnmuflasiueji',
        host: 'aws-0-eu-central-1.pooler.supabase.com',
        database: 'postgres',
        password: 'x+DEqb$GR+5_%p%',
        port: 6543,
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
