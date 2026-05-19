/**
 * One-off: move pause application modules under application/use-cases/.
 * Run: node scripts/move-pause-use-cases.mjs
 */
import { existsSync, renameSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const app = join(root, 'src', 'features', 'pause', 'application');
const uc = join(app, 'use-cases');

const moves = [
  ['session', join(uc, 'session')],
  ['breathing', join(uc, 'breathing')],
  ['companion', join(uc, 'companion')],
  ['feedback', join(uc, 'feedback')],
  ['archive', join(uc, 'archive')],
  ['bulk-hold', join(uc, 'bulk-hold')],
  ['library', join(uc, 'library')],
  ['reflect', join(uc, 'reflect')],
];

mkdirSync(join(uc, 'ritual', 'brief'), { recursive: true });
mkdirSync(join(uc, 'ritual', 'deep'), { recursive: true });

const briefSrc = join(app, 'brief-ritual');
if (existsSync(briefSrc)) {
  for (const name of readdirSync(briefSrc)) {
    renameSync(join(briefSrc, name), join(uc, 'ritual', 'brief', name));
  }
}

const deepFiles = ['deep-go-back.ts', 'deep-go-back.test.ts', 'brief-switch-to-deep.ts', 'brief-switch-to-deep.test.ts'];
for (const f of deepFiles) {
  const from = join(app, 'session', f);
  if (existsSync(from)) renameSync(from, join(uc, 'ritual', 'deep', f));
}

for (const [dir, dest] of moves) {
  const from = join(app, dir);
  if (!existsSync(from)) continue;
  if (existsSync(dest)) {
    console.error(`Destination exists, skip: ${dest}`);
    continue;
  }
  renameSync(from, dest);
}

try {
  if (existsSync(briefSrc) && readdirSync(briefSrc).length === 0) {
    renameSync(briefSrc, join(app, '_removed-brief-ritual-empty'));
  }
} catch {
  /* ignore */
}

console.log('move-pause-use-cases: directory moves done');
