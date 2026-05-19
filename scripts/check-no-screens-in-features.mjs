/**
 * Features must not import screen presentation paths (layer inversion).
 * See docs/fundamentals/frontend-module-layout.md wave 5j+.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const featuresRoot = join(root, 'src', 'features');
const forbidden = /from\s+['"]@\/screens\//;

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
for (const file of walk(featuresRoot)) {
  const rel = relative(root, file).replace(/\\/g, '/');
  const text = readFileSync(file, 'utf8');
  if (forbidden.test(text)) violations.push(rel);
}

if (violations.length) {
  console.error('check:no-screens-in-features failed:\n');
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}

console.log('check:no-screens-in-features: OK');
