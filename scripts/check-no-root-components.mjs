/**
 * Blocks new presentation files at src/components/*.tsx (root only).
 * Wave 5b — presentation layer migration. Allowlist shrinks as files move to src/screens/.
 *
 * Allowed without allowlist: src/components/ui/**, explicit shim re-exports at root.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const componentsDir = join(root, 'src', 'components');
const allowlistPath = join(root, 'scripts', 'check-no-root-components-allowlist.txt');

function listRootComponentFiles() {
  if (!existsSync(componentsDir)) return [];
  return readdirSync(componentsDir)
    .filter((name) => /\.(tsx?)$/.test(name))
    .map((name) => `src/components/${name}`)
    .sort();
}

const allowlist = new Set(
  readFileSync(allowlistPath, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#')),
);

const current = listRootComponentFiles();
const failures = [];

for (const rel of current) {
  if (!allowlist.has(rel)) {
    failures.push(`new root component file: ${rel} — move to src/screens/<route>/components/`);
  }
}

const removed = [...allowlist].filter((rel) => !current.includes(rel));
if (removed.length) {
  console.warn(
    'check:no-root-components: allowlist has paths no longer at components root (shrink allowlist in a follow-up commit):\n',
  );
  for (const r of removed) console.warn(`  - ${r}`);
}

if (failures.length) {
  console.error('check:no-root-components failed:\n');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(
  `check:no-root-components: OK (${current.length} allowlisted root file(s); ui/ and screens/ unaffected)`,
);
