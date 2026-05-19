/**
 * One-off audit: @/lib/* import counts (active vs legacy vs test).
 * Run: node scripts/audit-lib-imports.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const libDir = join(root, 'src', 'lib');

function walk(dir, files = [], skipLegacy = false) {
  if (!existsSync(dir)) return files;
  const st = statSync(dir);
  if (st.isFile() && /\.(tsx?)$/.test(dir)) {
    files.push(dir);
    return files;
  }
  if (!st.isDirectory()) return files;
  for (const name of readdirSync(dir)) {
    if (skipLegacy && name === 'legacy') continue;
    walk(join(dir, name), files, skipLegacy);
  }
  return files;
}

const libFiles = walk(libDir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));
const importCounts = new Map();

for (const lf of libFiles) {
  const base = basename(lf, '.ts');
  const text = readFileSync(lf, 'utf8');
  importCounts.set(base, {
    base,
    deprecated: text.includes('@deprecated'),
    active: 0,
    legacy: 0,
    libSelf: 0,
    test: 0,
    features: 0,
  });
}

function bump(rec, bucket) {
  rec[bucket]++;
}

function scanFiles(fileList) {
  for (const f of fileList) {
    const rel = relative(root, f).replace(/\\/g, '/');
    const text = readFileSync(f, 'utf8');
    let bucket = 'active';
    if (rel.startsWith('src/lib/')) bucket = 'libSelf';
    else if (rel.startsWith('src/legacy/')) bucket = 'legacy';
    else if (rel.startsWith('src/test/')) bucket = 'test';
    else if (rel.startsWith('src/features/')) bucket = 'features';

    for (const [base, rec] of importCounts) {
      const needle = `@/lib/${base}`;
      if (!text.includes(needle)) continue;
      const re = new RegExp(`from\\s+['"]${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`);
      if (re.test(text)) bump(rec, bucket);
    }
  }
}

const activeRoots = [
  join(root, 'src', 'screens'),
  join(root, 'src', 'app'),
  join(root, 'src', 'hooks'),
  join(root, 'src', 'components'),
  join(root, 'src', 'pages'),
  join(root, 'src', 'App.tsx'),
  join(root, 'src', 'main.tsx'),
];
const activeFiles = [];
for (const p of activeRoots) {
  if (!existsSync(p)) continue;
  if (statSync(p).isFile()) activeFiles.push(p);
  else walk(p, activeFiles, true);
}

const legacyFiles = walk(join(root, 'src', 'legacy'));
const testFiles = walk(join(root, 'src', 'test'));
const featureFiles = walk(join(root, 'src', 'features'));

scanFiles([...activeFiles, ...legacyFiles, ...testFiles, ...featureFiles, ...walk(libDir)]);

const shims = [...importCounts.values()].filter((r) => r.deprecated);
const nonShims = [...importCounts.values()].filter((r) => !r.deprecated);

const shimZeroAll = shims.filter(
  (r) => r.active === 0 && r.legacy === 0 && r.test === 0 && r.features === 0,
);
const shimActiveOnly = shims.filter((r) => r.active > 0);
const shimLegacyOnly = shims.filter((r) => r.active === 0 && r.legacy > 0);
const shimTestOnly = shims.filter(
  (r) => r.active === 0 && r.legacy === 0 && r.test > 0 && r.features === 0,
);

console.log('=== src/lib audit ===\n');
console.log(`Lib modules (excl .test.ts): ${libFiles.length}`);
console.log(`Deprecated shims: ${shims.length}`);
console.log(`Non-shim (real lib): ${nonShims.length}\n`);

console.log(`Shims with NO importers anywhere: ${shimZeroAll.length}`);
console.log(`Shims still imported by ACTIVE code: ${shimActiveOnly.length}`);
console.log(`Shims LEGACY-only: ${shimLegacyOnly.length}`);
console.log(`Shims TEST-only (no active/legacy): ${shimTestOnly.length}\n`);

if (shimActiveOnly.length) {
  console.log('--- Shims still used in active tree (fix imports first) ---');
  for (const r of shimActiveOnly.sort((a, b) => b.active - a.active)) {
    console.log(`  ${r.base}  active=${r.active} test=${r.test}`);
  }
  console.log('');
}

console.log('--- Shims safe to delete (zero importers) ---');
for (const r of shimZeroAll.sort((a, b) => a.base.localeCompare(b.base))) {
  console.log(`  ${r.base}.ts`);
}

if (shimLegacyOnly.length) {
  console.log('\n--- Shims only legacy imports (delete with legacy) ---');
  for (const r of shimLegacyOnly.sort((a, b) => a.base.localeCompare(b.base))) {
    console.log(`  ${r.base}.ts  legacy=${r.legacy}`);
  }
}

console.log('\n--- Non-shim: most used in ACTIVE tree ---');
for (const r of nonShims.filter((x) => x.active > 0).sort((a, b) => b.active - a.active).slice(0, 30)) {
  console.log(`  ${String(r.active).padStart(3)}  ${r.base}`);
}

console.log('\n--- Non-shim: zero active importers ---');
for (const r of nonShims.filter((x) => x.active === 0).sort((a, b) => a.base.localeCompare(b.base))) {
  const extra = [r.legacy && `legacy=${r.legacy}`, r.test && `test=${r.test}`, r.features && `features=${r.features}`]
    .filter(Boolean)
    .join(' ');
  console.log(`  ${r.base}.ts${extra ? `  (${extra})` : ''}`);
}
