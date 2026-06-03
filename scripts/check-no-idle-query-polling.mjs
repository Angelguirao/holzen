/**
 * Active src/ must follow invalidation-first TanStack Query:
 * - no timed refetchInterval (except explicit allowlist)
 * - no refetchOnWindowFocus: true
 * - no refetchOnReconnect: true
 * - no window focus listeners that invalidateQueries
 *
 * Owner: docs/fundamentals/architectural-fitness-functions.md §4.2
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Timed refetchInterval (ops dashboards). */
const ALLOWLIST_REFETCH_INTERVAL = new Set([
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
const REFETCH_WINDOW_FOCUS_RE = /refetchOnWindowFocus\s*:\s*true\b/;
const REFETCH_RECONNECT_RE = /refetchOnReconnect\s*:\s*true\b/;
const FOCUS_LISTENER_RE = /addEventListener\s*\(\s*['"]focus['"]/;

const violations = [];

for (const file of walk(srcRoot)) {
  const rel = relative(root, file).replace(/\\/g, '/');
  if (rel.startsWith('src/legacy/')) continue;

  const text = readFileSync(file, 'utf8');

  let m;
  while ((m = REFETCH_INTERVAL_RE.exec(text)) !== null) {
    const value = m[1].trim();
    if (value === 'false') continue;
    if (ALLOWLIST_REFETCH_INTERVAL.has(rel)) continue;
    violations.push({ file: rel, rule: 'refetchInterval', detail: value });
  }

  if (REFETCH_WINDOW_FOCUS_RE.test(text)) {
    violations.push({ file: rel, rule: 'refetchOnWindowFocus', detail: 'true' });
  }

  if (REFETCH_RECONNECT_RE.test(text)) {
    violations.push({ file: rel, rule: 'refetchOnReconnect', detail: 'true' });
  }

  if (FOCUS_LISTENER_RE.test(text) && /invalidateQueries/.test(text)) {
    violations.push({
      file: rel,
      rule: 'focus-invalidate',
      detail: 'addEventListener("focus") + invalidateQueries',
    });
  }
}

if (violations.length) {
  console.error('[check:no-idle-query-polling] Invalidation-first query violations in active src/:');
  for (const v of violations) {
    console.error(`  ${v.file}: ${v.rule} (${v.detail})`);
  }
  console.error('');
  console.error(
    'Fetch on mount, user action, Realtime, or explicit invalidateQueries — not timers or focus/reconnect.',
  );
  process.exit(1);
}

console.log('[check:no-idle-query-polling] OK');
process.exit(0);
