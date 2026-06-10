/**
 * Copy Astro static output into the Vite `dist/` after renaming SPA entry to `spa.html`.
 * Vercel serves matching static paths first; unmatched routes rewrite to `spa.html`.
 *
 * @see docs/ops/marketing-site-split.md
 */
import { cpSync, existsSync, mkdirSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const spaDist = join(root, 'dist');
const siteDist = join(root, 'apps', 'site', 'dist');
const spaEntry = join(spaDist, 'index.html');
const spaShell = join(spaDist, 'spa.html');

if (!existsSync(spaEntry)) {
  console.error('merge-marketing-dist: missing dist/index.html — run vite build first');
  process.exit(1);
}

if (!existsSync(siteDist)) {
  console.error('merge-marketing-dist: missing apps/site/dist — run build:site first');
  process.exit(1);
}

renameSync(spaEntry, spaShell);
cpSync(siteDist, spaDist, { recursive: true });

console.log('merge-marketing-dist: dist/spa.html (product) + Astro static paths merged into dist/');
