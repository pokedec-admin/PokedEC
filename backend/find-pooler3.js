const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const regions = [
  'fra', 'lhr', 'par', 'ams', 'cdg', 'mad', // EU Fly regions
  'iad', 'ewr', 'ord', 'sjc', 'lax', 'sea', // US Fly regions
  'gru', 'syd', 'nrt', 'sin' // Other
];

async function tryHost(host) {
  const client = new Client({
      user: 'postgres.fkcktcwtnmuflasiueji',
      host: host,
      database: 'postgres',
      password: 'x+DEqb$GR+5_%p%',
      port: 6543,
      ssl: { rejectUnauthorized: false }
  });

  try {
      await client.connect();
      console.log(`\nSUCCESS! The host is ${host}`);
      await client.end();
      process.exit(0);
  } catch (err) {
      if (err.message.includes('password authentication failed')) {
          console.log(`\nPassword auth failed (but host correct) on ${host}`);
          process.exit(0);
      }
      return false;
  }
}

async function run() {
  process.stdout.write('Testing Fly poolers');
  for (const r of regions) {
      await tryHost(`fly-0-${r}.pooler.supabase.com`);
  }
  console.log("\nNot found in Fly poolers.");
}
run();
