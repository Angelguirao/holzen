/**
 * One-off codemod: public-hooks + legacy lib shim → features.
 * Run: node scripts/fix-feature-import-paths.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const REPLACEMENTS = [
  ["@/features/subscription/presentation/use-subscription", '@/features/subscription/public-hooks'],
  ["@/features/subscription/presentation/use-pro-gate", '@/features/subscription/public-hooks'],
  ["@/features/user/presentation/use-profile", '@/features/user/public-hooks'],
  ["@/features/user/presentation/use-hold-goal", '@/features/user/public-hooks'],
  ["@/features/user/presentation/use-push-notifications", '@/features/user/public-hooks'],
  ["@/features/pause/presentation/use-completed-pause-count", '@/features/pause/public-hooks'],
  ["@/lib/pause-state", '@/features/pause/public'],
  ["@/lib/pause-effective-emotion", '@/features/pause/public'],
  ["@/lib/pause-impact-data", '@/features/pause/public'],
  ["@/lib/completed-pause-count-query", '@/features/pause/public-queries'],
  ["@/lib/btc", '@/features/market/public'],
  ["@/lib/tracked-assets", '@/features/market/public'],
  ["@/lib/pause-stats-data-query", '@/legacy/full-shell/src/lib/pause-stats-data-query'],
  ["@/lib/stats/", '@/legacy/full-shell/src/lib/stats/'],
  ["@/lib/badges/", '@/legacy/full-shell/src/lib/badges/'],
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(tsx?)$/.test(name)) files.push(p);
  }
  return files;
}

const targets = walk(join(root, 'src'));
let changed = 0;
for (const file of targets) {
  let text = readFileSync(file, 'utf8');
  let next = text;
  for (const [from, to] of REPLACEMENTS) {
    next = next.split(from).join(to);
  }
  if (next !== text) {
    writeFileSync(file, next);
    changed++;
    console.log('updated', relative(root, file).replace(/\\/g, '/'));
  }
}
console.log(`\n${changed} file(s) updated`);
