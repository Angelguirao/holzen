#!/usr/bin/env node
/**
 * Ensures Supabase public env is present when building marketing for CI/Vercel.
 * Local `build:site` without env is allowed (waitlist shows a friendly error).
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
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

function resolveEnv() {
  const files = ['.env.production.local', '.env.production', '.env.local', '.env'];
  const merged = {};
  for (const name of files) {
    Object.assign(merged, loadEnvFile(join(root, name)));
  }
  return { ...merged, ...process.env };
}

function hasMarketingSupabaseEnv(env) {
  const url = env.PUBLIC_SUPABASE_URL ?? env.VITE_SUPABASE_URL;
  const key =
    env.PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(url?.trim() && key?.trim());
}

const strict =
  process.env.CI === 'true' ||
  process.env.CI === '1' ||
  process.env.VERCEL === '1';

if (!strict) {
  console.log('Marketing build env check skipped (not CI/Vercel).');
  process.exit(0);
}

const env = resolveEnv();
if (!hasMarketingSupabaseEnv(env)) {
  console.error('Marketing build env check failed.');
  console.error(
    'Set PUBLIC_SUPABASE_URL + PUBLIC_SUPABASE_PUBLISHABLE_KEY (or VITE_* equivalents) in Vercel/CI before build:site.',
  );
  process.exit(1);
}

console.log('Marketing build env ok (Supabase URL + publishable key present).');
