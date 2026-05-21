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
mustExist(
  'src/features/pause/application/use-cases/ritual/reflect/flows',
  'pause/application/use-cases/ritual/reflect/flows/',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/reflect/ambience',
  'pause/application/use-cases/ritual/reflect/ambience/',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/reflect/share',
  'pause/application/use-cases/ritual/reflect/share/',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/reflect/generation',
  'pause/application/use-cases/ritual/reflect/generation/',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/reflect/steps',
  'pause/application/use-cases/ritual/reflect/steps/',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/reflect/telemetry',
  'pause/application/use-cases/ritual/reflect/telemetry/',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/reflect/hub',
  'pause/application/use-cases/ritual/reflect/hub/',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/reflect/mood',
  'pause/application/use-cases/ritual/reflect/mood/',
);
mustExist('src/features/pause/presentation/reflect', 'pause/presentation/reflect/');
mustExist(
  'src/features/pause/presentation/reflect/flows',
  'pause/presentation/reflect/flows/',
);
mustExist(
  'src/features/pause/presentation/reflect/ambience',
  'pause/presentation/reflect/ambience/',
);
mustExist(
  'src/features/pause/presentation/reflect/share',
  'pause/presentation/reflect/share/',
);
mustExist(
  'src/features/pause/presentation/reflect/generation',
  'pause/presentation/reflect/generation/',
);
mustExist(
  'src/features/pause/presentation/reflect/steps',
  'pause/presentation/reflect/steps/',
);
mustExist(
  'src/features/pause/presentation/reflect/telemetry',
  'pause/presentation/reflect/telemetry/',
);
mustExist(
  'src/features/pause/presentation/reflect/hub',
  'pause/presentation/reflect/hub/',
);
mustExist(
  'src/features/pause/presentation/reflect/mood',
  'pause/presentation/reflect/mood/',
);
mustNotExist(
  'src/features/pause/domain/reflect/share/reflection-share-canvas.ts',
  'domain/reflect/share/reflection-share-canvas.ts (use application/use-cases/ritual/reflect/share/)',
);
mustNotExist(
  'src/features/pause/domain/reflect/share/deliver-reflection-share-image.ts',
  'domain/reflect/share/deliver-reflection-share-image.ts (use application/use-cases/ritual/reflect/share/)',
);
mustNotExist(
  'src/features/pause/domain/reflect/ambience',
  'domain/reflect/ambience/ (use application/use-cases/ritual/reflect/ambience/)',
);
mustExist('src/features/pause/domain/reflect/flows', 'pause/domain/reflect/flows/');
mustExist('src/features/pause/domain/reflect/generation', 'pause/domain/reflect/generation/');
mustExist('src/features/pause/domain/reflect/steps', 'pause/domain/reflect/steps/');
mustExist('src/features/pause/domain/reflect/hub', 'pause/domain/reflect/hub/');
mustExist('src/features/pause/domain/reflect/mood', 'pause/domain/reflect/mood/');
mustExist('src/features/pause/domain/reflect/share', 'pause/domain/reflect/share/');
mustExist('src/features/pause/domain/reflect/scaffold', 'pause/domain/reflect/scaffold/');
mustExist('src/features/pause/infrastructure/queries/reflect', 'pause/infrastructure/queries/reflect/');
mustExist('src/features/pause/infrastructure/edge/reflect', 'pause/infrastructure/edge/reflect/');
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

