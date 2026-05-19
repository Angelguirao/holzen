// Wave 5: every src/pages .tsx file must be a thin re-export to src/screens/.
// Keeps route files stable for Lovable while implementation lives under screens/.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pagesRoot = join(root, 'src', 'pages');

const THIN_RE =
  /^export\s+\{\s*default\s*\}\s+from\s+['"]@\/screens\/[^'"]+['"];?\s*$/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.tsx')) out.push(p);
  }
  return out;
}

const violations = [];
for (const file of walk(pagesRoot)) {
  const rel = relative(root, file).replace(/\\/g, '/');
  const body = readFileSync(file, 'utf8');
  const stripped = body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('//'))
    .join('\n');
  if (!THIN_RE.test(stripped)) {
    violations.push(rel);
  }
}

if (violations.length) {
  console.error('[check:thin-pages] pages must only re-export from @/screens/*:\n');
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}

console.log(`[check:thin-pages] OK — ${walk(pagesRoot).length} thin page re-export(s)`);
