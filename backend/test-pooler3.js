const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
    user: 'postgres.fkcktcwtnmuflasiueji',
    host: 'db.fkcktcwtnmuflasiueji.supabase.co',
    database: 'postgres',
    password: 'x+DEqb$GR+5_%p%',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

async function test() {
    try {
        await client.connect();
        console.log('Connected to pooler intercept on 5432!');
        const res = await client.query('SELECT 1');
        console.log(res.rows[0]);
    } catch (err) {
        console.error('Connection error:', err.message);
    } finally {
        await client.end();
    }
}
test();
