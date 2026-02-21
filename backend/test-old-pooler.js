const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Ancien format PgBouncer (avant migration Supavisor) : user = postgres (sans ID projet)
const hosts = [
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-eu-west-2.pooler.supabase.com',
  'aws-0-eu-west-1.pooler.supabase.com',
];

async function tryHost(host, user) {
  return new Promise((resolve) => {
    const client = new Client({
        user,
        host,
        database: 'postgres',
        password: 'x+DEqb$GR+5_%p%',
        port: 6543,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
    });
    client.connect().then(async () => {
        console.log(`✅ SUCCESS! user=${user} host=${host}`);
        await client.end();
        process.exit(0);
    }).catch(e => {
        console.log(`❌ user=${user} host=${host}: ${e.message}`);
        resolve();
    });
  });
}

async function run() {
  for (const host of hosts) {
    await tryHost(host, 'postgres');
    await tryHost(host, 'postgres.fkcktcwtnmuflasiueji');
  }
  console.log("Non trouvé.");
}
run();
