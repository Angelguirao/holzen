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
  'src/features/pause/application/use-cases/ritual/reflect/generation/manual-open',
  'pause/application/use-cases/ritual/reflect/generation/manual-open/',
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
mustExist(
  'src/features/pause/application/use-cases/session/scaffold',
  'pause/application/use-cases/session/scaffold/',
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
  'src/features/pause/presentation/reflect/generation/manual-open',
  'pause/presentation/reflect/generation/manual-open/',
);
mustExist(
  'src/features/pause/presentation/reflect/steps',
  'pause/presentation/reflect/steps/',
);
mustExist(
  'src/features/pause/presentation/reflect/hub',
  'pause/presentation/reflect/hub/',
);
mustExist(
  'src/features/pause/presentation/reflect/mood',
  'pause/presentation/reflect/mood/',
);
mustExist(
  'src/features/pause/presentation/session/breath',
  'pause/presentation/session/breath/',
);
mustExist(
  'src/features/pause/presentation/session/scaffold',
  'pause/presentation/session/scaffold/',
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
mustExist(
  'src/features/pause/infrastructure/queries/reflect/steps',
  'pause/infrastructure/queries/reflect/steps/',
);
mustExist(
  'src/features/pause/infrastructure/queries/reflect/generation',
  'pause/infrastructure/queries/reflect/generation/',
);
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
  '@/features/pause/application/use-cases/ritual/reflect/scaffold/scaffold-ritual-derived',
  '@/features/pause/application/use-cases/ritual/reflect/scaffold/storage-ritual-sync',
  '@/features/pause/application/use-cases/ritual/reflect/scaffold/persist-snapshot',
  '@/features/pause/application/use-cases/ritual/reflect/scaffold/migrate-persisted-session',
  '@/features/pause/application/use-cases/ritual/reflect/telemetry/manual-open/',
  '@/features/pause/application/use-cases/ritual/reflect/telemetry/home/',
  '@/features/pause/application/use-cases/ritual/reflect/telemetry/session/',
  "from './application/use-cases/reflect/",
  "from './application/use-cases/companion/",
  "from './application/use-cases/ritual/reflect/scaffold/scaffold-ritual-derived'",
  "from './application/use-cases/ritual/reflect/scaffold/storage-ritual-sync'",
  "from './application/use-cases/ritual/reflect/scaffold/persist-snapshot'",
  "from './application/use-cases/ritual/reflect/scaffold/migrate-persisted-session'",
  "from '../application/use-cases/reflect/",
  "from '../application/use-cases/companion/",
  "from '../application/use-cases/ritual/reflect/scaffold/scaffold-ritual-derived'",
  "from '../application/use-cases/ritual/reflect/scaffold/storage-ritual-sync'",
  "from '../application/use-cases/ritual/reflect/scaffold/persist-snapshot'",
  "from '../application/use-cases/ritual/reflect/scaffold/migrate-persisted-session'",
  "from './application/use-cases/ritual/reflect/telemetry/manual-open/",
  "from '../application/use-cases/ritual/reflect/telemetry/manual-open/",
  "from './application/use-cases/ritual/reflect/telemetry/home/",
  "from '../application/use-cases/ritual/reflect/telemetry/home/",
  "from './application/use-cases/ritual/reflect/telemetry/session/",
  "from '../application/use-cases/ritual/reflect/telemetry/session/",
];

