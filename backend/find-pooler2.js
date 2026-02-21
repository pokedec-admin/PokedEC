const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const regions = [
  'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2'
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
      if (err.message.includes('Tenant or user not found')) {
          process.stdout.write('.');
      } else {
          console.log(`\nHost ${host} gave: ${err.message}`);
      }
      return false;
  }
}

async function run() {
  process.stdout.write('Testing');
  // test db.fkcktcwtnmuflasiueji.supabase.co just in case it resolves on ipv6 locally
  // but we know that doesn't help Render. What we need is the IPv4 pooler.
  for (const region of regions) {
      for (let i = 0; i <= 3; i++) {
         await tryHost(`aws-${i}-${region}.pooler.supabase.com`);
      }
  }
  console.log("\nNo valid pooler found.");
}
run();
