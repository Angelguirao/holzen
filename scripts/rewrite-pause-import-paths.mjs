/**
 * Rewrite imports after move-pause-use-cases.mjs
 * Run: node scripts/rewrite-pause-import-paths.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const REPLACEMENTS = [
  ['@/features/pause/application/use-cases/ritual/brief/', '@/features/pause/application/use-cases/ritual/brief/'],
  ['./application/use-cases/ritual/brief/', './application/use-cases/ritual/brief/'],
  ['application/use-cases/ritual/brief/', 'application/use-cases/ritual/brief/'],
  ['@/features/pause/application/use-cases/ritual/deep/deep-go-back', '@/features/pause/application/use-cases/ritual/deep/deep-go-back'],
  ['@/features/pause/application/use-cases/ritual/deep/brief-switch-to-deep', '@/features/pause/application/use-cases/ritual/deep/brief-switch-to-deep'],
  ['./application/use-cases/ritual/deep/deep-go-back', './application/use-cases/ritual/deep/deep-go-back'],
  ['./application/use-cases/ritual/deep/brief-switch-to-deep', './application/use-cases/ritual/deep/brief-switch-to-deep'],
  ['application/use-cases/ritual/deep/deep-go-back', 'application/use-cases/ritual/deep/deep-go-back'],
  ['application/use-cases/ritual/deep/brief-switch-to-deep', 'application/use-cases/ritual/deep/brief-switch-to-deep'],
  ['@/features/pause/application/use-cases/session/', '@/features/pause/application/use-cases/session/'],
  ['@/features/pause/application/use-cases/breathing/standalone-breathing-patterns', '@/features/pause/application/use-cases/ritual/breathe/standalone-breathing-patterns'],
  ['@/features/pause/application/use-cases/breathing/', '@/features/pause/application/use-cases/ritual/breathe/'],
  ['@/features/pause/application/use-cases/companion/', '@/features/pause/application/use-cases/ritual/frame/'],
  ['@/features/pause/application/use-cases/reflect/', '@/features/pause/application/use-cases/ritual/reflect/'],
  ['@/features/pause/application/use-cases/feedback/step-sync-toast', '@/features/pause/application/use-cases/ritual/step-sync-toast'],
  ['@/features/pause/application/use-cases/feedback/outcome-toast', '@/features/pause/application/use-cases/ritual/decide/outcome-toast'],
  ['@/features/pause/application/use-cases/feedback/', '@/features/pause/application/use-cases/ritual/'],
  ['@/features/pause/application/use-cases/archive/', '@/features/pause/application/use-cases/archive/'],
  ['@/features/pause/application/use-cases/bulk-hold/', '@/features/pause/application/use-cases/bulk-hold/'],
  ['@/features/pause/application/use-cases/library/', '@/features/pause/application/use-cases/library/'],
  ['./application/use-cases/session/', './application/use-cases/session/'],
  ['./application/use-cases/breathing/standalone-breathing-patterns', './application/use-cases/ritual/breathe/standalone-breathing-patterns'],
  ['./application/use-cases/breathing/', './application/use-cases/ritual/breathe/'],
  ['./application/use-cases/companion/', './application/use-cases/ritual/frame/'],
  ['./application/use-cases/reflect/', './application/use-cases/ritual/reflect/'],
  ['./application/use-cases/feedback/step-sync-toast', './application/use-cases/ritual/step-sync-toast'],
  ['./application/use-cases/feedback/outcome-toast', './application/use-cases/ritual/decide/outcome-toast'],
  ['./application/use-cases/feedback/', './application/use-cases/ritual/'],
  ['./application/use-cases/archive/', './application/use-cases/archive/'],
  ['./application/use-cases/bulk-hold/', './application/use-cases/bulk-hold/'],
  ['./application/use-cases/library/', './application/use-cases/library/'],
  ['application/use-cases/session/', 'application/use-cases/session/'],
  ['application/use-cases/breathing/standalone-breathing-patterns', 'application/use-cases/ritual/breathe/standalone-breathing-patterns'],
  ['application/use-cases/breathing/', 'application/use-cases/ritual/breathe/'],
  ['application/use-cases/companion/', 'application/use-cases/ritual/frame/'],
  ['application/use-cases/reflect/', 'application/use-cases/ritual/reflect/'],
  ['application/use-cases/feedback/step-sync-toast', 'application/use-cases/ritual/step-sync-toast'],
  ['application/use-cases/feedback/outcome-toast', 'application/use-cases/ritual/decide/outcome-toast'],
  ['application/use-cases/feedback/', 'application/use-cases/ritual/'],
  ['application/use-cases/archive/', 'application/use-cases/archive/'],
  ['application/use-cases/bulk-hold/', 'application/use-cases/bulk-hold/'],
  ['application/use-cases/library/', 'application/use-cases/library/'],
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === '.git') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(tsx?|md|mjs)$/.test(name)) files.push(p);
  }
  return files;
}

let changed = 0;
for (const file of walk(root)) {
  let text = readFileSync(file, 'utf8');
  let next = text;
  for (const [from, to] of REPLACEMENTS) {
    next = next.split(from).join(to);
  }
  if (next !== text) {
    writeFileSync(file, next);
    changed++;
  }
}
console.log(`rewrite-pause-import-paths: updated ${changed} file(s)`);
