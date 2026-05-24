/**
 * Settings route must read profile via @/features/user/public-hooks, not HolzenProvider.
 * Pause/market orchestration stays on useHolzen in home shell and pause flows.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const settingsRoot = join(root, 'src', 'screens', 'settings');
const BANNED = /HolzenProvider|useHolzen/;

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

for (const file of walk(settingsRoot)) {
  const rel = relative(root, file).replace(/\\/g, '/');
  if (/\.(test|spec)\.(ts|tsx)$/.test(rel)) continue;
  const text = readFileSync(file, 'utf8');
  if (BANNED.test(text)) {
    violations.push(`${rel}: use useProfile from @/features/user/public-hooks`);
  }
}

if (violations.length) {
  console.error('check:no-holzen-in-settings failed:\n');
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}

console.log('check:no-holzen-in-settings: OK');
