#!/usr/bin/env node
const fetch = require('node-fetch');

async function invite(email, redirectTo) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
    process.exit(1);
  }

  const url = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/invite`;
  const body = { email, redirect_to: redirectTo };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify(body)
  });

  const text = await res.text();
  console.log('Status:', res.status);
  console.log(text);
}

if (require.main === module) {
  const email = process.argv[2];
  const redirectTo = process.argv[3] || 'https://www.pokedec.ch/accept-invite';
  if (!email) {
    console.error('Usage: node invite-user.js user@example.com [redirect_to]');
    process.exit(1);
  }
  invite(email, redirectTo).catch(err => { console.error(err); process.exit(1); });
}