/** Flat presentation/reflect paths — use subclusters (generation/, steps/, mood/, …). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_IMPORTS = [
  '@/features/pause/presentation/reflect/use-pause-reflect-generation',
  '@/features/pause/presentation/reflect/use-pause-artifact-haiku',
  '@/features/pause/presentation/reflect/use-pause-artifact-reflection-text',
  '@/features/pause/presentation/reflect/use-pause-reflection-step-log',
  '@/features/pause/presentation/reflect/use-pause-reflect-ui-telemetry',
  '@/features/pause/presentation/reflect/telemetry/session/',
  "from './presentation/reflect/telemetry/session/",
  "from '../presentation/reflect/telemetry/session/",
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
  '@/features/pause/presentation/home/manual-open/pause-home-reflect-io',
  '@/features/pause/presentation/home/manual-open/apply-manual-pause-open-result',
  '@/features/pause/presentation/home/manual-open/pause-home-reflect-telemetry-io',
  '@/features/pause/presentation/reflect/telemetry/home/',
  "from './presentation/reflect/use-pause-reflect-generation'",
  "from './presentation/home/manual-open/pause-home-reflect-io'",
  "from './presentation/home/manual-open/apply-manual-pause-open-result'",
  "from './presentation/home/manual-open/pause-home-reflect-telemetry-io'",
  "from './presentation/reflect/telemetry/home/",
  "from '../presentation/reflect/telemetry/home/",
  "from './presentation/reflect/use-pause-favorite-toggle'",
  "from '../presentation/reflect/use-pause-reflect-generation'",
];

/** Flat presentation/session breath paths — use presentation/session/breath/. */
const LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_IMPORTS = [
  '@/features/pause/presentation/session/use-pause-breath-segment-rpc-loggers',
  '@/features/pause/presentation/session/use-pause-session-breath-handlers',
  '@/features/pause/presentation/session/use-pause-session-breath-step-handlers',
  '@/features/pause/presentation/session/use-pause-session-breath-reflect-handlers',
  '@/features/pause/presentation/session/pause-session-breath-reflect-handler-types',
  "from './presentation/session/use-pause-breath-segment-rpc-loggers'",
  "from './presentation/session/use-pause-session-breath-handlers'",
  "from './presentation/session/use-pause-session-breath-step-handlers'",
  "from './presentation/session/use-pause-session-breath-reflect-handlers'",
  "from './presentation/session/pause-session-breath-reflect-handler-types'",
  "from '../presentation/session/use-pause-breath-segment-rpc-loggers'",
  "from '../presentation/session/use-pause-session-breath-handlers'",
  "from '../presentation/session/use-pause-session-breath-step-handlers'",
  "from '../presentation/session/use-pause-session-breath-reflect-handlers'",
  "from '../presentation/session/pause-session-breath-reflect-handler-types'",
  '@/features/pause/presentation/session/pause-breathing-handle',
  '@/features/pause/presentation/session/use-pause-breathing-timed-loop',
  '@/features/pause/presentation/session/use-pause-session-breath-navigation',
  '@/features/pause/presentation/session/use-pause-session-breath-ui',
  '@/features/pause/presentation/session/use-pause-session-breath-timed-active-reset',
  '@/features/pause/presentation/session/use-pause-session-breath-second-label-variant',
  "from './presentation/session/pause-breathing-handle'",
  "from './presentation/session/use-pause-breathing-timed-loop'",
  "from './presentation/session/use-pause-session-breath-navigation'",
  "from './presentation/session/use-pause-session-breath-ui'",
  "from './presentation/session/use-pause-session-breath-timed-active-reset'",
  "from './presentation/session/use-pause-session-breath-second-label-variant'",
  "from '../presentation/session/pause-breathing-handle'",
  "from '../presentation/session/use-pause-breathing-timed-loop'",
  "from '../presentation/session/use-pause-session-breath-navigation'",
  "from '../presentation/session/use-pause-session-breath-ui'",
  "from '../presentation/session/use-pause-session-breath-timed-active-reset'",
  "from '../presentation/session/use-pause-session-breath-second-label-variant'",
];

