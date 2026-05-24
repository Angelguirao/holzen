/**
 * Screens stay thin: no browser Supabase client in src/screens (use feature public barrels).
 * Type-only imports from @/integrations/supabase/types are allowed.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const screensRoot = join(root, 'src', 'screens');

const CLIENT_IMPORT = /from\s+['"]@\/integrations\/supabase\/client['"]/;

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(tsx?)$/.test(name)) files.push(p);
  }
  return files;
}

const violations = [];
for (const file of walk(screensRoot)) {
  const rel = relative(root, file).replace(/\\/g, '/');
  const text = readFileSync(file, 'utf8');
  if (CLIENT_IMPORT.test(text)) {
    violations.push(rel);
  }
}

if (violations.length) {
  console.error('check:no-supabase-in-screens failed:\n');
  for (const f of violations) {
    console.error(`  ${f}: import Supabase via @/features/<ctx>/public* — not @/integrations/supabase/client`);
  }
  process.exit(1);
}

console.log('check:no-supabase-in-screens: OK');
