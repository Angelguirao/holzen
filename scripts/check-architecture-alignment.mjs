/**
 * Verifies transitional modular-monolith alignment (waves 0–4) on root Vite layout.
 * See docs/decisions/2026-05-17-modular-monolith-hexagonal-client.md and
 * docs/fundamentals/frontend-module-layout.md §11.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contexts = ['pause', 'subscription', 'market', 'user', 'auth', 'notifications'];
const failures = [];

function mustExist(rel, label = rel) {
  const p = join(root, rel);
  if (!existsSync(p)) failures.push(`missing ${label}`);
}

function mustNotExist(rel, label = rel) {
  const p = join(root, rel);
  if (existsSync(p)) failures.push(`forbidden path still present: ${label}`);
}

function walkTs(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'dist' || name === 'legacy') continue;
      walkTs(p, files);
    } else if (/\.(tsx?)$/.test(name)) files.push(p);
  }
  return files;
}

for (const ctx of contexts) {
  const base = `src/features/${ctx}`;
  mustExist(`${base}/public.ts`, `${base}/public.ts`);
  mustExist(`${base}/domain`, `${base}/domain/`);
  mustExist(`${base}/application`, `${base}/application/`);
  mustExist(`${base}/ports`, `${base}/ports/`);
}

mustExist('src/features/pause/application/use-cases/ritual/frame', 'pause/application/use-cases/ritual/frame/');
mustExist('src/features/pause/application/use-cases/ritual/reflect', 'pause/application/use-cases/ritual/reflect/');
mustExist('src/features/pause/application/use-cases/session', 'pause/application/use-cases/session/');
mustExist('src/features/pause/application/use-cases/ritual/brief', 'pause/application/use-cases/ritual/brief/');
mustNotExist(
  'src/features/pause/application/use-cases/reflect',
  'pause/application/use-cases/reflect/ (use ritual/reflect/)',
);
mustNotExist(
  'src/features/pause/application/use-cases/companion',
  'pause/application/use-cases/companion/ (use ritual/frame/)',
);

const LEGACY_PAUSE_USE_CASE_IMPORTS = [
  '@/features/pause/application/use-cases/reflect/',
  '@/features/pause/application/use-cases/companion/',
  "from './application/use-cases/reflect/",
  "from './application/use-cases/companion/",
  "from '../application/use-cases/reflect/",
  "from '../application/use-cases/companion/",
];

const PAUSE_RPC_CLIENT_ALLOWLIST = new Set([
  'src/features/pause/infrastructure/pause-rpc-client.ts',
  'src/features/pause/infrastructure/supabase-pause-repository.ts',
]);
const PAUSE_RPC_CLIENT_IMPORT_NEEDLES = [
  "from '@/features/pause/infrastructure/pause-rpc-client",
  "from './pause-rpc-client'",
  "from '../pause-rpc-client'",
];

for (const file of walkTs(join(root, 'src'))) {
  const rel = relative(root, file).replace(/\\/g, '/');
  if (rel.startsWith('legacy/')) continue;
  const text = readFileSync(file, 'utf8');
  for (const needle of LEGACY_PAUSE_USE_CASE_IMPORTS) {
    if (text.includes(needle)) {
      failures.push(`${rel}: legacy pause use-case import (${needle})`);
    }
  }
  if (!PAUSE_RPC_CLIENT_ALLOWLIST.has(rel)) {
    for (const needle of PAUSE_RPC_CLIENT_IMPORT_NEEDLES) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: direct pause-rpc-client import (${needle}) — use PauseRepository via supabase-pause-repository`,
        );
        break;
      }
    }
  }
}
mustExist('src/features/notifications/application/use-cases/delivery', 'notifications/application/use-cases/delivery/');
mustExist('vite.config.ts', 'root vite.config.ts');
mustExist('index.html', 'root index.html');

if (existsSync(join(root, 'pnpm-workspace.yaml'))) {
  failures.push('pnpm-workspace.yaml present — ADR §8 monorepo gate not met');
}

const tsconfigApp = readFileSync(join(root, 'tsconfig.app.json'), 'utf8');
if (!tsconfigApp.includes('src/legacy/**')) {
  failures.push('tsconfig.app.json must exclude src/legacy/**');
}

const vitestConfig = readFileSync(join(root, 'vitest.config.ts'), 'utf8');
if (!vitestConfig.includes('src/legacy/**')) {
  failures.push('vitest.config.ts must exclude src/legacy/**');
}

const pkg = readFileSync(join(root, 'package.json'), 'utf8');
if (!pkg.includes('check:feature-imports')) {
  failures.push('package.json must define check:feature-imports');
}
const testCi = pkg.match(/"test:ci"\s*:\s*"([^"]+)"/)?.[1] ?? '';
if (
  !testCi.includes('check:architecture-alignment') &&
  !testCi.includes('check:feature-imports')
) {
  failures.push('test:ci must run check:architecture-alignment (or check:feature-imports)');
}

if (failures.length) {
  console.error('check:architecture-alignment failed:\n');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

for (const script of ['check-feature-imports.mjs', 'check-no-screens-in-features.mjs']) {
  const child = spawnSync(process.execPath, [`scripts/${script}`], {
    cwd: root,
    stdio: 'inherit',
  });
  if (child.status !== 0) process.exit(child.status ?? 1);
}

console.log(
  'check:architecture-alignment: OK (waves 0–5 — features, screens, legacy quarantined)',
);
