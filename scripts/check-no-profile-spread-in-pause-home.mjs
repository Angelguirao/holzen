/**
 * Pause home context must not re-export the full user profile (`...profile`).
 * Consumers use useProfile from user/public-hooks for profile fields.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(
  root,
  'src/features/pause/presentation/home/use-holzen-home-context-state.ts',
);

const text = readFileSync(target, 'utf8');
const violations = [];

if (/\.\.\.\s*profile/.test(text)) {
  violations.push('use-holzen-home-context-state.ts: remove `...profile` spread from return');
}

if (violations.length) {
  console.error('check:no-profile-spread-in-pause-home failed:\n');
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}

console.log('check:no-profile-spread-in-pause-home: OK');
