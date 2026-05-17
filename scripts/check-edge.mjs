/**
 * Optional typecheck for Supabase Edge functions (Deno).
 * Exits 0 with a skip message if Deno cannot be found — CI/local friendly.
 *
 * Resolves Deno in order: PATH → DENO_INSTALL/bin → ~/.deno/bin (official installer).
 */
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const isWin = process.platform === 'win32';
const denoExe = isWin ? 'deno.exe' : 'deno';

/** @returns {string | null} */
function resolveDenoBinary() {
  const tryRun = (cmd) => {
    const r = spawnSync(cmd, ['--version'], { encoding: 'utf8' });
    if (!r.error && r.status === 0) return cmd;
    return null;
  };

  const fromPath = tryRun('deno');
  if (fromPath) return fromPath;

  const candidates = [];
  if (process.env.DENO_INSTALL) {
    candidates.push(join(process.env.DENO_INSTALL, 'bin', denoExe));
  }
  candidates.push(join(homedir(), '.deno', 'bin', denoExe));

  for (const p of candidates) {
    if (!existsSync(p)) continue;
    const r = spawnSync(p, ['--version'], { encoding: 'utf8' });
    if (!r.error && r.status === 0) return p;
  }

  return null;
}

const denoBin = resolveDenoBinary();
if (!denoBin) {
  console.log(
    '[check:edge] Skipped: Deno not found. Add Deno to PATH or install: https://docs.deno.com/runtime/getting_started/installation/',
  );
  console.log(
    '[check:edge] Tip (Windows): default install is %USERPROFILE%\\.deno\\bin — add that folder to PATH, or set DENO_INSTALL.',
  );
  process.exit(0);
}

const fnRoot = join(repoRoot, 'supabase', 'functions');
if (!existsSync(fnRoot)) {
  console.log('[check:edge] Skipped: supabase/functions not found.');
  process.exit(0);
}

const entrypoints = readdirSync(fnRoot, { withFileTypes: true })
  .filter((e) => e.isDirectory() && e.name !== '_shared' && e.name !== 'legacy')
  .map((e) => join(fnRoot, e.name, 'index.ts'))
  .filter((p) => existsSync(p));

if (entrypoints.length === 0) {
  console.log('[check:edge] No index.ts entrypoints under supabase/functions/.');
  process.exit(0);
}

console.log(`[check:edge] ${denoBin} — check (${entrypoints.length} functions)…`);
const result = spawnSync(denoBin, ['check', '--no-lock', ...entrypoints], {
  cwd: repoRoot,
  stdio: 'inherit',
});
process.exit(result.status === null ? 1 : result.status);
