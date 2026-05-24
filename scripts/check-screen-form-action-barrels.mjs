/**
 * Screen form actions must be thin re-exports from feature public barrels (*-io.ts),
 * not inline useActionState handlers with Supabase/edge I/O.
 *
 * See docs/fundamentals/client-src-layout.md and holzen-application-architecture.md.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const screensRoot = join(root, 'src', 'screens');

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/-action\.(ts|tsx)$/.test(name)) files.push(p);
  }
  return files;
}

const violations = [];

for (const file of walk(screensRoot)) {
  const rel = relative(root, file).replace(/\\/g, '/');
  const text = readFileSync(file, 'utf8');

  if (/export\s+async\s+function/.test(text)) {
    violations.push(`${rel}: export async function — move to features/<ctx>/presentation/*-io.ts`);
  }
  if (/from\s+['"]@\/features\/[^'"]+\/public-queries['"]/.test(text)) {
    violations.push(`${rel}: imports public-queries — use @/features/<ctx>/public form actions`);
  }
  if (/from\s+['"]@\/integrations\/supabase/.test(text)) {
    violations.push(`${rel}: direct Supabase import — use feature I/O barrel`);
  }
}

if (violations.length) {
  console.error('check:screen-form-action-barrels failed:\n');
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}

console.log('check:screen-form-action-barrels: OK');