/** Session presentation — import terminal-entry guards via flow anchor only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_TERMINAL_ENTRY_IMPORTS = [
  '@/features/pause/application/use-cases/session/terminal-entry-guard',
  "from './application/use-cases/session/terminal-entry-guard'",
  "from '../application/use-cases/session/terminal-entry-guard'",
];

/** Session presentation — import step bundle builders via flow anchor only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_STEP_BUNDLES_IMPORTS = [
  '@/features/pause/application/use-cases/session/step-bundles',
  "from './application/use-cases/session/step-bundles'",
  "from '../application/use-cases/session/step-bundles'",
];

/** Reflect generation/manual-open — import Home PostHog via telemetry-io only. */
const LEGACY_PAUSE_PRESENTATION_REFLECT_MANUAL_OPEN_TELEMETRY_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-home-reflect-telemetry-flow',
  '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/pause-home-reflect-telemetry-flow',
  "from './application/use-cases/ritual/reflect/telemetry/pause-home-reflect-telemetry-flow'",
  "from '../application/use-cases/ritual/reflect/telemetry/pause-home-reflect-telemetry-flow'",
  "from './application/use-cases/ritual/reflect/generation/manual-open/pause-home-reflect-telemetry-flow'",
  "from '../application/use-cases/ritual/reflect/generation/manual-open/pause-home-reflect-telemetry-flow'",
];

/** Application reflect telemetry/ — flow anchors live in generation/manual-open/ and share/. */
const LEGACY_PAUSE_APPLICATION_REFLECT_TELEMETRY_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-home-reflect-telemetry-flow',
  '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-telemetry-flow',
  "from './application/use-cases/ritual/reflect/telemetry/pause-home-reflect-telemetry-flow'",
  "from '../application/use-cases/ritual/reflect/telemetry/pause-home-reflect-telemetry-flow'",
  "from './application/use-cases/ritual/reflect/telemetry/pause-reflect-telemetry-flow'",
  "from '../application/use-cases/ritual/reflect/telemetry/pause-reflect-telemetry-flow'",
];

/** Session presentation — import step-transition via shell I/O anchor only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_STEP_TRANSITION_IMPORTS = [
  '@/features/pause/application/use-cases/session/step-transition',
  "from './application/use-cases/session/step-transition'",
  "from '../application/use-cases/session/step-transition'",
];

/** Session presentation — import Holzen provider slice via providers I/O anchor only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_HOLZEN_PROVIDERS_IMPORTS = [
  '@/features/pause/application/use-cases/session/pause-holzen-providers-slice',
  "from './application/use-cases/session/pause-holzen-providers-slice'",
  "from '../application/use-cases/session/pause-holzen-providers-slice'",
];

/** Session presentation — import persisted tab session use cases via I/O anchor only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_PERSISTED_TAB_IMPORTS = [
  '@/features/pause/application/use-cases/session/persisted-tab-session',
  "from './application/use-cases/session/persisted-tab-session'",
  "from '../application/use-cases/session/persisted-tab-session'",
];

/** Session presentation — import mapPersistedStep via ritual-restore I/O anchor only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_MAP_PERSISTED_STEP_IMPORTS = [
  '@/features/pause/domain/session/map-persisted-step',
  "from './domain/session/map-persisted-step'",
  "from '../domain/session/map-persisted-step'",
];

/** Archive presentation I/O — import retrospective decide helpers via flow anchor only. */
const LEGACY_PAUSE_PRESENTATION_ARCHIVE_DECIDE_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/decide/log-retrospective-outcome',
  '@/features/pause/application/use-cases/ritual/decide/pause-outcome-retrospective-telemetry',
  "from './application/use-cases/ritual/decide/log-retrospective-outcome'",
  "from './application/use-cases/ritual/decide/pause-outcome-retrospective-telemetry'",
  "from '../application/use-cases/ritual/decide/log-retrospective-outcome'",
  "from '../application/use-cases/ritual/decide/pause-outcome-retrospective-telemetry'",
];

/** Deep ritual-audio in session breath I/O — use pause-ritual-audio-breathe-flow anchor. */
const LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_AUDIO_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/breathe/ritual-audio',
  "from './application/use-cases/ritual/breathe/ritual-audio'",
  "from '../application/use-cases/ritual/breathe/ritual-audio'",
];

