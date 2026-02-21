const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const regions = [
  'aws-0-eu-central-1', 'aws-0-eu-west-1', 'aws-0-eu-west-2', 'aws-0-eu-west-3',
  'aws-0-eu-north-1', 'aws-0-eu-south-1',
  'aws-0-us-east-1', 'aws-0-us-east-2', 'aws-0-us-west-1', 'aws-0-us-west-2',
  'aws-0-ap-northeast-1', 'aws-0-ap-southeast-1', 'aws-0-ap-southeast-2',
  'aws-0-sa-east-1', 'aws-0-ca-central-1'
];

async function tryRegion(region) {
  const host = `${region}.pooler.supabase.com`;
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
      console.log(`SUCCESS! The region is ${region}`);
      await client.end();
      process.exit(0);
  } catch (err) {
      if (err.message.includes('password authentication failed')) {
         console.log(`Region found but bad password: ${region}`);
         process.exit(0);
      }
      return false;
  }
}

async function run() {
  for (const region of regions) {
      await tryRegion(region);
  }
  console.log("No valid pooler found.");
}
run();
