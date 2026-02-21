const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// resolve IPv4 
const dns = require('dns');

dns.resolve4('db.fkcktcwtnmuflasiueji.supabase.co', (err, addresses) => {
    if (err) throw err;
    console.log('IPv4:', addresses[0]);
    
    // Connect explicitly via IPv4 address
    const client = new Client({
        user: 'postgres.fkcktcwtnmuflasiueji',
        host: addresses[0],
        database: 'postgres',
        password: 'x+DEqb$GR+5_%p%',
        port: 5432,
        ssl: { rejectUnauthorized: false }
    });

    client.connect()
        .then(() => {
            console.log('Connected via IPv4!');
            return client.query('SELECT 1');
        })
        .then(res => console.log(res.rows[0]))
        .catch(err => console.error('Connection error:', err.message))
        .finally(() => client.end());
});
