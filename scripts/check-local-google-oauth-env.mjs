#!/usr/bin/env node
/**
 * Verifies SUPABASE_AUTH_EXTERNAL_GOOGLE_* for local Docker Google sign-in.
 * Does not print secret values.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const candidates = [
  resolve(root, 'supabase/.env.local'),
  resolve(root, 'supabase/.env'),
];

function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

let merged = {};
let used = [];
for (const path of candidates) {
  if (!existsSync(path)) continue;
  merged = { ...merged, ...parseEnv(readFileSync(path, 'utf8')) };
  used.push(path.replace(root + '\\', '').replace(root + '/', ''));
}

const id = merged.SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID?.trim() ?? '';
const secret = merged.SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET?.trim() ?? '';

console.log('Local Google OAuth env check');
console.log('  Files read:', used.length ? used.join(', ') : '(none — copy supabase/.env.example → supabase/.env.local)');
console.log('  CLIENT_ID:', id ? `set (${id.length} chars, ends with …${id.slice(-20)})` : 'MISSING');
console.log('  CLIENT_SECRET:', secret ? `set (${secret.length} chars)` : 'MISSING');

if (!id || !secret) {
  console.log('\nNext: docs/ops/local-google-oauth.md');
  console.log('  1. Google Cloud → OAuth Web client → copy ID + secret');
  console.log('  2. Add redirect URI: http://127.0.0.1:55421/auth/v1/callback');
  console.log('  3. Set SUPABASE_AUTH_EXTERNAL_GOOGLE_* in supabase/.env.local');
  console.log('  4. npm run supabase:stop && npm run supabase:start');
  process.exit(1);
}

console.log('\nOK — restart local Supabase if you just added these, then npm run dev:local → /auth');
process.exit(0);
