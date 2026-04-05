/**
 * Optional typecheck for Supabase Edge functions (Deno).
 * Exits 0 with a skip message if `deno` is not on PATH — CI/local friendly.
 */
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const denoVersion = spawnSync('deno', ['--version'], { encoding: 'utf8' });
if (denoVersion.error || denoVersion.status !== 0) {
  console.log(
    '[check:edge] Skipped: Deno not on PATH. Install: https://docs.deno.com/runtime/getting_started/installation/',
  );
  process.exit(0);
}

const fnRoot = join(repoRoot, 'supabase', 'functions');
if (!existsSync(fnRoot)) {
  console.log('[check:edge] Skipped: supabase/functions not found.');
  process.exit(0);
}

const entrypoints = readdirSync(fnRoot, { withFileTypes: true })
  .filter((e) => e.isDirectory() && e.name !== '_shared')
  .map((e) => join(fnRoot, e.name, 'index.ts'))
  .filter((p) => existsSync(p));

if (entrypoints.length === 0) {
  console.log('[check:edge] No index.ts entrypoints under supabase/functions/.');
  process.exit(0);
}

console.log(`[check:edge] deno check (${entrypoints.length} functions)…`);
const result = spawnSync('deno', ['check', ...entrypoints], {
  cwd: repoRoot,
  stdio: 'inherit',
});
process.exit(result.status === null ? 1 : result.status);
