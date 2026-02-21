const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const client = new Client({
    user: 'postgres.fkcktcwtnmuflasiueji',
    host: 'aws-0-eu-central-1.pooler.supabase.com',
    database: 'postgres',
    password: 'wrong_password',
    port: 6543,
    ssl: { rejectUnauthorized: false }
});
client.connect().catch(e => console.log('ERROR IS:', e.message));
