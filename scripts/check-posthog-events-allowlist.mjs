/**
 * Fail when active src/ emits PostHog events not listed in docs/ops/event-taxonomy.md
 * (plan §23.5 optional guard).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const taxonomyPath = join(root, 'docs', 'ops', 'event-taxonomy.md');
const srcRoot = join(root, 'src');

const taxonomy = readFileSync(taxonomyPath, 'utf8');
const activeStart = taxonomy.indexOf('## Active events');
const activeEnd = taxonomy.indexOf('## Super-properties');
const activeSection =
  activeStart >= 0
    ? taxonomy.slice(activeStart, activeEnd >= 0 ? activeEnd : undefined)
    : taxonomy;

const allowlisted = new Set();
for (const m of activeSection.matchAll(/\|\s*`([a-z][a-z0-9_.]+)`\s*\|/g)) {
  allowlisted.add(m[1]);
}
for (const m of activeSection.matchAll(/`([a-z][a-z0-9_.]+)`/g)) {
  const name = m[1];
  if (name.includes('.')) allowlisted.add(name);
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
const trackRe = /trackEvent\s*\(\s*['"]([a-z][a-z0-9_.]+)['"]/g;

for (const file of walk(srcRoot)) {
  const rel = relative(root, file).replace(/\\/g, '/');
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(trackRe)) {
    const event = m[1];
    if (!used.has(event)) used.set(event, rel);
  }
}

const missing = [...used.keys()].filter((e) => !allowlisted.has(e)).sort();

if (missing.length) {
  console.error('[check:posthog-events-allowlist] Events in active src/ missing from event-taxonomy.md:');
  for (const e of missing) {
    console.error(`  - ${e} (e.g. ${used.get(e)})`);
  }
  process.exit(1);
}

console.log(
  `[check:posthog-events-allowlist] OK — ${used.size} distinct events, ${allowlisted.size} taxonomy entries in Active section`,
);
process.exit(0);
