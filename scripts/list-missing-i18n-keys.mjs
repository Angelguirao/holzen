import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(root, 'src');
const enPath = join(root, 'src', 'locales', 'en.json');

function flatten(obj, prefix = '') {
  const keys = new Set();
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, path).forEach((x) => keys.add(x));
    else keys.add(path);
  }
  return keys;
}

const enKeys = flatten(JSON.parse(readFileSync(enPath, 'utf8').replace(/^\uFEFF/, '')));
const T_RE = /\bt\s*\(\s*['"]([^'"]+)['"]/g;

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'legacy') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(tsx?|jsx?)$/.test(name)) files.push(p);
  }
  return files;
}

const missing = new Set();
for (const file of walk(srcRoot)) {
  const rel = relative(root, file).replace(/\\/g, '/');
  if (rel.startsWith('src/legacy/')) continue;
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(T_RE)) {
    const key = m[1];
    if (key.includes('${')) continue;
    const hasKey =
      enKeys.has(key) || enKeys.has(`${key}_one`) || enKeys.has(`${key}_other`);
    if (!hasKey) missing.add(key);
  }
}

for (const key of [...missing].sort()) console.log(key);
