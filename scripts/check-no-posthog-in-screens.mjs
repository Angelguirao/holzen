/**
 * Route screens must not call PostHog directly — use feature *-telemetry-io barrels
 * or app/lib/app-route-telemetry.ts.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const screensRoot = join(root, 'src', 'screens');
const POSTHOG_IMPORT = /from\s+['"]@\/lib\/posthog['"]/;

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

for (const file of walk(screensRoot)) {
  const rel = relative(root, file).replace(/\\/g, '/');
  if (/\.(test|spec)\.(ts|tsx)$/.test(rel)) continue;
  const text = readFileSync(file, 'utf8');
  if (POSTHOG_IMPORT.test(text)) {
    violations.push(`${rel}: import @/lib/posthog — use feature telemetry I/O or app/lib`);
  }
}

if (violations.length) {
  console.error('check:no-posthog-in-screens failed:\n');
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}

console.log('check:no-posthog-in-screens: OK');
