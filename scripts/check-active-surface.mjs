/**
 * Forbidden imports/paths in active src/ (excludes src/legacy/**).
 * See docs/ops/active-surface.md and pause-first plan §18.2.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(root, 'src');

const FORBIDDEN_PATTERNS = [
  { re: /@\/legacy\//, label: '@/legacy/* import from active tree' },
  { re: /@\/components\/stats\//, label: '@/components/stats/*' },
  { re: /@\/lib\/badges\//, label: '@/lib/badges/*' },
  { re: /@\/lib\/stats\//, label: '@/lib/stats/*' },
  { re: /@\/pages\/Profile/, label: '@/pages/Profile' },
  { re: /@\/pages\/ToolsHub/, label: '@/pages/ToolsHub' },
  { re: /@\/hooks\/use-pause-stats-data/, label: '@/hooks/use-pause-stats-data' },
  { re: /@\/hooks\/use-badge-sync/, label: '@/hooks/use-badge-sync' },
  { re: /@\/hooks\/use-badges/, label: '@/hooks/use-badges' },
  { re: /@\/hooks\/use-tools-hub-data/, label: '@/hooks/use-tools-hub-data' },
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === 'legacy') continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(tsx?|jsx?)$/.test(name)) files.push(p);
  }
  return files;
}

const violations = [];
for (const file of walk(srcRoot)) {
  const rel = relative(root, file).replace(/\\/g, '/');
  if (rel.startsWith('src/legacy/')) continue;
  const text = readFileSync(file, 'utf8');
  for (const { re, label } of FORBIDDEN_PATTERNS) {
    if (re.test(text)) {
      violations.push({ file: rel, label });
    }
  }
}

if (violations.length) {
  console.error('[check:active-surface] Forbidden patterns in active src/:');
  for (const v of violations) {
    console.error(`  ${v.file}: ${v.label}`);
  }
  process.exit(1);
}

console.log('[check:active-surface] OK — no forbidden imports in active src/');
process.exit(0);
