const dns = require('dns/promises');

async function test() {
    try {
        console.log("Looking up AAAA...");
        const res = await dns.resolve6('db.fkcktcwtnmuflasiueji.supabase.co');
        console.log("IPv6 found:", res);
        
        console.log("Testing connection...");
        const { Client } = require('pg');
        const client = new Client({
            user: 'postgres',
            host: 'db.fkcktcwtnmuflasiueji.supabase.co',
            database: 'postgres',
            password: 'x+DEqb$GR+5_%p%',
            port: 5432,
            ssl: { rejectUnauthorized: false }
        });
        await client.connect();
        console.log("CONNECTED NATIVELY via IPv6!!!");
        await client.end();
    } catch(e) {
        console.log("ERROR:", e.message);
    }
}
test();
