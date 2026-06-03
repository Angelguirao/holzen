/**
 * Active src/ must not use TanStack Query idle polling (refetchInterval !== false).
 * Invalidation-first: mount, user action, Realtime, explicit invalidateQueries.
 *
 * Owner: docs/fundamentals/architectural-fitness-functions.md §4.2
 * Allowlist: admin ops dashboards only (extend ALLOWLIST_FILES with a sunset note).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Files that may keep timed refetchInterval (ops / live health). */
const ALLOWLIST_FILES = new Set([
  'src/features/pause/infrastructure/queries/provider-health-admin-query.ts',
]);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(root, 'src');

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === 'legacy') continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(tsx?)$/.test(name)) files.push(p);
  }
  return files;
}

const REFETCH_INTERVAL_RE = /refetchInterval\s*:\s*([^,\n}]+)/g;
const violations = [];

for (const file of walk(srcRoot)) {
  const rel = relative(root, file).replace(/\\/g, '/');
  if (rel.startsWith('src/legacy/')) continue;

  const text = readFileSync(file, 'utf8');
  let m;
  while ((m = REFETCH_INTERVAL_RE.exec(text)) !== null) {
    const value = m[1].trim();
    if (value === 'false') continue;
    if (ALLOWLIST_FILES.has(rel)) continue;
    violations.push({ file: rel, value });
  }
}

if (violations.length) {
  console.error('[check:no-idle-query-polling] Timed refetchInterval in active src/:');
  for (const v of violations) {
    console.error(`  ${v.file}: refetchInterval: ${v.value}`);
  }
  console.error('');
  console.error('Use invalidateQueries / Realtime instead, or add an explicit ALLOWLIST_FILES entry.');
  process.exit(1);
}

console.log('[check:no-idle-query-polling] OK');
process.exit(0);
