/**
 * Feature modules must not import src/app — app wires features, not the reverse.
 * Use public* barrels, src/lib/*, or in-feature presentation paths.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const featuresRoot = join(root, 'src', 'features');
const APP_IMPORT = /from\s+['"]@\/app\//;

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(tsx?)$/.test(name)) files.push(p);
  }
  return files;
}

const violations = [];

for (const file of walk(featuresRoot)) {
  const rel = relative(root, file).replace(/\\/g, '/');
  if (/\.(test|spec)\.(ts|tsx)$/.test(rel)) continue;
  const text = readFileSync(file, 'utf8');
  if (APP_IMPORT.test(text)) {
    violations.push(`${rel}: must not import @/app/*`);
  }
}

if (violations.length) {
  console.error('check:no-app-imports-in-features failed:\n');
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}

console.log('check:no-app-imports-in-features: OK');