/** Flat presentation/reflect paths — use subclusters (generation/, steps/, mood/, …). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_IMPORTS = [
  '@/features/pause/presentation/reflect/use-pause-reflect-generation',
  '@/features/pause/presentation/reflect/use-pause-artifact-haiku',
  '@/features/pause/presentation/reflect/use-pause-artifact-reflection-text',
  '@/features/pause/presentation/reflect/use-pause-reflection-step-log',
  '@/features/pause/presentation/reflect/use-pause-reflect-ui-telemetry',
  '@/features/pause/presentation/reflect/use-pause-reflect-tags',
  '@/features/pause/presentation/reflect/use-pause-reflect-note',
  '@/features/pause/presentation/reflect/use-pause-reflect-frame-focus-ambience',
  '@/features/pause/presentation/reflect/use-pause-favorite-toggle',
  '@/features/pause/presentation/reflect/use-pause-session-mood-chrome-handlers',
  '@/features/pause/presentation/reflect/use-pause-session-mood-and-persist',
  '@/features/pause/presentation/reflect/use-pause-session-depth-picker-handlers',
  '@/features/pause/presentation/reflect/use-pause-session-feel-tiles-select',
  '@/features/pause/presentation/reflect/use-pause-session-initial-mood-handlers',
  '@/features/pause/presentation/reflect/use-pause-shift-frame-done-handler',
  '@/features/pause/presentation/reflect/use-pause-session-reflect-and-decide',
  '@/features/pause/presentation/reflect/use-pause-session-decide-handler',
  '@/features/pause/presentation/reflect/use-reflection-share-handlers',
  "from './presentation/reflect/use-pause-reflect-generation'",
  "from './presentation/reflect/use-pause-favorite-toggle'",
  "from '../presentation/reflect/use-pause-reflect-generation'",
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

const PAUSE_ANALYTICS_EVENTS_ALLOWLIST = new Set([
  'src/features/pause/infrastructure/analytics-events.ts',
  'src/features/pause/infrastructure/supabase-pause-analytics-repository.ts',
]);
const PAUSE_ANALYTICS_EVENTS_IMPORT_NEEDLES = [
  "from '@/features/pause/infrastructure/analytics-events",
  "from './analytics-events'",
  "from '../analytics-events'",
];

const PAUSE_ANALYTICS_REPOSITORY_ALLOWLIST = new Set([
  'src/features/pause/infrastructure/supabase-pause-analytics-repository.ts',
  'src/features/pause/public-rpc.ts',
]);
const PAUSE_ANALYTICS_REPOSITORY_IMPORT_NEEDLES = [
  "from '@/features/pause/infrastructure/supabase-pause-analytics-repository",
  "from './supabase-pause-analytics-repository'",
  "from '../supabase-pause-analytics-repository'",
];

const PAUSE_PERSISTED_SESSION_STORAGE_ALLOWLIST = new Set([
  'src/features/pause/infrastructure/session/persisted-session-storage.ts',
  'src/features/pause/public-session.ts',
]);
const PAUSE_PERSISTED_SESSION_STORAGE_IMPORT_NEEDLES = [
  "from '@/features/pause/infrastructure/session/persisted-session-storage",
  "from './infrastructure/session/persisted-session-storage'",
  "from '../infrastructure/session/persisted-session-storage'",
  "from './session/persisted-session-storage'",
  "from '../session/persisted-session-storage'",
];

const PAUSE_INSTANCE_METADATA_CLIENT_ALLOWLIST = new Set([
  'src/features/pause/infrastructure/pause-instance-metadata-client.ts',
  'src/features/pause/infrastructure/supabase-pause-repository.ts',
]);
const PAUSE_INSTANCE_METADATA_CLIENT_IMPORT_NEEDLES = [
  "from '@/features/pause/infrastructure/pause-instance-metadata-client",
  "from './pause-instance-metadata-client'",
  "from '../pause-instance-metadata-client'",
];

const PAUSE_RPC_LIFECYCLE_TELEMETRY_ALLOWLIST = new Set([
  'src/features/pause/infrastructure/pause-rpc-lifecycle-telemetry.ts',
  'src/features/pause/infrastructure/pause-rpc-lifecycle-telemetry.test.ts',
  'src/features/pause/infrastructure/pause-rpc-client.ts',
]);
const PAUSE_RPC_LIFECYCLE_TELEMETRY_IMPORT_NEEDLES = [
  "from '@/features/pause/infrastructure/pause-rpc-lifecycle-telemetry",
  "from './pause-rpc-lifecycle-telemetry'",
  "from '../pause-rpc-lifecycle-telemetry'",
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
  for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_IMPORTS) {
    if (text.includes(needle)) {
      failures.push(`${rel}: legacy flat presentation/reflect import (${needle})`);
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
  if (!PAUSE_ANALYTICS_EVENTS_ALLOWLIST.has(rel)) {
    for (const needle of PAUSE_ANALYTICS_EVENTS_IMPORT_NEEDLES) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: direct analytics-events import (${needle}) — use PauseAnalyticsRepository via supabase-pause-analytics-repository`,
        );
        break;
      }
    }
  }
  if (!PAUSE_ANALYTICS_REPOSITORY_ALLOWLIST.has(rel)) {
    for (const needle of PAUSE_ANALYTICS_REPOSITORY_IMPORT_NEEDLES) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: direct supabase-pause-analytics-repository import (${needle}) — use public-rpc`,
        );
        break;
      }
    }
  }
  if (!PAUSE_PERSISTED_SESSION_STORAGE_ALLOWLIST.has(rel)) {
    for (const needle of PAUSE_PERSISTED_SESSION_STORAGE_IMPORT_NEEDLES) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: direct persisted-session-storage import (${needle}) — use public-session`,
        );
        break;
      }
    }
  }
  if (!PAUSE_INSTANCE_METADATA_CLIENT_ALLOWLIST.has(rel)) {
    for (const needle of PAUSE_INSTANCE_METADATA_CLIENT_IMPORT_NEEDLES) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: direct pause-instance-metadata-client import (${needle}) — use PauseRepository.toggleCompanionSlotFavorite via supabase-pause-repository`,
        );
        break;
      }
    }
  }
  if (!PAUSE_RPC_LIFECYCLE_TELEMETRY_ALLOWLIST.has(rel)) {
    for (const needle of PAUSE_RPC_LIFECYCLE_TELEMETRY_IMPORT_NEEDLES) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: direct pause-rpc-lifecycle-telemetry import (${needle}) — keep PostHog RPC side effects inside pause-rpc-client`,
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
