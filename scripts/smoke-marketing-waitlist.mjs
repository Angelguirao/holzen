#!/usr/bin/env node
/**
 * Smoke-test waitlist + landing-ping edge functions (prod or staging).
 *
 * Usage:
 *   node scripts/smoke-marketing-waitlist.mjs
 *   node scripts/smoke-marketing-waitlist.mjs --base https://xxx.supabase.co
 *
 * Requires anon key in env: VITE_SUPABASE_PUBLISHABLE_KEY or PUBLIC_SUPABASE_PUBLISHABLE_KEY
 */
const args = process.argv.slice(2);
const baseFlag = args.indexOf('--base');
const supabaseBase =
  (baseFlag >= 0 ? args[baseFlag + 1] : null) ??
  process.env.PUBLIC_SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL;

const anonKey =
  process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseBase || !anonKey) {
  console.error('Missing Supabase URL or anon key. Pass --base or set VITE_SUPABASE_URL + key.');
  process.exit(1);
}

const functionsBase = `${supabaseBase.replace(/\/$/, '')}/functions/v1`;
const headers = {
  'Content-Type': 'application/json',
  apikey: anonKey,
  Authorization: `Bearer ${anonKey}`,
};

async function post(path, body) {
  const res = await fetch(`${functionsBase}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

const testEmail = `smoke-${Date.now()}@holzen.app.test`;

const ping = await post('/landing-ping', { path: '/' });
console.log('landing-ping:', ping.status, ping.data);

const signup = await post('/waitlist-signup', {
  email: testEmail,
  source: 'smoke-script',
});
console.log('waitlist-signup:', signup.status, signup.data);

if (!ping.ok || !signup.ok) {
  console.error('Marketing waitlist smoke failed.');
  process.exit(1);
}

console.log('Marketing waitlist smoke ok.');
