/**
 * App shell components/hooks must not call PostHog directly — use app/lib/*-telemetry.ts
 * (FeedbackWidget and use-feature-flag are allowlisted).
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appRoot = join(root, 'src', 'app');

const POSTHOG_IMPORT = /from\s+['"]@\/lib\/posthog['"]/;

const ALLOWLIST = new Set([
  'src/app/components/FeedbackWidget.tsx',
  'src/app/hooks/use-feature-flag.ts',
]);

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

for (const file of walk(appRoot)) {
  const rel = relative(root, file).replace(/\\/g, '/');
  if (ALLOWLIST.has(rel)) continue;
  if (rel.startsWith('src/app/lib/') && rel.endsWith('-telemetry.ts')) continue;
  if (/\.(test|spec)\.(ts|tsx)$/.test(rel)) continue;
  const text = readFileSync(file, 'utf8');
  if (POSTHOG_IMPORT.test(text)) {
    violations.push(`${rel}: import @/lib/posthog — use app/lib/*-telemetry.ts`);
  }
}

if (violations.length) {
  console.error('check:no-posthog-in-app failed:\n');
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}

console.log('check:no-posthog-in-app: OK');
