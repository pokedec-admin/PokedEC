const dns = require('dns/promises');

async function check() {
  try {
    console.log('Resolving ipv4...', await dns.resolve4('db.fkcktcwtnmuflasiueji.supabase.co'));
  } catch(e) {
    console.log('IPv4 Error:', e.message);
  }
}
check();
