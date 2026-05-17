/**
 * Plan §29.4 — post-build guard: legacy UI symbols must not ship in dist/assets.
 * Run after `npm run build`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = join(root, 'dist', 'assets');

const NEEDLES = ['BadgesPanelV2', 'ToolsHub'];

if (!statSync(assetsDir, { throwIfNoEntry: false })?.isDirectory()) {
  console.error('[check:bundle-shipped] dist/assets missing — run npm run build first');
  process.exit(1);
}

const hits = [];
for (const name of readdirSync(assetsDir)) {
  if (!name.endsWith('.js')) continue;
  const text = readFileSync(join(assetsDir, name), 'utf8');
  for (const needle of NEEDLES) {
    if (text.includes(needle)) hits.push({ file: `dist/assets/${name}`, needle });
  }
}

if (hits.length) {
  console.error('[check:bundle-shipped] Legacy UI strings found in production bundle:');
  for (const h of hits) console.error(`  ${h.file}: ${h.needle}`);
  process.exit(1);
}

console.log('[check:bundle-shipped] OK — no BadgesPanelV2/ToolsHub in dist/assets');
process.exit(0);
