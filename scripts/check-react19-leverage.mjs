/**
 * React 19 leverage closure guard — active `src/` must not reintroduce manual
 * mutation loading flags outside documented allowlists.
 *
 * Owner: docs/fundamentals/modern-react-practices-holzen.md §2.9
 * ADR: docs/decisions/2026-05-23-render-boundaries-defer-react-compiler-19.md
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(root, 'src');

/** Paths (posix, relative to repo root) exempt from manual loading bans. */
const ALLOWLIST = new Set([
  'src/features/auth/presentation/AuthProvider.tsx',
  'src/screens/admin/components/AppConfigTools.tsx',
  'src/screens/admin/components/SourceCatalogViewer.tsx',
  'src/screens/admin/components/StripePriceCheck.tsx',
]);

const MANUAL_LOADING_PATTERNS = [
  { re: /\[\s*loading\s*,\s*setLoading\s*\]\s*=\s*useState/, label: 'useState loading flag' },
  { re: /\[\s*submitting\s*,\s*setSubmitting\s*\]\s*=\s*useState/, label: 'useState submitting flag' },
  { re: /\[\s*busy\s*,\s*setBusy\s*\]\s*=\s*useState/, label: 'useState busy flag' },
  { re: /\[\s*saving\s*,\s*setSaving\s*\]\s*=\s*useState/, label: 'useState saving flag' },
  { re: /\bsetLoading\s*\(\s*true\s*\)/, label: 'setLoading(true)' },
  { re: /\bsetSubmitting\s*\(\s*true\s*\)/, label: 'setSubmitting(true)' },
  { re: /\bsetBusy\s*\(\s*true\s*\)/, label: 'setBusy(true)' },
  { re: /\bsetSaving\s*\(\s*true\s*\)/, label: 'setSaving(true)' },
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === 'legacy') continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name)) files.push(p);
  }
  return files;
}

const violations = [];

for (const file of walk(srcRoot)) {
  const rel = relative(root, file).replace(/\\/g, '/');
  if (rel.startsWith('src/screens/admin/')) continue;
  if (ALLOWLIST.has(rel)) continue;

  const text = readFileSync(file, 'utf8');
  for (const { re, label } of MANUAL_LOADING_PATTERNS) {
    if (re.test(text)) {
      violations.push({ rel, label });
      break;
    }
  }
}

if (violations.length > 0) {
  console.error('check:react19-leverage failed — manual mutation loading in active src:\n');
  for (const v of violations) {
    console.error(`  ${v.rel} (${v.label})`);
  }
  console.error(
    '\nUse useTransition / useActionState / useOptimistic per modern-react-practices-holzen.md §2.9',
  );
  console.error('Or add an explicit allowlist entry in scripts/check-react19-leverage.mjs with justification.');
  process.exit(1);
}

console.log('check:react19-leverage ok — no manual mutation loading outside allowlist');