/** Deep breath segment log in session breath I/O — use pause-session-breath-flow anchor. */
const LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_SEGMENT_LOG_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/breathe/run-breath-segment-log',
  "from './application/use-cases/ritual/breathe/run-breath-segment-log'",
  "from '../application/use-cases/ritual/breathe/run-breath-segment-log'",
];

/** Session breath presentation — import segment RPC dedupe flags via breath-flow anchor only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_RPC_FLAGS_IMPORTS = [
  '@/features/pause/domain/ritual/breathe/initial-breath-segment-rpc-flags',
  "from './domain/ritual/breathe/initial-breath-segment-rpc-flags'",
  "from '../domain/ritual/breathe/initial-breath-segment-rpc-flags'",
];

/** Deep session telemetry in presentation/session — use pending-offer flow anchor via telemetry-io. */
const LEGACY_PAUSE_PRESENTATION_SESSION_TELEMETRY_IMPORTS = [
  '@/features/pause/application/use-cases/session/pause-session-telemetry',
  "from './application/use-cases/session/pause-session-telemetry'",
  "from '../application/use-cases/session/pause-session-telemetry'",
];

/** Flat presentation/session scaffold paths — use presentation/session/scaffold/. */
const LEGACY_PAUSE_PRESENTATION_SESSION_SCAFFOLD_IMPORTS = [
  '@/features/pause/presentation/session/scaffold-ritual-payloads',
  "from './presentation/session/scaffold-ritual-payloads'",
  "from '../presentation/session/scaffold-ritual-payloads'",
  '@/features/pause/presentation/session/use-pause-session-scaffold-ritual',
  '@/features/pause/presentation/session/use-pause-session-scaffold-presentation',
  '@/features/pause/presentation/session/use-pause-session-scaffold-vm',
  '@/features/pause/presentation/session/use-pause-session-scaffold-chrome-slots',
  '@/features/pause/presentation/session/pause-session-scaffold-vm-types',
  "from './presentation/session/use-pause-session-scaffold-ritual'",
  "from './presentation/session/use-pause-session-scaffold-presentation'",
  "from './presentation/session/use-pause-session-scaffold-vm'",
  "from './presentation/session/use-pause-session-scaffold-chrome-slots'",
  "from './presentation/session/pause-session-scaffold-vm-types'",
  "from '../presentation/session/use-pause-session-scaffold-ritual'",
  "from '../presentation/session/use-pause-session-scaffold-presentation'",
  "from '../presentation/session/use-pause-session-scaffold-vm'",
  "from '../presentation/session/use-pause-session-scaffold-chrome-slots'",
  "from '../presentation/session/pause-session-scaffold-vm-types'",
];

/** Flat presentation/session ritual-storage-sync — use presentation/session/scaffold/. */
const LEGACY_PAUSE_PRESENTATION_SESSION_RITUAL_STORAGE_SYNC_IMPORTS = [
  '@/features/pause/presentation/session/use-pause-session-ritual-storage-sync',
  '@/features/pause/presentation/reflect/scaffold/use-pause-session-ritual-storage-sync',
  "from './presentation/session/use-pause-session-ritual-storage-sync'",
  "from '../presentation/session/use-pause-session-ritual-storage-sync'",
  "from './presentation/reflect/scaffold/use-pause-session-ritual-storage-sync'",
  "from '../presentation/reflect/scaffold/use-pause-session-ritual-storage-sync'",
];

