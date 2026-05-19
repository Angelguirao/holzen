/**
 * Layer import rules for src/features/<context>/ (transitional modular monolith).
 * See docs/fundamentals/frontend-module-layout.md and holzen-application-architecture.md §8.
 *
 * No-op pass when no feature TypeScript files exist yet (skeleton only).
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const featuresRoot = join(root, 'src', 'features');

const FORBIDDEN_IN_DOMAIN = [
  { re: /from\s+['"]react['"]/, label: 'react import in domain/' },
  { re: /from\s+['"]@supabase\//, label: '@supabase/* in domain/' },
  { re: /from\s+['"]@\/features\/[^'"]+\/(application|infrastructure|presentation)\//, label: 'other layer import in domain/' },
];

const FORBIDDEN_IN_APPLICATION = [
  { re: /from\s+['"]react['"]/, label: 'react import in application/' },
  { re: /from\s+['"]@supabase\//, label: '@supabase/* in application/ (use ports + infrastructure)' },
  { re: /from\s+['"]@\/features\/[^'"]+\/infrastructure\//, label: 'infrastructure import in application/' },
];

const FORBIDDEN_IN_PORTS = [
  { re: /from\s+['"]react['"]/, label: 'react import in ports/' },
  { re: /from\s+['"]@supabase\//, label: '@supabase/* in ports/' },
];

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

function layerFromPath(rel) {
  const m = rel.match(/^src\/features\/[^/]+\/(domain|application|ports|infrastructure|presentation)\//);
  return m?.[1] ?? null;
}

function rulesForLayer(layer) {
  if (layer === 'domain') return FORBIDDEN_IN_DOMAIN;
  if (layer === 'application') return FORBIDDEN_IN_APPLICATION;
  if (layer === 'ports') return FORBIDDEN_IN_PORTS;
  return [];
}

const files = walk(featuresRoot);
if (files.length === 0) {
  console.log('check:feature-imports: no src/features/**/*.ts yet — skip');
  process.exit(0);
}

const violations = [];
for (const file of files) {
  const rel = relative(root, file).replace(/\\/g, '/');
  if (/\.(test|spec)\.(ts|tsx)$/.test(rel)) continue;
  const layer = layerFromPath(rel);
  if (!layer) continue;
  const text = readFileSync(file, 'utf8');
  for (const { re, label } of rulesForLayer(layer)) {
    if (re.test(text)) violations.push({ file: rel, label });
  }
}

/** Active app must use public / public-queries / public-rpc — not deep feature layers. */
const DEEP_FEATURE_IMPORT =
  /from\s+['"]@\/features\/[^'"]+\/(application|infrastructure|domain|presentation)\//;

const ALLOWED_DEEP_IMPORT_FILES = new Set([
  'src/features/pause/application/use-cases/apply-bulk-hold-outcomes.test.ts',
  'src/features/subscription/presentation/CheckoutConfirmation.close-reopen.test.tsx',
  'src/features/subscription/presentation/CheckoutConfirmation.cross-tab.test.tsx',
  'src/features/subscription/presentation/CheckoutConfirmation.guard.test.tsx',
  'src/features/subscription/presentation/CheckoutConfirmation.refresh-state.test.tsx',
  'src/test/subscription-checkout-no-refetch-on-back-nav.test.tsx',
  'src/app/components/AppLayout.tsx',
]);

/** Migrated pause/companion domain — active app must use feature public APIs, not lib shims. */
const LIB_COMPANION_SHIM = /@\/lib\/companion-/;
const ALLOWED_LIB_PAUSE_IMPORTS = new Set([]);

const ALLOWED_FEATURE_IMPORT =
  /from\s+['"]@\/features\/[^'"]+\/(public|public-queries|public-rpc|public-hooks|public-limits)['"]/;

const ACTIVE_APP_ROOTS = [
  join(root, 'src', 'components'),
  join(root, 'src', 'screens'),
  join(root, 'src', 'app'),
  join(root, 'src', 'lib'),
  join(root, 'src', 'test'),
];

for (const dir of ACTIVE_APP_ROOTS) {
  for (const file of walk(dir)) {
    const rel = relative(root, file).replace(/\\/g, '/');
    if (rel.includes('/legacy/')) continue;
    if (ALLOWED_DEEP_IMPORT_FILES.has(rel)) continue;
    const text = readFileSync(file, 'utf8');
    if (DEEP_FEATURE_IMPORT.test(text)) {
      const lines = text.split('\n');
      const badLines = lines.filter(
        (line) => DEEP_FEATURE_IMPORT.test(line) && !ALLOWED_FEATURE_IMPORT.test(line),
      );
      if (badLines.length) {
        violations.push({
          file: rel,
          label: 'deep feature import — use @/features/<ctx>/public, public-queries, public-rpc, or public-hooks',
        });
      }
    }
    if (LIB_COMPANION_SHIM.test(text)) {
      violations.push({
        file: rel,
        label: '@/lib/companion-* import — use @/features/pause/public or public-queries',
      });
    }
    const pauseLibImports = text.match(/@\/lib\/pause-[a-z0-9-]+/g) ?? [];
    for (const imp of pauseLibImports) {
      if (!ALLOWED_LIB_PAUSE_IMPORTS.has(imp)) {
        violations.push({
          file: rel,
          label: `${imp} — use @/features/pause/public or public-queries (RPC: allowlisted lib shims only)`,
        });
      }
    }
  }
}

if (violations.length) {
  console.error('check:feature-imports failed:\n');
  for (const v of violations) {
    console.error(`  ${v.file}: ${v.label}`);
  }
  process.exit(1);
}

console.log(`check:feature-imports: OK (${files.length} file(s) under src/features/)`);
