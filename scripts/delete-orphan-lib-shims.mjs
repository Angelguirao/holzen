/**
 * Delete deprecated src/lib shims with zero importers (see audit-lib-imports.mjs).
 * Dry run: node scripts/delete-orphan-lib-shims.mjs
 * Apply:   node scripts/delete-orphan-lib-shims.mjs --apply
 */
import { readFileSync, readdirSync, statSync, existsSync, unlinkSync } from 'node:fs';
import { join, dirname, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const libDir = join(root, 'src', 'lib');
const apply = process.argv.includes('--apply');

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
  importCounts.set(lf, {
    base,
    deprecated: text.includes('@deprecated'),
    active: 0,
    legacy: 0,
    libSelf: 0,
    test: 0,
    features: 0,
  });
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

    for (const [lf, rec] of importCounts) {
      const base = rec.base;
      const needles = [`@/lib/${base}`, `./lib/${base}`, `../lib/${base}`];
      if (lf.includes(`${base}.ts`) && lf.replace(/\\/g, '/').includes(`/journey/`)) {
        needles.push(`@/lib/journey/${base}`);
      }
      const journeyPath = join(libDir, 'journey', `${base}.ts`);
      if (lf === journeyPath) {
        needles.push(`@/lib/journey/${base}`);
      }
      if (!needles.some((n) => text.includes(n))) continue;
      const re = new RegExp(
        `from\\s+['"](@/lib/(?:journey/)?${base}|\\.\\.?/lib/(?:journey/)?${base})['"]`,
      );
      if (re.test(text)) {
        rec[bucket]++;
      }
    }
  }
}

const allSrc = walk(join(root, 'src'));
scanFiles(allSrc);

const toDelete = [...importCounts.entries()].filter(([, r]) => {
  if (!r.deprecated) return false;
  return r.active === 0 && r.legacy === 0 && r.test === 0 && r.features === 0;
});

console.log(`${apply ? 'Deleting' : 'Would delete'} ${toDelete.length} orphan lib shims:\n`);
for (const [path] of toDelete.sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(' ', relative(root, path).replace(/\\/g, '/'));
}

if (!apply) {
  console.log('\nRe-run with --apply to delete.');
  process.exit(0);
}

for (const [path] of toDelete) {
  unlinkSync(path);
}
console.log('\nDone.');