/** Flat presentation/session persist-to-storage — use presentation/session/scaffold/. */
const LEGACY_PAUSE_PRESENTATION_SESSION_PERSIST_TO_STORAGE_IMPORTS = [
  '@/features/pause/presentation/session/use-pause-session-persist-to-storage',
  '@/features/pause/presentation/reflect/scaffold/use-pause-session-persist-to-storage',
  "from './presentation/session/use-pause-session-persist-to-storage'",
  "from '../presentation/session/use-pause-session-persist-to-storage'",
  "from './presentation/reflect/scaffold/use-pause-session-persist-to-storage'",
  "from '../presentation/reflect/scaffold/use-pause-session-persist-to-storage'",
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
  'src/features/pause/infrastructure/persisted-tab-session-storage-adapter.ts',
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
  for (const needle of LEGACY_PAUSE_APPLICATION_REFLECT_TELEMETRY_FLOW_IMPORTS) {
    if (text.includes(needle)) {
      failures.push(`${rel}: legacy application reflect telemetry flow import (${needle})`);
    }
  }
  for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_IMPORTS) {
    if (text.includes(needle)) {
      failures.push(`${rel}: legacy flat presentation/reflect import (${needle})`);
    }
  }
  if (
    rel.startsWith('src/features/pause/presentation/reflect/generation/manual-open/') &&
    !rel.endsWith('-io.ts') &&
    !rel.endsWith('.test.ts') &&
    !rel.endsWith('.test.tsx')
  ) {
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_MANUAL_OPEN_TELEMETRY_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: legacy reflect manual-open telemetry import (${needle})`);
      }
    }
  }
  if (rel.startsWith('src/features/pause/presentation/archive/')) {
    for (const needle of LEGACY_PAUSE_PRESENTATION_ARCHIVE_DECIDE_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: legacy archive decide import (${needle})`);
      }
    }
  }
  if (rel.startsWith('src/features/pause/presentation/session/breath/')) {
    for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_AUDIO_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: legacy session breath ritual-audio import (${needle})`);
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_SEGMENT_LOG_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: legacy session breath segment-log import (${needle})`);
      }
    }
    if (
      !rel.endsWith('pause-session-breath-io.ts') &&
      !rel.endsWith('pause-session-breath-io.test.ts')
    ) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_RPC_FLAGS_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy session breath rpc-flags import (${needle})`);
        }
      }
    }
  }
  if (
    rel.startsWith('src/features/pause/presentation/session/') &&
    !rel.endsWith('pause-session-pending-offer-telemetry-io.ts') &&
    !rel.endsWith('pause-session-pending-offer-telemetry-io.test.ts')
  ) {
    for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_TELEMETRY_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: legacy session telemetry import (${needle})`);
      }
    }
  }
  if (
    rel.startsWith('src/features/pause/presentation/session/') &&
    !rel.endsWith('-io.ts') &&
    !rel.endsWith('.test.ts') &&
    !rel.endsWith('.test.tsx')
  ) {
    for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_TERMINAL_ENTRY_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: legacy session terminal-entry import (${needle})`);
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_STEP_BUNDLES_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: legacy session step-bundles import (${needle})`);
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_STEP_TRANSITION_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: legacy session step-transition import (${needle})`);
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_HOLZEN_PROVIDERS_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: legacy session holzen-providers import (${needle})`);
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_PERSISTED_TAB_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: legacy session persisted-tab-session import (${needle})`);
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_MAP_PERSISTED_STEP_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: legacy session map-persisted-step import (${needle})`);
      }
    }
  }
  for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_IMPORTS) {
    if (text.includes(needle)) {
      failures.push(`${rel}: legacy flat presentation/session breath import (${needle})`);
    }
  }
  for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_SCAFFOLD_IMPORTS) {
    if (text.includes(needle)) {
      failures.push(`${rel}: legacy flat presentation/session scaffold import (${needle})`);
    }
  }
  for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_RITUAL_STORAGE_SYNC_IMPORTS) {
    if (text.includes(needle)) {
      failures.push(`${rel}: legacy flat presentation/session ritual-storage-sync import (${needle})`);
    }
  }
  for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_PERSIST_TO_STORAGE_IMPORTS) {
    if (text.includes(needle)) {
      failures.push(`${rel}: legacy flat presentation/session persist-to-storage import (${needle})`);
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
          `${rel}: direct persisted-session-storage import (${needle}) — use application/use-cases/session/persisted-tab-session or public-session`,
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
