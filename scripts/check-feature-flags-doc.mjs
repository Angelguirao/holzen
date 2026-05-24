/**
 * Fail when active src/ reads PostHog flags not listed in docs/ops/feature-flags.md
 * Active flags table (plan §6 gap — mirror check-posthog-events-allowlist).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const flagsPath = join(root, 'docs', 'ops', 'feature-flags.md');
const srcRoot = join(root, 'src');

const flagsDoc = readFileSync(flagsPath, 'utf8');
const activeStart = flagsDoc.indexOf('## Active flags');
const activeEnd = flagsDoc.indexOf('## Naming convention');
const activeSection =
  activeStart >= 0
    ? flagsDoc.slice(activeStart, activeEnd >= 0 ? activeEnd : undefined)
    : flagsDoc;

const allowlisted = new Set();
for (const m of activeSection.matchAll(/\|\s*`([a-z][a-z0-9_.]+)`\s*\|/g)) {
  allowlisted.add(m[1]);
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === 'legacy' || name === 'test') continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(tsx?|jsx?)$/.test(name)) files.push(p);
  }
  return files;
}

const used = new Map();
const flagRe = /useFeatureFlag\s*\(\s*['"]([a-z][a-z0-9_.]+)['"]/g;

for (const file of walk(srcRoot)) {
  const rel = relative(root, file).replace(/\\/g, '/');
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(flagRe)) {
    const key = m[1];
    if (!used.has(key)) used.set(key, rel);
  }
}

const missing = [...used.keys()].filter((k) => !allowlisted.has(k)).sort();

if (missing.length) {
  console.error('[check:feature-flags-doc] Flags in active src/ missing from feature-flags.md:');
  for (const k of missing) {
    console.error(`  - ${k} (e.g. ${used.get(k)})`);
  }
  process.exit(1);
}

console.log(
  `[check:feature-flags-doc] OK — ${used.size} distinct flag(s), ${allowlisted.size} doc entries in Active flags`,
);
process.exit(0);
