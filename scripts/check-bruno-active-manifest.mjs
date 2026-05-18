/**
 * Ensures every [functions.*] name in supabase/config.toml has a row in
 * bruno/active/functions-catalog.md (plan §27.7 optional guard).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const configPath = join(root, 'supabase', 'config.toml');
const catalogPath = join(root, 'bruno', 'active', 'functions-catalog.md');

if (!existsSync(configPath) || !existsSync(catalogPath)) {
  console.error('[check:bruno-active-manifest] Missing config.toml or bruno/active/functions-catalog.md');
  process.exit(1);
}

const config = readFileSync(configPath, 'utf8');
const catalog = readFileSync(catalogPath, 'utf8');

const fnNames = [...config.matchAll(/\[functions\.([^\]]+)\]/g)].map((m) => m[1]);
const missing = fnNames.filter((name) => !catalog.includes(`\`${name}\``));

if (missing.length) {
  console.error('[check:bruno-active-manifest] config.toml functions missing from bruno/active/functions-catalog.md:');
  for (const n of missing.sort()) console.error(`  - ${n}`);
  process.exit(1);
}

console.log(`[check:bruno-active-manifest] OK — ${fnNames.length} deployed functions listed in catalog`);
process.exit(0);
