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
mustExist('src/features/pause/application/use-cases/ritual/done', 'pause/application/use-cases/ritual/done/');
mustExist(
  'src/features/pause/application/use-cases/ritual/done/pause-post-pause-emotion-log-flow.ts',
  'pause/application/use-cases/ritual/done/pause-post-pause-emotion-log-flow.ts',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/done/pause-ritual-done-flow.ts',
  'pause/application/use-cases/ritual/done/pause-ritual-done-flow.ts',
);
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
  'src/features/pause/application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow.ts',
  'pause/application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow.ts',
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
  'src/features/pause/application/use-cases/ritual/reflect/pending-offer',
  'pause/application/use-cases/ritual/reflect/pending-offer/',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/reflect/telemetry/pause-pending-offer-telemetry-flow.ts',
  'pause/application/use-cases/ritual/reflect/telemetry/pause-pending-offer-telemetry-flow.ts',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-rpc-flow.ts',
  'pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-rpc-flow.ts',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-pending-offer-display-flow.ts',
  'pause/application/use-cases/ritual/reflect/pending-offer/pause-pending-offer-display-flow.ts',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-orchestration-flow.ts',
  'pause/application/use-cases/ritual/reflect/share/pause-reflect-share-orchestration-flow.ts',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/reflect/mood/pause-initial-emotion-log-flow.ts',
  'pause/application/use-cases/ritual/reflect/mood/pause-initial-emotion-log-flow.ts',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/reflect/mood/pause-feel-tiles-mood-flow.ts',
  'pause/application/use-cases/ritual/reflect/mood/pause-feel-tiles-mood-flow.ts',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/reflect/mood/pause-depth-picker-mood-flow.ts',
  'pause/application/use-cases/ritual/reflect/mood/pause-depth-picker-mood-flow.ts',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/reflect/mood/pause-initial-emotion-presentation-flow.ts',
  'pause/application/use-cases/ritual/reflect/mood/pause-initial-emotion-presentation-flow.ts',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/reflect/mood/pause-session-mood-chrome-flow.ts',
  'pause/application/use-cases/ritual/reflect/mood/pause-session-mood-chrome-flow.ts',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/reflect/hub/pause-shift-frame-hub-presentation-flow.ts',
  'pause/application/use-cases/ritual/reflect/hub/pause-shift-frame-hub-presentation-flow.ts',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/reflect/hub/pause-shift-emotion-log-flow.ts',
  'pause/application/use-cases/ritual/reflect/hub/pause-shift-emotion-log-flow.ts',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/reflect/hub/pause-shift-emotion-frame-hub-done-flow.ts',
  'pause/application/use-cases/ritual/reflect/hub/pause-shift-emotion-frame-hub-done-flow.ts',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-and-decide-view-flow.ts',
  'pause/application/use-cases/ritual/reflect/flows/pause-reflect-and-decide-view-flow.ts',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-view-flow.ts',
  'pause/application/use-cases/ritual/decide/pause-decide-outcome-view-flow.ts',
);
mustNotExist(
  'src/features/pause/application/use-cases/ritual/reflect/flows/pause-decide-outcome-view-flow.ts',
  'pause/application/use-cases/ritual/reflect/flows/pause-decide-outcome-view-flow.ts (use ritual/decide/pause-decide-outcome-view-flow.ts)',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/decide/impact-data.ts',
  'pause/application/use-cases/ritual/decide/impact-data.ts',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/decide/pause-decide-score-impacts-flow.ts',
  'pause/application/use-cases/ritual/decide/pause-decide-score-impacts-flow.ts',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/decide/pause-archive-decide-rpc-flow.ts',
  'pause/application/use-cases/ritual/decide/pause-archive-decide-rpc-flow.ts',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/decide/pause-archive-decide-telemetry-flow.ts',
  'pause/application/use-cases/ritual/decide/pause-archive-decide-telemetry-flow.ts',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-log-flow.ts',
  'pause/application/use-cases/ritual/decide/pause-decide-outcome-log-flow.ts',
);
mustNotExist(
  'src/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-decide-outcome-log-flow.ts',
  'pause/application/use-cases/ritual/reflect/flows/pause-reflect-decide-outcome-log-flow.ts (use ritual/decide/pause-decide-outcome-log-flow.ts)',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-toast-flow.ts',
  'pause/application/use-cases/ritual/decide/pause-decide-outcome-toast-flow.ts',
);
mustNotExist(
  'src/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-decide-outcome-toast-flow.ts',
  'pause/application/use-cases/ritual/reflect/flows/pause-reflect-decide-outcome-toast-flow.ts (use ritual/decide/pause-decide-outcome-toast-flow.ts)',
);
mustExist(
  'src/features/pause/application/use-cases/ritual/decide/pause-decide-wisdom-quotes-flow.ts',
  'pause/application/use-cases/ritual/decide/pause-decide-wisdom-quotes-flow.ts',
);
mustNotExist(
  'src/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-decide-wisdom-quotes-flow.ts',
  'pause/application/use-cases/ritual/reflect/flows/pause-reflect-decide-wisdom-quotes-flow.ts (use ritual/decide/pause-decide-wisdom-quotes-flow.ts)',
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
  'src/features/pause/application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow.ts',
  'pause/application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow.ts',
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
  'src/features/pause/presentation/reflect/pending-offer',
  'pause/presentation/reflect/pending-offer/',
);
mustExist(
  'src/features/pause/presentation/reflect/telemetry',
  'pause/presentation/reflect/telemetry/',
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
mustExist(
  'src/features/pause/infrastructure/queries/reflect/pending-offer',
  'pause/infrastructure/queries/reflect/pending-offer/',
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
  '@/features/pause/application/use-cases/session/pending-pause-offer-telemetry',
  "from './application/use-cases/session/pending-pause-offer-telemetry",
  "from '../application/use-cases/session/pending-pause-offer-telemetry",
  '@/features/pause/application/use-cases/session/pause-session-telemetry',
  "from './application/use-cases/session/pause-session-telemetry'",
  "from '../application/use-cases/session/pause-session-telemetry'",
];

/** Flat presentation/reflect paths — use subclusters (generation/, steps/, mood/, …). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_IMPORTS = [
  '@/features/pause/presentation/reflect/use-pause-reflect-generation',
  '@/features/pause/presentation/reflect/use-pause-artifact-haiku',
  '@/features/pause/presentation/reflect/use-pause-artifact-reflection-text',
  '@/features/pause/presentation/reflect/use-pause-reflection-step-log',
  '@/features/pause/presentation/reflect/use-pause-reflect-ui-telemetry',
  '@/features/pause/presentation/reflect/share/pause-reflect-telemetry-io',
  '@/features/pause/presentation/reflect/share/use-pause-reflect-ui-telemetry',
  '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-telemetry-io',
  "from './presentation/reflect/pending-offer/pause-reflect-pending-offer-telemetry-io'",
  "from '../presentation/reflect/pending-offer/pause-reflect-pending-offer-telemetry-io'",
  '@/features/pause/presentation/reflect/telemetry/session/',
  "from './presentation/reflect/telemetry/session/",
  "from '../presentation/reflect/telemetry/session/",
  "from './presentation/reflect/share/pause-reflect-telemetry-io'",
  "from '../presentation/reflect/share/pause-reflect-telemetry-io'",
  "from './presentation/reflect/share/use-pause-reflect-ui-telemetry'",
  "from '../presentation/reflect/share/use-pause-reflect-ui-telemetry'",
  '@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-telemetry-io',
  "from './presentation/reflect/generation/manual-open/pause-home-reflect-telemetry-io'",
  "from '../presentation/reflect/generation/manual-open/pause-home-reflect-telemetry-io'",
  "from './generation/manual-open/pause-home-reflect-telemetry-io'",
  "from '../generation/manual-open/pause-home-reflect-telemetry-io'",
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
  '@/features/pause/presentation/reflect/telemetry/home/',
  "from './presentation/reflect/use-pause-reflect-generation'",
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

/** Session presentation (non-I/O) — import terminal-entry guards via terminal-entry-io only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_TERMINAL_ENTRY_IMPORTS = [
  '@/features/pause/application/use-cases/session/terminal-entry-guard',
  '@/features/pause/application/use-cases/session/pause-session-terminal-entry-flow',
  "from './application/use-cases/session/terminal-entry-guard'",
  "from '../application/use-cases/session/terminal-entry-guard'",
  "from './application/use-cases/session/pause-session-terminal-entry-flow'",
  "from '../application/use-cases/session/pause-session-terminal-entry-flow'",
];

/** Session terminal-entry I/O — import terminal-entry-guard directly (not terminal-entry-flow). */
const LEGACY_PAUSE_PRESENTATION_SESSION_TERMINAL_ENTRY_IO_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/session/pause-session-terminal-entry-flow',
  "from './application/use-cases/session/pause-session-terminal-entry-flow'",
  "from '../application/use-cases/session/pause-session-terminal-entry-flow'",
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

/** Manual-open telemetry I/O — import via pause-home-reflect-telemetry-flow only (not generation umbrella). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_MANUAL_OPEN_TELEMETRY_IO_GENERATION_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow',
  "from './application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow'",
  "from '../application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow'",
];

/** Manual-open telemetry I/O — import leaf trackers only (not pause-home-reflect-telemetry-flow). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_MANUAL_OPEN_TELEMETRY_IO_HOME_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/pause-home-reflect-telemetry-flow',
  '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-home-reflect-telemetry-flow',
  "from './application/use-cases/ritual/reflect/generation/manual-open/pause-home-reflect-telemetry-flow'",
  "from '../application/use-cases/ritual/reflect/generation/manual-open/pause-home-reflect-telemetry-flow'",
  "from './manual-open/pause-home-reflect-telemetry-flow'",
  "from '../manual-open/pause-home-reflect-telemetry-flow'",
];

/** Manual-open reflect I/O — import sibling modules directly (not manual-open-flow or generation umbrella). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_MANUAL_OPEN_IO_GENERATION_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow',
  "from './application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow'",
  "from '../application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow'",
];

const LEGACY_PAUSE_PRESENTATION_REFLECT_MANUAL_OPEN_IO_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/generation/pause-reflect-generation-manual-open-flow',
  "from './application/use-cases/ritual/reflect/generation/pause-reflect-generation-manual-open-flow'",
  "from '../application/use-cases/ritual/reflect/generation/pause-reflect-generation-manual-open-flow'",
];

/** Holzen-reflect generation I/O — import via pause-reflect-generation-hook-flow only (not generation umbrella). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_GENERATION_IO_GENERATION_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow',
  "from './application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow'",
  "from '../application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow'",
];

/** Holzen-reflect generation I/O — domain hook helpers + run-reflect-generation directly (not hook-flow anchor). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_GENERATION_IO_HOOK_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/generation/pause-reflect-generation-hook-flow',
  '@/features/pause/application/use-cases/ritual/reflect/generation/holzen-reflect/pause-reflect-generation-hook-flow',
  "from './application/use-cases/ritual/reflect/generation/pause-reflect-generation-hook-flow'",
  "from '../application/use-cases/ritual/reflect/generation/pause-reflect-generation-hook-flow'",
  "from './application/use-cases/ritual/reflect/generation/holzen-reflect/pause-reflect-generation-hook-flow'",
  "from '../application/use-cases/ritual/reflect/generation/holzen-reflect/pause-reflect-generation-hook-flow'",
];

/** Holzen-reflect generation I/O — import hook helpers via domain leaf modules (not hook-flow bundle). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_GENERATION_IO_HOOK_FLOW_BUNDLE_IMPORTS = [
  '@/features/pause/domain/reflect/generation/reflect-generation-hook-flow',
  "from './domain/reflect/generation/reflect-generation-hook-flow'",
  "from '../domain/reflect/generation/reflect-generation-hook-flow'",
];

/** Application reflect telemetry/ — Home manual-open flow stays in generation/manual-open/ (not telemetry/). */
const LEGACY_PAUSE_APPLICATION_REFLECT_TELEMETRY_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-home-reflect-telemetry-flow',
  "from './application/use-cases/ritual/reflect/telemetry/pause-home-reflect-telemetry-flow'",
  "from '../application/use-cases/ritual/reflect/telemetry/pause-home-reflect-telemetry-flow'",
];

/** Session reflect UI telemetry — colocated under ritual/reflect/telemetry/ (not share/). */
const LEGACY_PAUSE_APPLICATION_REFLECT_SHARE_SESSION_TELEMETRY_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-telemetry-flow',
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-session-ui-telemetry',
  "from './application/use-cases/ritual/reflect/share/pause-reflect-telemetry-flow'",
  "from '../application/use-cases/ritual/reflect/share/pause-reflect-telemetry-flow'",
  "from './application/use-cases/ritual/reflect/share/pause-reflect-session-ui-telemetry'",
  "from '../application/use-cases/ritual/reflect/share/pause-reflect-session-ui-telemetry'",
  "from '../share/pause-reflect-telemetry-flow'",
  "from '../share/pause-reflect-session-ui-telemetry'",
  "from './share/pause-reflect-telemetry-flow'",
  "from './share/pause-reflect-session-ui-telemetry'",
];

/** Session presentation (non-I/O) — import step motion via pause-session-step-transition-io only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_STEP_TRANSITION_IMPORTS = [
  '@/features/pause/application/use-cases/session/step-transition',
  '@/features/pause/application/use-cases/session/step-swipe-direction',
  '@/features/pause/application/use-cases/session/pause-session-step-transition-flow',
  "from './application/use-cases/session/step-transition'",
  "from '../application/use-cases/session/step-transition'",
  "from './application/use-cases/session/step-swipe-direction'",
  "from '../application/use-cases/session/step-swipe-direction'",
  "from './application/use-cases/session/pause-session-step-transition-flow'",
  "from '../application/use-cases/session/pause-session-step-transition-flow'",
];

/** Session step-transition I/O — import leaf modules only (not step-transition-flow umbrella). */
const LEGACY_PAUSE_PRESENTATION_SESSION_STEP_TRANSITION_IO_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/session/pause-session-step-transition-flow',
  "from './application/use-cases/session/pause-session-step-transition-flow'",
  "from '../application/use-cases/session/pause-session-step-transition-flow'",
];

/** Session presentation — step motion must not import via shell I/O (use step-transition-io). */
const LEGACY_PAUSE_PRESENTATION_SESSION_STEP_TRANSITION_SHELL_IO_IMPORTS = [
  'buildPauseSessionStepTransitionConfig',
  'pauseStepSwipeDirection',
  'type PauseSessionStepTransitionConfig',
  'type PauseSessionSwipeDirection',
  'PAUSE_SESSION_STEP_SLIDE_OFFSET_PX',
  'PAUSE_SESSION_STEP_TRANSITION_DURATION_S',
  'PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S',
  'PAUSE_SESSION_STEP_TRANSITION_EASE',
];

/** Session presentation — import Holzen provider slice via providers I/O anchor only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_HOLZEN_PROVIDERS_IMPORTS = [
  '@/features/pause/application/use-cases/session/pause-holzen-providers-slice',
  "from './application/use-cases/session/pause-holzen-providers-slice'",
  "from '../application/use-cases/session/pause-holzen-providers-slice'",
];

/** Session presentation (non-I/O) — import persisted tab session via pause-persisted-tab-session-io only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_PERSISTED_TAB_IMPORTS = [
  '@/features/pause/application/use-cases/session/persisted-tab-session',
  '@/features/pause/application/use-cases/session/pause-session-persisted-tab-session-flow',
  "from './application/use-cases/session/persisted-tab-session'",
  "from '../application/use-cases/session/persisted-tab-session'",
  "from './application/use-cases/session/pause-session-persisted-tab-session-flow'",
  "from '../application/use-cases/session/pause-session-persisted-tab-session-flow'",
];

/** Session presentation (non-I/O) — import persisted tab session via pause-persisted-tab-session-io only (not flow anchor). */
const LEGACY_PAUSE_PRESENTATION_SESSION_PERSISTED_TAB_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/session/pause-session-persisted-tab-session-flow',
  "from './application/use-cases/session/pause-session-persisted-tab-session-flow'",
  "from '../application/use-cases/session/pause-session-persisted-tab-session-flow'",
];

/** Persisted tab session I/O — import persisted-tab-session directly (not flow umbrella). */
const LEGACY_PAUSE_PRESENTATION_SESSION_PERSISTED_TAB_IO_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/session/pause-session-persisted-tab-session-flow',
  "from './application/use-cases/session/pause-session-persisted-tab-session-flow'",
  "from '../application/use-cases/session/pause-session-persisted-tab-session-flow'",
];

/** Session presentation — import decide impact types via pause-session-decide-io only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_DECIDE_IMPACT_IMPORTS = [
  '@/features/pause/domain/decide/pause-impact-data',
  '@/features/pause/application/use-cases/ritual/reflect/flows/pause-decide-outcome-view-flow',
  '@/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-view-flow',
  '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io',
  "from './domain/decide/pause-impact-data",
  "from '../domain/decide/pause-impact-data",
  "from './application/use-cases/ritual/reflect/flows/pause-decide-outcome-view-flow'",
  "from '../application/use-cases/ritual/reflect/flows/pause-decide-outcome-view-flow'",
  "from './application/use-cases/ritual/decide/pause-decide-outcome-view-flow'",
  "from '../application/use-cases/ritual/decide/pause-decide-outcome-view-flow'",
  "from './presentation/reflect/flows/pause-reflect-flows-io'",
  "from '../presentation/reflect/flows/pause-reflect-flows-io'",
];

/** Session application — import PauseImpactData from domain only (not session decide-flow). */
const LEGACY_PAUSE_SESSION_APPLICATION_DECIDE_FLOW_IMPACT_IMPORTS = [
  '@/features/pause/application/use-cases/session/pause-session-decide-flow',
  '@/features/pause/application/use-cases/ritual/reflect/flows/pause-decide-outcome-view-flow',
  '@/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-view-flow',
  '@/features/pause/application/use-cases/ritual/decide/impact-data',
  "from '@/features/pause/application/use-cases/session/pause-session-decide-flow'",
  "from '../application/use-cases/session/pause-session-decide-flow'",
  "from './application/use-cases/session/pause-session-decide-flow'",
  "from './application/use-cases/ritual/reflect/flows/pause-decide-outcome-view-flow'",
  "from '../application/use-cases/ritual/reflect/flows/pause-decide-outcome-view-flow'",
  "from './application/use-cases/ritual/decide/pause-decide-outcome-view-flow'",
  "from '../application/use-cases/ritual/decide/pause-decide-outcome-view-flow'",
  "from './application/use-cases/ritual/decide/impact-data'",
  "from '../application/use-cases/ritual/decide/impact-data'",
];

/** public-hooks — export PauseImpactData from domain only (not session decide-flow). */
const LEGACY_PAUSE_PUBLIC_HOOKS_IMPACT_TYPE_IMPORTS = [
  '@/features/pause/application/use-cases/session/pause-session-decide-flow',
  '@/features/pause/application/use-cases/ritual/reflect/flows/pause-decide-outcome-view-flow',
  '@/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-view-flow',
  "from './application/use-cases/session/pause-session-decide-flow'",
  "from '../application/use-cases/session/pause-session-decide-flow'",
];

/** Session decide I/O — import PauseImpactData from domain only (not session decide-flow). */
const LEGACY_PAUSE_SESSION_DECIDE_IO_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/session/pause-session-decide-flow',
  '@/features/pause/application/use-cases/ritual/reflect/flows/pause-decide-outcome-view-flow',
  '@/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-view-flow',
  '@/features/pause/application/use-cases/ritual/decide/impact-data',
  "from './application/use-cases/session/pause-session-decide-flow'",
  "from '../application/use-cases/session/pause-session-decide-flow'",
  "from './application/use-cases/ritual/reflect/flows/pause-decide-outcome-view-flow'",
  "from '../application/use-cases/ritual/reflect/flows/pause-decide-outcome-view-flow'",
  "from './application/use-cases/ritual/decide/pause-decide-outcome-view-flow'",
  "from '../application/use-cases/ritual/decide/pause-decide-outcome-view-flow'",
  "from './application/use-cases/ritual/decide/impact-data'",
  "from '../application/use-cases/ritual/decide/impact-data'",
];

/** Session presentation — import mapPersistedStep via ritual-restore I/O anchor only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_MAP_PERSISTED_STEP_IMPORTS = [
  '@/features/pause/domain/session/map-persisted-step',
  "from './domain/session/map-persisted-step'",
  "from '../domain/session/map-persisted-step'",
];

/** Session shell I/O — import via session subcluster modules only (not pause-session-shell-flow umbrella). */
const LEGACY_PAUSE_PRESENTATION_SESSION_SHELL_IO_UMBRELLA_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/session/pause-session-shell-flow',
  "from './application/use-cases/session/pause-session-shell-flow'",
  "from '../application/use-cases/session/pause-session-shell-flow'",
];

/** Session scaffold I/O — import via session subcluster modules only (not pause-session-scaffold-flow umbrella). */
const LEGACY_PAUSE_PRESENTATION_SESSION_SCAFFOLD_IO_UMBRELLA_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/session/pause-session-scaffold-flow',
  "from './application/use-cases/session/pause-session-scaffold-flow'",
  "from '../application/use-cases/session/pause-session-scaffold-flow'",
];

/** Session presentation — import shell chrome use cases via pause-session-shell-io only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_SHELL_USE_CASE_IMPORTS = [
  '@/features/pause/application/use-cases/session/hydration',
  '@/features/pause/application/use-cases/session/header-back',
  '@/features/pause/application/use-cases/session/mount-log-params',
  '@/features/pause/application/use-cases/session/shell-view-model',
  "from './application/use-cases/session/hydration'",
  "from '../application/use-cases/session/hydration'",
  "from './application/use-cases/session/header-back'",
  "from '../application/use-cases/session/header-back'",
  "from './application/use-cases/session/mount-log-params'",
  "from '../application/use-cases/session/mount-log-params'",
  "from './application/use-cases/session/shell-view-model'",
  "from '../application/use-cases/session/shell-view-model'",
];

/** Session brief I/O — import via session + ritual/brief modules only (not pause-session-brief-flow umbrella). */
const LEGACY_PAUSE_PRESENTATION_SESSION_BRIEF_IO_UMBRELLA_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/session/pause-session-brief-flow',
  "from './application/use-cases/session/pause-session-brief-flow'",
  "from '../application/use-cases/session/pause-session-brief-flow'",
];

/** Session frame I/O — import restored frame hydration only (not pause-session-frame-flow umbrella). */
const LEGACY_PAUSE_PRESENTATION_SESSION_FRAME_IO_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/session/pause-session-frame-flow',
  "from './application/use-cases/session/pause-session-frame-flow'",
  "from '../application/use-cases/session/pause-session-frame-flow'",
];

/** Session ritual-restore I/O — import via session + ritual subcluster modules only (not pause-session-ritual-restore-flow umbrella). */
const LEGACY_PAUSE_PRESENTATION_SESSION_RITUAL_RESTORE_IO_UMBRELLA_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/session/pause-session-ritual-restore-flow',
  "from './application/use-cases/session/pause-session-ritual-restore-flow'",
  "from '../application/use-cases/session/pause-session-ritual-restore-flow'",
];

/** Session presentation — import restored ritual hydration via pause-session-ritual-restore-io only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_RITUAL_RESTORE_USE_CASE_IMPORTS = [
  '@/features/pause/domain/session/map-persisted-step',
  '@/features/pause/application/use-cases/ritual/breathe/restored-breath-ritual-state',
  '@/features/pause/application/use-cases/ritual/decide/restored-decide-ritual-state',
  '@/features/pause/application/use-cases/ritual/frame/restored-frame-ritual-state',
  '@/features/pause/application/use-cases/session/restored-brief-ritual-state',
  '@/features/pause/application/use-cases/session/initial-ritual-entry',
  "from './domain/session/map-persisted-step'",
  "from '../domain/session/map-persisted-step'",
  "from './application/use-cases/ritual/breathe/restored-breath-ritual-state'",
  "from '../application/use-cases/ritual/breathe/restored-breath-ritual-state'",
  "from './application/use-cases/ritual/decide/restored-decide-ritual-state'",
  "from '../application/use-cases/ritual/decide/restored-decide-ritual-state'",
  "from './application/use-cases/ritual/frame/restored-frame-ritual-state'",
  "from '../application/use-cases/ritual/frame/restored-frame-ritual-state'",
  "from './application/use-cases/session/restored-brief-ritual-state'",
  "from '../application/use-cases/session/restored-brief-ritual-state'",
  "from './application/use-cases/session/initial-ritual-entry'",
  "from '../application/use-cases/session/initial-ritual-entry'",
];

/** Session presentation — import brief hydration + depth-upgrade via pause-session-brief-io only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_BRIEF_USE_CASE_IMPORTS = [
  '@/features/pause/application/use-cases/session/restored-brief-ritual-state',
  '@/features/pause/application/use-cases/session/initial-ritual-entry',
  '@/features/pause/application/use-cases/ritual/brief/ritual-depth-upgrade',
  "from './application/use-cases/session/restored-brief-ritual-state'",
  "from '../application/use-cases/session/restored-brief-ritual-state'",
  "from './application/use-cases/session/initial-ritual-entry'",
  "from '../application/use-cases/session/initial-ritual-entry'",
  "from './application/use-cases/ritual/brief/ritual-depth-upgrade'",
  "from '../application/use-cases/ritual/brief/ritual-depth-upgrade'",
];

/** Session presentation — import scaffold persist/sync/derived via pause-session-scaffold-io only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_SCAFFOLD_USE_CASE_IMPORTS = [
  '@/features/pause/application/use-cases/session/persist-snapshot',
  '@/features/pause/application/use-cases/session/storage-ritual-sync',
  '@/features/pause/application/use-cases/session/scaffold/scaffold-ritual-derived',
  "from './application/use-cases/session/persist-snapshot'",
  "from '../application/use-cases/session/persist-snapshot'",
  "from './application/use-cases/session/storage-ritual-sync'",
  "from '../application/use-cases/session/storage-ritual-sync'",
  "from './application/use-cases/session/scaffold/scaffold-ritual-derived'",
  "from '../application/use-cases/session/scaffold/scaffold-ritual-derived'",
];

/** Session presentation — import persisted-session guards via shell/scaffold I/O only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_DOMAIN_GUARDS_IMPORTS = [
  '@/features/pause/domain/session/persisted-session-guards',
  '@/features/pause/domain/session/waiting-for-instance-fetch',
  "from './domain/session/persisted-session-guards'",
  "from '../domain/session/persisted-session-guards'",
  "from './domain/session/waiting-for-instance-fetch'",
  "from '../domain/session/waiting-for-instance-fetch'",
];

/** Archive presentation (non-I/O) — import retrospective decide helpers via pause-archive-io only. */
const LEGACY_PAUSE_PRESENTATION_ARCHIVE_DECIDE_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/decide/log-retrospective-outcome',
  '@/features/pause/application/use-cases/ritual/decide/pause-outcome-retrospective-telemetry',
  '@/features/pause/application/use-cases/ritual/decide/pause-archive-decide-rpc-flow',
  '@/features/pause/application/use-cases/ritual/decide/pause-archive-decide-telemetry-flow',
  '@/features/pause/application/use-cases/ritual/decide/pause-archive-decide-flow',
  "from './application/use-cases/ritual/decide/log-retrospective-outcome'",
  "from './application/use-cases/ritual/decide/pause-outcome-retrospective-telemetry'",
  "from './application/use-cases/ritual/decide/pause-archive-decide-rpc-flow'",
  "from './application/use-cases/ritual/decide/pause-archive-decide-telemetry-flow'",
  "from './application/use-cases/ritual/decide/pause-archive-decide-flow'",
  "from '../application/use-cases/ritual/decide/log-retrospective-outcome'",
  "from '../application/use-cases/ritual/decide/pause-outcome-retrospective-telemetry'",
  "from '../application/use-cases/ritual/decide/pause-archive-decide-rpc-flow'",
  "from '../application/use-cases/ritual/decide/pause-archive-decide-telemetry-flow'",
  "from '../application/use-cases/ritual/decide/pause-archive-decide-flow'",
];

const LEGACY_PAUSE_PRESENTATION_ARCHIVE_IO_UMBRELLA_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/decide/pause-archive-decide-flow',
  "from './application/use-cases/ritual/decide/pause-archive-decide-flow'",
  "from '../application/use-cases/ritual/decide/pause-archive-decide-flow'",
];

/** Archive decide I/O — import ritual/decide leaf modules directly (not archive decide subcluster flow anchors). */
const LEGACY_PAUSE_PRESENTATION_ARCHIVE_IO_SUBCLUSTER_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/decide/pause-archive-decide-rpc-flow',
  '@/features/pause/application/use-cases/ritual/decide/pause-archive-decide-telemetry-flow',
  "from './application/use-cases/ritual/decide/pause-archive-decide-rpc-flow'",
  "from '../application/use-cases/ritual/decide/pause-archive-decide-rpc-flow'",
  "from './application/use-cases/ritual/decide/pause-archive-decide-telemetry-flow'",
  "from '../application/use-cases/ritual/decide/pause-archive-decide-telemetry-flow'",
];

/** Archive decide umbrella flow — compose RPC + telemetry subclusters only. */
const LEGACY_PAUSE_ARCHIVE_DECIDE_FLOW_LEAF_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/decide/log-retrospective-outcome',
  '@/features/pause/application/use-cases/ritual/decide/pause-outcome-retrospective-telemetry',
  "from './log-retrospective-outcome'",
  "from './pause-outcome-retrospective-telemetry'",
  "from '../log-retrospective-outcome'",
  "from '../pause-outcome-retrospective-telemetry'",
];

/** Session breath I/O — import ritual-audio leaf only (not pause-ritual-audio-breathe-flow). */
const LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_IO_AUDIO_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/breathe/pause-ritual-audio-breathe-flow',
  "from './application/use-cases/ritual/breathe/pause-ritual-audio-breathe-flow'",
  "from '../application/use-cases/ritual/breathe/pause-ritual-audio-breathe-flow'",
];

/** Session breath I/O — import segment log leaf only (not pause-run-breath-segment-log-flow). */
const LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_IO_SEGMENT_LOG_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/breathe/pause-run-breath-segment-log-flow',
  "from './application/use-cases/ritual/breathe/pause-run-breath-segment-log-flow'",
  "from '../application/use-cases/ritual/breathe/pause-run-breath-segment-log-flow'",
];

/** Deep ritual-audio in session breath presentation — use pause-session-breath-io only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_AUDIO_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/breathe/ritual-audio',
  "from './application/use-cases/ritual/breathe/ritual-audio'",
  "from '../application/use-cases/ritual/breathe/ritual-audio'",
];

/** Deep breath segment log in non-allowlisted session breath presentation — use breath-io leaf import. */
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

/** Session breath presentation — import step navigation via step-navigation-io only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_STEP_NAV_IMPORTS = [
  '@/features/pause/domain/ritual/breathe/pause-breath-step-navigation',
  "from './domain/ritual/breathe/pause-breath-step-navigation'",
  "from '../domain/ritual/breathe/pause-breath-step-navigation'",
];

/** Session breath step-navigation I/O — import domain leaf directly (not pause-session-breath-flow). */
const LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_STEP_NAV_IO_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/breathe/pause-session-breath-flow',
  "from './application/use-cases/ritual/breathe/pause-session-breath-flow'",
  "from '../application/use-cases/ritual/breathe/pause-session-breath-flow'",
];

/** Session breath presentation — import hydration + phase advance via breath-io anchor only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_HYDRATION_IMPORTS = [
  '@/features/pause/domain/ritual/breathe/restored-breath-ritual-state',
  '@/features/pause/domain/ritual/breathe/phase-advance',
  '@/features/pause/application/use-cases/ritual/breathe/restored-breath-ritual-state',
  '@/features/pause/application/use-cases/ritual/breathe/phase-advance',
  "from './domain/ritual/breathe/restored-breath-ritual-state'",
  "from '../domain/ritual/breathe/restored-breath-ritual-state'",
  "from './domain/ritual/breathe/phase-advance'",
  "from '../domain/ritual/breathe/phase-advance'",
  "from './application/use-cases/ritual/breathe/restored-breath-ritual-state'",
  "from '../application/use-cases/ritual/breathe/restored-breath-ritual-state'",
  "from './application/use-cases/ritual/breathe/phase-advance'",
  "from '../application/use-cases/ritual/breathe/phase-advance'",
];

/** Session breath presentation — import breathe domain helpers via breath I/O only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_DOMAIN_AUX_IMPORTS = [
  '@/features/pause/domain/ritual/breathe/apply-breath-segment-log-outcome',
  '@/features/pause/domain/ritual/breathe/pause-breathing-phase',
  '@/features/pause/domain/ritual/breathe/breath-second-label-variant',
  "from './domain/ritual/breathe/apply-breath-segment-log-outcome'",
  "from '../domain/ritual/breathe/apply-breath-segment-log-outcome'",
  "from './domain/ritual/breathe/pause-breathing-phase'",
  "from '../domain/ritual/breathe/pause-breathing-phase'",
  "from './domain/ritual/breathe/breath-second-label-variant'",
  "from '../domain/ritual/breathe/breath-second-label-variant'",
];

/** Session breath presentation — import breath-flow cluster via *-io modules only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/breathe/pause-session-breath-flow',
  "from './application/use-cases/ritual/breathe/pause-session-breath-flow'",
  "from '../application/use-cases/ritual/breathe/pause-session-breath-flow'",
];

/** Session breath I/O — import segment RPC + hydration via sibling modules (not pause-session-breath-flow). */
const LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_IO_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/breathe/pause-session-breath-flow',
  "from './application/use-cases/ritual/breathe/pause-session-breath-flow'",
  "from '../application/use-cases/ritual/breathe/pause-session-breath-flow'",
];

/** Session ritual restore flow — import restored breath hydration via restored-breath-ritual-state only (not breath-flow). */
const LEGACY_PAUSE_SESSION_RITUAL_RESTORE_BREATH_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/breathe/pause-session-breath-flow',
  "from './application/use-cases/ritual/breathe/pause-session-breath-flow'",
  "from '../application/use-cases/ritual/breathe/pause-session-breath-flow'",
];

/** Session ritual restore flow — import restored brief hydration via restored-brief-ritual-state only (not brief-flow). */
const LEGACY_PAUSE_SESSION_RITUAL_RESTORE_BRIEF_IMPORTS = [
  '@/features/pause/application/use-cases/session/pause-session-brief-flow',
  "from './application/use-cases/session/pause-session-brief-flow'",
  "from '../application/use-cases/session/pause-session-brief-flow'",
];

/** Reflect mood umbrella flow — compose domain + leaf use case only (not mood subcluster flow anchors). */
const LEGACY_PAUSE_REFLECT_MOOD_FLOW_SUBCLUSTER_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/mood/pause-depth-picker-mood-flow',
  '@/features/pause/application/use-cases/ritual/reflect/mood/pause-feel-tiles-mood-flow',
  '@/features/pause/application/use-cases/ritual/reflect/mood/pause-initial-emotion-presentation-flow',
  '@/features/pause/application/use-cases/ritual/reflect/mood/pause-initial-emotion-log-flow',
  '@/features/pause/application/use-cases/ritual/reflect/mood/pause-session-mood-chrome-flow',
  "from './pause-depth-picker-mood-flow'",
  "from '../pause-depth-picker-mood-flow'",
  "from './pause-feel-tiles-mood-flow'",
  "from '../pause-feel-tiles-mood-flow'",
  "from './pause-initial-emotion-presentation-flow'",
  "from '../pause-initial-emotion-presentation-flow'",
  "from './pause-initial-emotion-log-flow'",
  "from '../pause-initial-emotion-log-flow'",
  "from './pause-session-mood-chrome-flow'",
  "from '../pause-session-mood-chrome-flow'",
];

/** Reflect hub umbrella flow — compose subcluster anchors only (no deep domain/reflect/hub). */
const LEGACY_PAUSE_REFLECT_HUB_FLOW_DOMAIN_IMPORTS = [
  '@/features/pause/domain/reflect/hub/',
  "from '@/features/pause/domain/reflect/hub/",
  "from './domain/reflect/hub/",
  "from '../domain/reflect/hub/",
];

/** Reflect hub umbrella flow — compose domain + leaf use case only (not hub subcluster flow anchors). */
const LEGACY_PAUSE_REFLECT_HUB_FLOW_SUBCLUSTER_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/hub/pause-shift-frame-hub-presentation-flow',
  '@/features/pause/application/use-cases/ritual/reflect/hub/pause-shift-emotion-log-flow',
  '@/features/pause/application/use-cases/ritual/reflect/hub/pause-shift-emotion-frame-hub-done-flow',
  "from './pause-shift-frame-hub-presentation-flow'",
  "from '../pause-shift-frame-hub-presentation-flow'",
  "from './pause-shift-emotion-log-flow'",
  "from '../pause-shift-emotion-log-flow'",
  "from './pause-shift-emotion-frame-hub-done-flow'",
  "from '../pause-shift-emotion-frame-hub-done-flow'",
];

/** Reflect steps umbrella flow — compose domain + run-* leaf modules only (not steps subcluster anchors). */
const LEGACY_PAUSE_REFLECT_STEPS_FLOW_SUBCLUSTER_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/steps/pause-favorite-toggle-flow',
  '@/features/pause/application/use-cases/ritual/reflect/steps/pause-reflect-note-flow',
  '@/features/pause/application/use-cases/ritual/reflect/steps/pause-reflect-tag-flow',
  '@/features/pause/application/use-cases/ritual/reflect/steps/pause-reflection-step-log-flow',
  "from './pause-favorite-toggle-flow'",
  "from '../pause-favorite-toggle-flow'",
  "from './pause-reflect-note-flow'",
  "from '../pause-reflect-note-flow'",
  "from './pause-reflect-tag-flow'",
  "from '../pause-reflect-tag-flow'",
  "from './pause-reflection-step-log-flow'",
  "from '../pause-reflection-step-log-flow'",
];

/** Reflect share umbrella flow — compose domain + leaf modules only (not share subcluster flow anchors). */
const LEGACY_PAUSE_REFLECT_SHARE_FLOW_SUBCLUSTER_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-orchestration-flow',
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflection-share-image-flow',
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflection-share-text-flow',
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflection-share-channel-urls-flow',
  "from './pause-reflect-share-orchestration-flow'",
  "from '../pause-reflect-share-orchestration-flow'",
  "from './pause-reflection-share-image-flow'",
  "from '../pause-reflection-share-image-flow'",
  "from './pause-reflection-share-text-flow'",
  "from '../pause-reflection-share-text-flow'",
  "from './pause-reflection-share-channel-urls-flow'",
  "from '../pause-reflection-share-channel-urls-flow'",
];

/** Reflect share orchestration umbrella — compose leaf modules only (not share subcluster flow anchors). */
const LEGACY_PAUSE_REFLECT_SHARE_ORCHESTRATION_FLOW_SUBCLUSTER_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflection-share-image-flow',
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflection-share-text-flow',
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflection-share-channel-urls-flow',
  "from './pause-reflection-share-image-flow'",
  "from '../pause-reflection-share-image-flow'",
  "from './pause-reflection-share-text-flow'",
  "from '../pause-reflection-share-text-flow'",
  "from './pause-reflection-share-channel-urls-flow'",
  "from '../pause-reflection-share-channel-urls-flow'",
];

/** Reflect share I/O — import via share subcluster flows only (not pause-reflect-share-orchestration-flow). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_SHARE_IO_ORCHESTRATION_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-orchestration-flow',
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-flow',
  "from './application/use-cases/ritual/reflect/share/pause-reflect-share-orchestration-flow'",
  "from '../application/use-cases/ritual/reflect/share/pause-reflect-share-orchestration-flow'",
  "from './application/use-cases/ritual/reflect/share/pause-reflect-share-flow'",
  "from '../application/use-cases/ritual/reflect/share/pause-reflect-share-flow'",
];

/** Reflect share I/O — import PNG orchestration via leaf module only (not pause-reflection-share-image-flow). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_SHARE_IO_IMAGE_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflection-share-image-flow',
  "from './application/use-cases/ritual/reflect/share/pause-reflection-share-image-flow'",
  "from '../application/use-cases/ritual/reflect/share/pause-reflection-share-image-flow'",
];

/** Reflect share I/O — import plain-text via domain only (not pause-reflection-share-text-flow). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_SHARE_IO_TEXT_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflection-share-text-flow',
  "from './application/use-cases/ritual/reflect/share/pause-reflection-share-text-flow'",
  "from '../application/use-cases/ritual/reflect/share/pause-reflection-share-text-flow'",
];

/** Reflect share I/O — import channel URLs via domain only (not pause-reflection-share-channel-urls-flow). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_SHARE_IO_CHANNEL_URLS_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflection-share-channel-urls-flow',
  "from './application/use-cases/ritual/reflect/share/pause-reflection-share-channel-urls-flow'",
  "from '../application/use-cases/ritual/reflect/share/pause-reflection-share-channel-urls-flow'",
];

/** Reflect share presentation — import share builders via pause-reflect-share-io only. */
const LEGACY_PAUSE_PRESENTATION_REFLECT_SHARE_DOMAIN_IMPORTS = [
  '@/features/pause/domain/reflect/share/',
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-orchestration-flow',
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-flow',
  '@/features/pause/application/use-cases/ritual/reflect/share/run-reflection-share-image',
  '@/features/pause/application/use-cases/ritual/reflect/share/deliver-reflection-share-image',
  '@/features/pause/application/use-cases/ritual/reflect/share/reflection-share-canvas',
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflection-share-image-flow',
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflection-share-text-flow',
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflection-share-channel-urls-flow',
  "from './domain/reflect/share/",
  "from '../domain/reflect/share/",
  "from './application/use-cases/ritual/reflect/share/run-reflection-share-image'",
  "from '../application/use-cases/ritual/reflect/share/run-reflection-share-image'",
  "from './application/use-cases/ritual/reflect/share/deliver-reflection-share-image'",
  "from '../application/use-cases/ritual/reflect/share/deliver-reflection-share-image'",
  "from './application/use-cases/ritual/reflect/share/reflection-share-canvas'",
  "from '../application/use-cases/ritual/reflect/share/reflection-share-canvas'",
  "from './application/use-cases/ritual/reflect/share/pause-reflect-share-orchestration-flow'",
  "from '../application/use-cases/ritual/reflect/share/pause-reflect-share-orchestration-flow'",
  "from './application/use-cases/ritual/reflect/share/pause-reflect-share-flow'",
  "from '../application/use-cases/ritual/reflect/share/pause-reflect-share-flow'",
];

/** Reflect steps I/O — import via steps umbrella only (not steps subcluster flow anchors). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_STEPS_IO_UMBRELLA_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/steps/pause-reflect-steps-flow',
  "from './application/use-cases/ritual/reflect/steps/pause-reflect-steps-flow'",
  "from '../application/use-cases/ritual/reflect/steps/pause-reflect-steps-flow'",
];

/** Reflect steps I/O — import favorite toggle via leaf module only (not pause-favorite-toggle-flow). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_STEPS_IO_FAVORITE_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/steps/pause-favorite-toggle-flow',
  "from './application/use-cases/ritual/reflect/steps/pause-favorite-toggle-flow'",
  "from '../application/use-cases/ritual/reflect/steps/pause-favorite-toggle-flow'",
];

/** Reflect steps I/O — import note update via leaf module only (not pause-reflect-note-flow). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_STEPS_IO_NOTE_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/steps/pause-reflect-note-flow',
  "from './application/use-cases/ritual/reflect/steps/pause-reflect-note-flow'",
  "from '../application/use-cases/ritual/reflect/steps/pause-reflect-note-flow'",
];

/** Reflect steps I/O — import tag update via leaf module only (not pause-reflect-tag-flow). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_STEPS_IO_TAG_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/steps/pause-reflect-tag-flow',
  "from './application/use-cases/ritual/reflect/steps/pause-reflect-tag-flow'",
  "from '../application/use-cases/ritual/reflect/steps/pause-reflect-tag-flow'",
];

/** Reflect steps I/O — import reflection_step log via leaf module only (not pause-reflection-step-log-flow). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_STEPS_IO_REFLECTION_STEP_LOG_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/steps/pause-reflection-step-log-flow',
  "from './application/use-cases/ritual/reflect/steps/pause-reflection-step-log-flow'",
  "from '../application/use-cases/ritual/reflect/steps/pause-reflection-step-log-flow'",
];

/** Reflect steps presentation — import step mutations/gates via pause-reflect-steps-io only. */
const LEGACY_PAUSE_PRESENTATION_REFLECT_STEPS_DOMAIN_IMPORTS = [
  '@/features/pause/domain/reflect/steps/',
  '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-favorite-toggle',
  '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-note-update',
  '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-tag-update',
  '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflection-step-log',
  '@/features/pause/application/use-cases/ritual/reflect/steps/pause-reflect-steps-flow',
  '@/features/pause/application/use-cases/ritual/reflect/steps/pause-favorite-toggle-flow',
  '@/features/pause/application/use-cases/ritual/reflect/steps/pause-reflect-note-flow',
  '@/features/pause/application/use-cases/ritual/reflect/steps/pause-reflect-tag-flow',
  '@/features/pause/application/use-cases/ritual/reflect/steps/pause-reflection-step-log-flow',
  "from './domain/reflect/steps/",
  "from '../domain/reflect/steps/",
  "from './application/use-cases/ritual/reflect/steps/run-pause-favorite-toggle'",
  "from '../application/use-cases/ritual/reflect/steps/run-pause-favorite-toggle'",
  "from './application/use-cases/ritual/reflect/steps/run-pause-reflect-note-update'",
  "from '../application/use-cases/ritual/reflect/steps/run-pause-reflect-note-update'",
  "from './application/use-cases/ritual/reflect/steps/run-pause-reflect-tag-update'",
  "from '../application/use-cases/ritual/reflect/steps/run-pause-reflect-tag-update'",
  "from './application/use-cases/ritual/reflect/steps/run-pause-reflection-step-log'",
  "from '../application/use-cases/ritual/reflect/steps/run-pause-reflection-step-log'",
];

/** Reflect flows umbrella flow — compose subcluster anchors only (no deep domain/reflect/flows or decide). */
const LEGACY_PAUSE_REFLECT_FLOWS_FLOW_SUBCLUSTER_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-and-decide-view-flow',
  '@/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-view-flow',
  '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-decide-outcome-log-flow',
  '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-decide-outcome-toast-flow',
  '@/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-toast-flow',
  '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-decide-wisdom-quotes-flow',
  '@/features/pause/application/use-cases/ritual/decide/pause-decide-wisdom-quotes-flow',
  '@/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-log-flow',
  '@/features/pause/application/use-cases/ritual/decide/pause-decide-score-impacts-flow',
  "from './pause-reflect-and-decide-view-flow'",
  "from '../pause-reflect-and-decide-view-flow'",
  "from '../../decide/pause-decide-outcome-view-flow'",
  "from './pause-reflect-decide-outcome-log-flow'",
  "from '../pause-reflect-decide-outcome-log-flow'",
  "from './pause-reflect-decide-outcome-toast-flow'",
  "from '../pause-reflect-decide-outcome-toast-flow'",
  "from '../../decide/pause-decide-outcome-toast-flow'",
  "from './pause-reflect-decide-wisdom-quotes-flow'",
  "from '../pause-reflect-decide-wisdom-quotes-flow'",
  "from '../../decide/pause-decide-wisdom-quotes-flow'",
  "from '../../decide/pause-decide-outcome-log-flow'",
  "from '../../decide/pause-decide-score-impacts-flow'",
];

/** Decide application — import PauseImpactData via impact-data anchor only. */
const LEGACY_PAUSE_DECIDE_APPLICATION_IMPACT_TYPE_IMPORTS = [
  '@/features/pause/domain/decide/pause-impact-data',
  "from '@/features/pause/domain/decide/pause-impact-data'",
  "from './domain/decide/pause-impact-data",
  "from '../domain/decide/pause-impact-data",
];

/** Screen-facing score impact — no deep decide/flows paths (use public-ritual-reflect for builders). */
const LEGACY_PAUSE_SCREEN_SCORE_IMPACT_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/decide/score-impacts',
  '@/features/pause/application/use-cases/ritual/decide/score-impact-presentation',
  '@/features/pause/application/use-cases/ritual/decide/pause-decide-score-impacts-flow',
  '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow',
  '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io',
  "from '@/features/pause/application/use-cases/ritual/decide/score-impacts'",
  "from '@/features/pause/application/use-cases/ritual/decide/score-impact-presentation'",
  "from '@/features/pause/application/use-cases/ritual/decide/pause-decide-score-impacts-flow'",
  "from '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow'",
  "from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io'",
];

const LEGACY_PAUSE_SCREEN_SCORE_IMPACT_PUBLIC_HOOKS_IMPORTS = [
  '@/features/pause/public-hooks',
  "from '@/features/pause/public-hooks'",
];

/** public-hooks — score impact exports via public-ritual-reflect (flows I/O) only. */
const LEGACY_PAUSE_PUBLIC_HOOKS_SCORE_IMPACT_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/decide/score-impacts',
  '@/features/pause/application/use-cases/ritual/decide/score-impact-presentation',
  '@/features/pause/application/use-cases/ritual/decide/pause-decide-score-impacts-flow',
  '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow',
  '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io',
  "from './application/use-cases/ritual/decide/score-impacts'",
  "from '../application/use-cases/ritual/decide/score-impacts'",
  "from './application/use-cases/ritual/decide/score-impact-presentation'",
  "from '../application/use-cases/ritual/decide/score-impact-presentation'",
  "from './application/use-cases/ritual/decide/pause-decide-score-impacts-flow'",
  "from '../application/use-cases/ritual/decide/pause-decide-score-impacts-flow'",
  "from './application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow'",
  "from './presentation/reflect/flows/pause-reflect-flows-io'",
];

/** Reflect flows I/O — import PauseImpactData via pause-session-decide-io only (not session decide-flow). */
const LEGACY_PAUSE_REFLECT_FLOWS_IO_DECIDE_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/session/pause-session-decide-flow',
  "from '@/features/pause/application/use-cases/session/pause-session-decide-flow'",
  "from './application/use-cases/session/pause-session-decide-flow'",
  "from '../application/use-cases/session/pause-session-decide-flow'",
];

/** Reflect flows handler params — import PauseImpactData via pause-session-decide-io only. */
const LEGACY_PAUSE_PRESENTATION_REFLECT_FLOWS_IMPACT_IMPORTS = [
  '@/features/pause/domain/decide/pause-impact-data',
  '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io',
  '@/features/pause/application/use-cases/ritual/reflect/flows/pause-decide-outcome-view-flow',
  '@/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-view-flow',
  "from './pause-reflect-flows-io'",
  "from '../pause-reflect-flows-io'",
  "from './domain/decide/pause-impact-data",
  "from '../domain/decide/pause-impact-data",
];

/** Reflect flows I/O — import via flows subcluster anchors only (not pause-reflect-flows-flow umbrella). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_FLOWS_IO_UMBRELLA_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow',
  "from './application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow'",
  "from '../application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow'",
];

/** Reflect flows I/O — import score-impact builders via leaf modules only (not pause-decide-score-impacts-flow). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_FLOWS_IO_SCORE_IMPACTS_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/decide/pause-decide-score-impacts-flow',
  "from './application/use-cases/ritual/decide/pause-decide-score-impacts-flow'",
  "from '../application/use-cases/ritual/decide/pause-decide-score-impacts-flow'",
];

/** Reflect flows I/O — import leaf domain/decide modules only (not reflect/flows subcluster anchors). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_FLOWS_IO_SUBCLUSTER_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-and-decide-view-flow',
  '@/features/pause/application/use-cases/ritual/reflect/flows/pause-decide-outcome-view-flow',
  '@/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-view-flow',
  '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-decide-outcome-log-flow',
  '@/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-log-flow',
  '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-decide-outcome-toast-flow',
  '@/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-toast-flow',
  '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-decide-wisdom-quotes-flow',
  '@/features/pause/application/use-cases/ritual/decide/pause-decide-wisdom-quotes-flow',
  "from './application/use-cases/ritual/reflect/flows/pause-reflect-and-decide-view-flow'",
  "from '../application/use-cases/ritual/reflect/flows/pause-reflect-and-decide-view-flow'",
  "from './application/use-cases/ritual/reflect/flows/pause-decide-outcome-view-flow'",
  "from '../application/use-cases/ritual/reflect/flows/pause-decide-outcome-view-flow'",
  "from './application/use-cases/ritual/decide/pause-decide-outcome-view-flow'",
  "from '../application/use-cases/ritual/decide/pause-decide-outcome-view-flow'",
  "from './application/use-cases/ritual/reflect/flows/pause-reflect-decide-outcome-log-flow'",
  "from '../application/use-cases/ritual/reflect/flows/pause-reflect-decide-outcome-log-flow'",
  "from './application/use-cases/ritual/decide/pause-decide-outcome-log-flow'",
  "from '../application/use-cases/ritual/decide/pause-decide-outcome-log-flow'",
  "from './application/use-cases/ritual/reflect/flows/pause-reflect-decide-outcome-toast-flow'",
  "from '../application/use-cases/ritual/reflect/flows/pause-reflect-decide-outcome-toast-flow'",
  "from './application/use-cases/ritual/decide/pause-decide-outcome-toast-flow'",
  "from '../application/use-cases/ritual/decide/pause-decide-outcome-toast-flow'",
  "from './application/use-cases/ritual/reflect/flows/pause-reflect-decide-wisdom-quotes-flow'",
  "from '../application/use-cases/ritual/reflect/flows/pause-reflect-decide-wisdom-quotes-flow'",
  "from './application/use-cases/ritual/decide/pause-decide-wisdom-quotes-flow'",
  "from '../application/use-cases/ritual/decide/pause-decide-wisdom-quotes-flow'",
];

const LEGACY_PAUSE_PRESENTATION_COMPANION_ORCHESTRATION_IO_UMBRELLA_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestration-flow',
  "from './application/use-cases/ritual/frame/pause-companion-orchestration-flow'",
  "from '../application/use-cases/ritual/frame/pause-companion-orchestration-flow'",
];

/** Companion orchestration I/O — import ritual/frame leaf modules directly (not orchestration subcluster flow anchors). */
const LEGACY_PAUSE_PRESENTATION_COMPANION_ORCHESTRATION_IO_SUBCLUSTER_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-session-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-library-favorite-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-section-expansion-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-ui-completion-flow',
  "from './application/use-cases/ritual/frame/pause-companion-orchestrate-session-flow'",
  "from '../application/use-cases/ritual/frame/pause-companion-orchestrate-session-flow'",
  "from './application/use-cases/ritual/frame/pause-companion-library-favorite-flow'",
  "from '../application/use-cases/ritual/frame/pause-companion-library-favorite-flow'",
  "from './application/use-cases/ritual/frame/pause-companion-section-expansion-flow'",
  "from '../application/use-cases/ritual/frame/pause-companion-section-expansion-flow'",
  "from './application/use-cases/ritual/frame/pause-companion-ui-completion-flow'",
  "from '../application/use-cases/ritual/frame/pause-companion-ui-completion-flow'",
];

/** Companion orchestrate umbrella — compose leaf modules only (not orchestrate subcluster flow anchors). */
const LEGACY_PAUSE_COMPANION_ORCHESTRATE_FLOW_SUBCLUSTER_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-retry-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-outcome-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-slot-apply-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-intervention-orchestrate-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-slot-orchestrate-telemetry-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-slot-orchestrate-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-slot-orchestrate-ui-flow',
  "from './pause-companion-orchestrate-retry-flow'",
  "from '../pause-companion-orchestrate-retry-flow'",
  "from './pause-companion-orchestrate-outcome-flow'",
  "from '../pause-companion-orchestrate-outcome-flow'",
  "from './pause-companion-orchestrate-slot-apply-flow'",
  "from '../pause-companion-orchestrate-slot-apply-flow'",
  "from './pause-companion-intervention-orchestrate-flow'",
  "from '../pause-companion-intervention-orchestrate-flow'",
  "from './pause-companion-slot-orchestrate-telemetry-flow'",
  "from '../pause-companion-slot-orchestrate-telemetry-flow'",
  "from './pause-companion-slot-orchestrate-flow'",
  "from '../pause-companion-slot-orchestrate-flow'",
  "from './pause-companion-slot-orchestrate-ui-flow'",
  "from '../pause-companion-slot-orchestrate-ui-flow'",
];

/** Companion orchestrate I/O — import via orchestrate subcluster flows only (not pause-companion-orchestrate-flow umbrella). */
const LEGACY_PAUSE_PRESENTATION_COMPANION_ORCHESTRATE_IO_UMBRELLA_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-flow',
  "from './application/use-cases/ritual/frame/pause-companion-orchestrate-flow'",
  "from '../application/use-cases/ritual/frame/pause-companion-orchestrate-flow'",
];

/** Companion orchestrate I/O — import ritual/frame leaf modules directly (not orchestrate subcluster flow anchors). */
const LEGACY_PAUSE_PRESENTATION_COMPANION_ORCHESTRATE_IO_SUBCLUSTER_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-retry-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-outcome-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-slot-apply-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-intervention-orchestrate-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-slot-orchestrate-telemetry-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-slot-orchestrate-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-slot-orchestrate-ui-flow',
  "from './application/use-cases/ritual/frame/pause-companion-orchestrate-retry-flow'",
  "from '../application/use-cases/ritual/frame/pause-companion-orchestrate-retry-flow'",
  "from './application/use-cases/ritual/frame/pause-companion-orchestrate-outcome-flow'",
  "from '../application/use-cases/ritual/frame/pause-companion-orchestrate-outcome-flow'",
  "from './application/use-cases/ritual/frame/pause-companion-orchestrate-slot-apply-flow'",
  "from '../application/use-cases/ritual/frame/pause-companion-orchestrate-slot-apply-flow'",
  "from './application/use-cases/ritual/frame/pause-companion-intervention-orchestrate-flow'",
  "from '../application/use-cases/ritual/frame/pause-companion-intervention-orchestrate-flow'",
  "from './application/use-cases/ritual/frame/pause-companion-slot-orchestrate-telemetry-flow'",
  "from '../application/use-cases/ritual/frame/pause-companion-slot-orchestrate-telemetry-flow'",
  "from './application/use-cases/ritual/frame/pause-companion-slot-orchestrate-flow'",
  "from '../application/use-cases/ritual/frame/pause-companion-slot-orchestrate-flow'",
  "from './application/use-cases/ritual/frame/pause-companion-slot-orchestrate-ui-flow'",
  "from '../application/use-cases/ritual/frame/pause-companion-slot-orchestrate-ui-flow'",
];

/** Companion frame UI I/O — import via subcluster flows only (not pause-companion-frame-ui-flow umbrella). */
const LEGACY_PAUSE_PRESENTATION_COMPANION_FRAME_UI_IO_UMBRELLA_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-frame-ui-flow',
  "from './application/use-cases/ritual/frame/pause-companion-frame-ui-flow'",
  "from '../application/use-cases/ritual/frame/pause-companion-frame-ui-flow'",
];

/** Companion frame UI I/O — import ritual/frame leaf modules directly (not frame UI subcluster flow anchors). */
const LEGACY_PAUSE_PRESENTATION_COMPANION_FRAME_UI_IO_SUBCLUSTER_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-full-view-ui-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-section-visibility-flow',
  "from './application/use-cases/ritual/frame/pause-companion-full-view-ui-flow'",
  "from '../application/use-cases/ritual/frame/pause-companion-full-view-ui-flow'",
  "from './application/use-cases/ritual/frame/pause-companion-section-visibility-flow'",
  "from '../application/use-cases/ritual/frame/pause-companion-section-visibility-flow'",
];

/** Companion frame UI presentation — import via pause-companion-frame-ui-io only. */
const LEGACY_PAUSE_PRESENTATION_COMPANION_FRAME_UI_DOMAIN_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/frame/full-view-page-helpers',
  '@/features/pause/application/use-cases/ritual/frame/section-visibility',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-full-view-ui-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-section-visibility-flow',
  "from './full-view-page-helpers'",
  "from '../full-view-page-helpers'",
  "from './section-visibility'",
  "from '../section-visibility'",
];

/** Companion frame UI umbrella — compose leaf modules only (not frame UI subcluster flow anchors). */
const LEGACY_PAUSE_COMPANION_FRAME_UI_FLOW_SUBCLUSTER_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-full-view-ui-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-section-visibility-flow',
  "from './pause-companion-full-view-ui-flow'",
  "from '../pause-companion-full-view-ui-flow'",
  "from './pause-companion-section-visibility-flow'",
  "from '../pause-companion-section-visibility-flow'",
];

/** Companion orchestration umbrella — compose leaf modules only (not orchestration subcluster flow anchors). */
const LEGACY_PAUSE_COMPANION_ORCHESTRATION_FLOW_SUBCLUSTER_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-session-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-section-expansion-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-ui-completion-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-library-favorite-flow',
  "from './pause-companion-orchestrate-session-flow'",
  "from '../pause-companion-orchestrate-session-flow'",
  "from './pause-companion-section-expansion-flow'",
  "from '../pause-companion-section-expansion-flow'",
  "from './pause-companion-ui-completion-flow'",
  "from '../pause-companion-ui-completion-flow'",
  "from './pause-companion-library-favorite-flow'",
  "from '../pause-companion-library-favorite-flow'",
];

/** Companion orchestration presentation — import via pause-companion-orchestration-io only. */
const LEGACY_PAUSE_PRESENTATION_COMPANION_ORCHESTRATION_DOMAIN_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/frame/load-companion-orchestrate-session',
  '@/features/pause/application/use-cases/ritual/frame/persist-ui-step-completion',
  '@/features/pause/application/use-cases/ritual/frame/run-toggle-companion-library-favorite',
  '@/features/pause/application/use-cases/ritual/frame/next-expanded-with-lazy-fetch',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestration-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-session-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-ui-completion-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-library-favorite-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-section-expansion-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-slot-orchestrate-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-intervention-orchestrate-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-outcome-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-retry-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-slot-orchestrate-telemetry-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-slot-orchestrate-ui-flow',
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-slot-apply-flow',
  '@/features/pause/application/use-cases/ritual/frame/run-companion-slot-orchestrate',
  '@/features/pause/application/use-cases/ritual/frame/run-companion-intervention-bootstrap',
  '@/features/pause/application/use-cases/ritual/frame/apply-companion-slot-orchestrate-outcome',
  '@/features/pause/application/use-cases/ritual/frame/apply-companion-orchestrate-retry-reset',
  '@/features/pause/application/use-cases/ritual/frame/companion-slot-orchestrate-telemetry',
  '@/features/pause/application/use-cases/ritual/frame/companion-generation-telemetry',
  '@/features/pause/application/use-cases/ritual/frame/companion-slot-ui-state',
  '@/features/pause/application/use-cases/ritual/frame/intervention-idempotency',
  '@/features/pause/application/use-cases/ritual/frame/orchestrate-slot-apply',
  "from './load-companion-orchestrate-session'",
  "from '../load-companion-orchestrate-session'",
  "from './persist-ui-step-completion'",
  "from '../persist-ui-step-completion'",
  "from './run-toggle-companion-library-favorite'",
  "from '../run-toggle-companion-library-favorite'",
  "from './next-expanded-with-lazy-fetch'",
  "from '../next-expanded-with-lazy-fetch'",
];

/** Reflect flows presentation — import reflect/decide helpers via pause-reflect-flows-io only. */
const LEGACY_PAUSE_PRESENTATION_REFLECT_FLOWS_DOMAIN_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow',
  '@/features/pause/domain/reflect/flows/',
  '@/features/pause/domain/decide/pause-impact-data',
  '@/features/pause/domain/decide/pause-decide-outcome-flow',
  '@/features/pause/application/use-cases/ritual/decide/pause-decide-score-impacts-flow',
  '@/features/pause/application/use-cases/ritual/decide/score-impacts',
  '@/features/pause/application/use-cases/ritual/decide/score-impact-presentation',
  '@/features/pause/application/use-cases/ritual/decide/run-pause-outcome-log',
  '@/features/pause/application/use-cases/ritual/decide/outcome-toast',
  '@/features/pause/application/use-cases/ritual/decide/wisdom-quotes',
  '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-and-decide-view-flow',
  '@/features/pause/application/use-cases/ritual/reflect/flows/pause-decide-outcome-view-flow',
  '@/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-view-flow',
  '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-decide-outcome-log-flow',
  '@/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-log-flow',
  '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-decide-outcome-toast-flow',
  '@/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-toast-flow',
  '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-decide-wisdom-quotes-flow',
  '@/features/pause/application/use-cases/ritual/decide/pause-decide-wisdom-quotes-flow',
  "from './domain/reflect/flows/",
  "from '../domain/reflect/flows/",
  "from './domain/decide/pause-impact-data",
  "from '../domain/decide/pause-impact-data",
  "from './domain/decide/pause-decide-outcome-flow",
  "from '../domain/decide/pause-decide-outcome-flow",
  "from './application/use-cases/ritual/decide/run-pause-outcome-log'",
  "from '../application/use-cases/ritual/decide/run-pause-outcome-log'",
  "from './application/use-cases/ritual/decide/pause-decide-score-impacts-flow'",
  "from '../application/use-cases/ritual/decide/pause-decide-score-impacts-flow'",
  "from './application/use-cases/ritual/decide/score-impacts'",
  "from '../application/use-cases/ritual/decide/score-impacts'",
  "from './application/use-cases/ritual/decide/score-impact-presentation'",
  "from '../application/use-cases/ritual/decide/score-impact-presentation'",
  "from './application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow'",
  "from '../application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow'",
];

/** Reflect share presentation — import session UI telemetry via pause-reflect-share-flow only. */
const LEGACY_PAUSE_PRESENTATION_REFLECT_SHARE_TELEMETRY_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-telemetry-flow',
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-session-ui-telemetry',
  "from './application/use-cases/ritual/reflect/share/pause-reflect-telemetry-flow'",
  "from '../application/use-cases/ritual/reflect/share/pause-reflect-telemetry-flow'",
  "from './application/use-cases/ritual/reflect/share/pause-reflect-session-ui-telemetry'",
  "from '../application/use-cases/ritual/reflect/share/pause-reflect-session-ui-telemetry'",
];

/** Share telemetry I/O — import session UI telemetry directly (not telemetry-flow anchor). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_SHARE_TELEMETRY_IO_TELEMETRY_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-telemetry-flow',
  "from './application/use-cases/ritual/reflect/telemetry/pause-reflect-telemetry-flow'",
  "from '../application/use-cases/ritual/reflect/telemetry/pause-reflect-telemetry-flow'",
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-telemetry-flow',
  "from './application/use-cases/ritual/reflect/share/pause-reflect-telemetry-flow'",
  "from '../application/use-cases/ritual/reflect/share/pause-reflect-telemetry-flow'",
];

/** Share telemetry I/O — import via pause-reflect-session-ui-telemetry only (not share umbrella). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_SHARE_TELEMETRY_IO_SHARE_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-flow',
  "from './application/use-cases/ritual/reflect/share/pause-reflect-share-flow'",
  "from '../application/use-cases/ritual/reflect/share/pause-reflect-share-flow'",
];

/** Reflect share presentation — orchestration I/O via pause-reflect-share-orchestration-flow only. */
/** Reflect generation presentation (holzen-reflect) — import via pause-reflect-generation-flow only. */
const LEGACY_PAUSE_PRESENTATION_REFLECT_GENERATION_HOOK_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/generation/holzen-reflect/pause-reflect-generation-hook-flow',
  '@/features/pause/application/use-cases/ritual/reflect/generation/holzen-reflect/run-reflect-generation',
  "from './application/use-cases/ritual/reflect/generation/holzen-reflect/pause-reflect-generation-hook-flow'",
  "from '../application/use-cases/ritual/reflect/generation/holzen-reflect/pause-reflect-generation-hook-flow'",
  "from './application/use-cases/ritual/reflect/generation/holzen-reflect/run-reflect-generation'",
  "from '../application/use-cases/ritual/reflect/generation/holzen-reflect/run-reflect-generation'",
];

/** Reflect generation presentation (manual-open) — import use cases via pause-home-reflect-io only. */
const LEGACY_PAUSE_PRESENTATION_REFLECT_GENERATION_MANUAL_OPEN_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow',
  '@/features/pause/application/use-cases/ritual/reflect/generation/pause-reflect-generation-manual-open-flow',
  '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/open-manual-pause-from-home',
  '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/dismiss-open-pause-home',
  '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/run-persist-silent-reflection-stub',
  '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/run-open-manual-pause-silent-mode-after-create',
  "from './application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow'",
  "from '../application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow'",
  "from './application/use-cases/ritual/reflect/generation/pause-reflect-generation-manual-open-flow'",
  "from '../application/use-cases/ritual/reflect/generation/pause-reflect-generation-manual-open-flow'",
  "from './application/use-cases/ritual/reflect/generation/manual-open/open-manual-pause-from-home'",
  "from '../application/use-cases/ritual/reflect/generation/manual-open/open-manual-pause-from-home'",
];

/** Reflect generation umbrella flow — compose holzen-reflect + manual-open subclusters only. */
/** Reflect generation umbrella flow — compose domain + leaf modules only (not generation subcluster anchors). */
const LEGACY_PAUSE_REFLECT_GENERATION_FLOW_SUBCLUSTER_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/generation/holzen-reflect/pause-reflect-generation-hook-flow',
  '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/pause-reflect-generation-manual-open-flow',
  '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/pause-home-reflect-telemetry-flow',
  "from './holzen-reflect/pause-reflect-generation-hook-flow'",
  "from '../holzen-reflect/pause-reflect-generation-hook-flow'",
  "from './manual-open/pause-reflect-generation-manual-open-flow'",
  "from '../manual-open/pause-reflect-generation-manual-open-flow'",
  "from './manual-open/pause-home-reflect-telemetry-flow'",
  "from '../manual-open/pause-home-reflect-telemetry-flow'",
];

const LEGACY_PAUSE_REFLECT_GENERATION_FLOW_TELEMETRY_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/home-pause-actions-telemetry',
  '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/manual-pause-trigger-telemetry',
  "from './manual-open/home-pause-actions-telemetry'",
  "from '../manual-open/home-pause-actions-telemetry'",
  "from './manual-open/manual-pause-trigger-telemetry'",
  "from '../manual-open/manual-pause-trigger-telemetry'",
];

/** Reflect ambience presentation — import via pause-reflect-ambience-io only. */
const LEGACY_PAUSE_PRESENTATION_REFLECT_AMBIENCE_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/ambience/pause-reflect-ambience-flow',
  '@/features/pause/domain/ritual/breathe/reflect-frame-focus-ambience',
  "from './application/use-cases/ritual/reflect/ambience/pause-reflect-ambience-flow'",
  "from '../application/use-cases/ritual/reflect/ambience/pause-reflect-ambience-flow'",
  "from '@/features/pause/domain/ritual/breathe/reflect-frame-focus-ambience'",
  "from './domain/ritual/breathe/reflect-frame-focus-ambience'",
  "from '../domain/ritual/breathe/reflect-frame-focus-ambience'",
];

/** Reflect ambience I/O — import domain directly (not pause-reflect-ambience-flow umbrella). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_AMBIENCE_IO_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/ambience/pause-reflect-ambience-flow',
  "from './application/use-cases/ritual/reflect/ambience/pause-reflect-ambience-flow'",
  "from '../application/use-cases/ritual/reflect/ambience/pause-reflect-ambience-flow'",
];

/** Reflect hub I/O — import via hub umbrella only (not hub subcluster flow anchors). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_HUB_IO_UMBRELLA_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/hub/pause-reflect-hub-flow',
  "from './application/use-cases/ritual/reflect/hub/pause-reflect-hub-flow'",
  "from '../application/use-cases/ritual/reflect/hub/pause-reflect-hub-flow'",
];

/** Reflect hub I/O — import shift-frame done RPC via leaf module only (not pause-shift-emotion-frame-hub-done-flow). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_HUB_IO_DONE_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/hub/pause-shift-emotion-frame-hub-done-flow',
  "from './application/use-cases/ritual/reflect/hub/pause-shift-emotion-frame-hub-done-flow'",
  "from '../application/use-cases/ritual/reflect/hub/pause-shift-emotion-frame-hub-done-flow'",
];

/** Reflect hub I/O — import presentation mapping via domain only (not pause-shift-frame-hub-presentation-flow). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_HUB_IO_PRESENTATION_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/hub/pause-shift-frame-hub-presentation-flow',
  "from './application/use-cases/ritual/reflect/hub/pause-shift-frame-hub-presentation-flow'",
  "from '../application/use-cases/ritual/reflect/hub/pause-shift-frame-hub-presentation-flow'",
];

/** Reflect hub I/O — import log bundle via domain only (not pause-shift-emotion-log-flow). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_HUB_IO_LOG_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/hub/pause-shift-emotion-log-flow',
  "from './application/use-cases/ritual/reflect/hub/pause-shift-emotion-log-flow'",
  "from '../application/use-cases/ritual/reflect/hub/pause-shift-emotion-log-flow'",
];

/** Reflect hub presentation — import domain hub helpers via pause-reflect-hub-io only. */
const LEGACY_PAUSE_PRESENTATION_REFLECT_HUB_DOMAIN_IMPORTS = [
  '@/features/pause/domain/reflect/hub/',
  '@/features/pause/application/use-cases/ritual/reflect/hub/run-shift-emotion-frame-hub-done',
  '@/features/pause/application/use-cases/ritual/reflect/hub/pause-reflect-hub-flow',
  '@/features/pause/application/use-cases/ritual/reflect/hub/pause-shift-frame-hub-presentation-flow',
  '@/features/pause/application/use-cases/ritual/reflect/hub/pause-shift-emotion-log-flow',
  '@/features/pause/application/use-cases/ritual/reflect/hub/pause-shift-emotion-frame-hub-done-flow',
  "from './domain/reflect/hub/",
  "from '../domain/reflect/hub/",
  "from './application/use-cases/ritual/reflect/hub/run-shift-emotion-frame-hub-done'",
  "from '../application/use-cases/ritual/reflect/hub/run-shift-emotion-frame-hub-done'",
  "from './application/use-cases/ritual/reflect/hub/pause-reflect-hub-flow'",
  "from '../application/use-cases/ritual/reflect/hub/pause-reflect-hub-flow'",
  "from './application/use-cases/ritual/reflect/hub/pause-shift-frame-hub-presentation-flow'",
  "from '../application/use-cases/ritual/reflect/hub/pause-shift-frame-hub-presentation-flow'",
  "from './application/use-cases/ritual/reflect/hub/pause-shift-emotion-log-flow'",
  "from '../application/use-cases/ritual/reflect/hub/pause-shift-emotion-log-flow'",
  "from './application/use-cases/ritual/reflect/hub/pause-shift-emotion-frame-hub-done-flow'",
  "from '../application/use-cases/ritual/reflect/hub/pause-shift-emotion-frame-hub-done-flow'",
];

/** Reflect generation presentation (holzen-reflect) — import via pause-reflect-generation-io only. */
const LEGACY_PAUSE_PRESENTATION_REFLECT_GENERATION_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/generation/holzen-reflect/',
  '@/features/pause/application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow',
  '@/features/pause/application/use-cases/ritual/reflect/generation/pause-reflect-generation-hook-flow',
  '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/',
  "from './application/use-cases/ritual/reflect/generation/holzen-reflect/",
  "from '../application/use-cases/ritual/reflect/generation/holzen-reflect/",
  "from './application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow'",
  "from '../application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow'",
  "from './application/use-cases/ritual/reflect/generation/pause-reflect-generation-hook-flow'",
  "from '../application/use-cases/ritual/reflect/generation/pause-reflect-generation-hook-flow'",
];

/** Reflect mood I/O — import via mood subcluster flows only (not pause-reflect-mood-flow umbrella). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_MOOD_IO_UMBRELLA_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/mood/pause-reflect-mood-flow',
  "from './application/use-cases/ritual/reflect/mood/pause-reflect-mood-flow'",
  "from '../application/use-cases/ritual/reflect/mood/pause-reflect-mood-flow'",
];

/** Reflect mood I/O — import domain + leaf use cases directly (not mood subcluster flow anchors). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_MOOD_IO_SUBCLUSTER_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/mood/pause-depth-picker-mood-flow',
  '@/features/pause/application/use-cases/ritual/reflect/mood/pause-feel-tiles-mood-flow',
  '@/features/pause/application/use-cases/ritual/reflect/mood/pause-initial-emotion-presentation-flow',
  '@/features/pause/application/use-cases/ritual/reflect/mood/pause-initial-emotion-log-flow',
  '@/features/pause/application/use-cases/ritual/reflect/mood/pause-session-mood-chrome-flow',
  "from './application/use-cases/ritual/reflect/mood/pause-depth-picker-mood-flow'",
  "from '../application/use-cases/ritual/reflect/mood/pause-depth-picker-mood-flow'",
  "from './application/use-cases/ritual/reflect/mood/pause-feel-tiles-mood-flow'",
  "from '../application/use-cases/ritual/reflect/mood/pause-feel-tiles-mood-flow'",
  "from './application/use-cases/ritual/reflect/mood/pause-initial-emotion-presentation-flow'",
  "from '../application/use-cases/ritual/reflect/mood/pause-initial-emotion-presentation-flow'",
  "from './application/use-cases/ritual/reflect/mood/pause-initial-emotion-log-flow'",
  "from '../application/use-cases/ritual/reflect/mood/pause-initial-emotion-log-flow'",
  "from './application/use-cases/ritual/reflect/mood/pause-session-mood-chrome-flow'",
  "from '../application/use-cases/ritual/reflect/mood/pause-session-mood-chrome-flow'",
];

/** Ritual done presentation (non-I/O) — import post-pause emotion log via pause-ritual-done-io only. */
const LEGACY_PAUSE_PRESENTATION_RITUAL_DONE_IO_USE_CASE_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/done/post-pause-emotion-log',
  '@/features/pause/application/use-cases/ritual/done/pause-post-pause-emotion-log-flow',
  '@/features/pause/application/use-cases/ritual/done/pause-ritual-done-flow',
  "from './application/use-cases/ritual/done/post-pause-emotion-log'",
  "from '../application/use-cases/ritual/done/post-pause-emotion-log'",
  "from './application/use-cases/ritual/done/pause-post-pause-emotion-log-flow'",
  "from '../application/use-cases/ritual/done/pause-post-pause-emotion-log-flow'",
  "from './application/use-cases/ritual/done/pause-ritual-done-flow'",
  "from '../application/use-cases/ritual/done/pause-ritual-done-flow'",
];

const LEGACY_PAUSE_PRESENTATION_RITUAL_DONE_IO_UMBRELLA_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/done/pause-ritual-done-flow',
  "from './application/use-cases/ritual/done/pause-ritual-done-flow'",
  "from '../application/use-cases/ritual/done/pause-ritual-done-flow'",
];

/** Ritual done I/O — import post-pause emotion log leaf directly (not done subcluster flow anchors). */
const LEGACY_PAUSE_PRESENTATION_RITUAL_DONE_IO_SUBCLUSTER_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/done/pause-post-pause-emotion-log-flow',
  "from './application/use-cases/ritual/done/pause-post-pause-emotion-log-flow'",
  "from '../application/use-cases/ritual/done/pause-post-pause-emotion-log-flow'",
];

/** Ritual done presentation — import domain done helpers via pause-ritual-done-io only. */
const LEGACY_PAUSE_PRESENTATION_RITUAL_DONE_DOMAIN_IMPORTS = [
  '@/features/pause/domain/ritual/done/',
  "from '@/features/pause/domain/ritual/done/",
  "from './domain/ritual/done/",
  "from '../domain/ritual/done/",
];

/** Reflect mood presentation — import domain mood helpers via pause-reflect-mood-io only. */
const LEGACY_PAUSE_PRESENTATION_REFLECT_MOOD_DOMAIN_IMPORTS = [
  '@/features/pause/domain/reflect/mood/',
  '@/features/pause/application/use-cases/ritual/reflect/mood/run-initial-emotion-log',
  '@/features/pause/application/use-cases/ritual/reflect/mood/pause-initial-emotion-log-flow',
  '@/features/pause/application/use-cases/ritual/reflect/mood/pause-feel-tiles-mood-flow',
  '@/features/pause/application/use-cases/ritual/reflect/mood/pause-depth-picker-mood-flow',
  '@/features/pause/application/use-cases/ritual/reflect/mood/pause-initial-emotion-presentation-flow',
  '@/features/pause/application/use-cases/ritual/reflect/mood/pause-session-mood-chrome-flow',
  "from './domain/reflect/mood/",
  "from '../domain/reflect/mood/",
  "from './application/use-cases/ritual/reflect/mood/run-initial-emotion-log'",
  "from '../application/use-cases/ritual/reflect/mood/run-initial-emotion-log'",
];

/** Flat session pending-offer presentation — use presentation/reflect/pending-offer/. */
const LEGACY_PAUSE_PRESENTATION_SESSION_PENDING_OFFER_CLUSTER_IMPORTS = [
  '@/features/pause/presentation/session/pause-session-pending-offer-io',
  '@/features/pause/presentation/session/pause-session-pending-offer-telemetry-io',
  '@/features/pause/presentation/session/use-pending-pause-offer',
  '@/features/pause/presentation/session/use-pending-pause-offer-mutations',
  '@/features/pause/presentation/session/use-pause-session-pending-leave-sheet',
  '@/features/pause/presentation/session/use-pause-session-pending-pause-offer-navigation',
  "from './presentation/session/pause-session-pending-offer-io'",
  "from './presentation/session/pause-session-pending-offer-telemetry-io'",
  "from './presentation/session/use-pending-pause-offer'",
  "from './presentation/session/use-pending-pause-offer-mutations'",
  "from './presentation/session/use-pause-session-pending-leave-sheet'",
  "from '../presentation/session/pause-session-pending-offer-io'",
  "from '../presentation/session/pause-session-pending-offer-telemetry-io'",
  "from '../presentation/session/use-pending-pause-offer'",
  "from '../presentation/session/use-pending-pause-offer-mutations'",
  "from '../presentation/session/use-pause-session-pending-leave-sheet'",
  "from './presentation/session/use-pause-session-pending-pause-offer-navigation'",
  "from '../presentation/session/use-pause-session-pending-pause-offer-navigation'",
];

/** Deep session telemetry in presentation/session — use telemetry-io only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_TELEMETRY_IMPORTS = [
  '@/features/pause/application/use-cases/session/pause-session-telemetry',
  "from './application/use-cases/session/pause-session-telemetry'",
  "from '../application/use-cases/session/pause-session-telemetry'",
];

/** Pending-offer PostHog — colocated under ritual/reflect/telemetry/ (not pending-offer/). */
const LEGACY_PAUSE_REFLECT_PENDING_OFFER_TELEMETRY_PATH_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-pending-offer-telemetry-flow',
  '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pending-pause-offer-telemetry',
  '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-session-abandoned-telemetry',
  "from './application/use-cases/ritual/reflect/pending-offer/pause-pending-offer-telemetry-flow'",
  "from '../application/use-cases/ritual/reflect/pending-offer/pause-pending-offer-telemetry-flow'",
  "from './application/use-cases/ritual/reflect/pending-offer/pending-pause-offer-telemetry'",
  "from '../application/use-cases/ritual/reflect/pending-offer/pending-pause-offer-telemetry'",
  "from './application/use-cases/ritual/reflect/pending-offer/pause-session-abandoned-telemetry'",
  "from '../application/use-cases/ritual/reflect/pending-offer/pause-session-abandoned-telemetry'",
];

/** Reflect pending-offer I/O — import via subcluster flows only (not pause-reflect-pending-offer-flow umbrella). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_PENDING_OFFER_IO_UMBRELLA_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-flow',
  "from './application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-flow'",
  "from '../application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-flow'",
];

/** Pending-offer RPC I/O — import leaf use cases only (not pause-reflect-pending-offer-rpc-flow). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_PENDING_OFFER_IO_RPC_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-rpc-flow',
  "from './application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-rpc-flow'",
  "from '../application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-rpc-flow'",
];

/** Pending-offer display I/O — import leaf module only (not pause-pending-offer-display-flow). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_PENDING_OFFER_IO_DISPLAY_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-pending-offer-display-flow',
  "from './application/use-cases/ritual/reflect/pending-offer/pause-pending-offer-display-flow'",
  "from '../application/use-cases/ritual/reflect/pending-offer/pause-pending-offer-display-flow'",
];

/** Reflect pending-offer presentation — import PostHog via pause-reflect-pending-offer-telemetry-io only. */
const LEGACY_PAUSE_PRESENTATION_REFLECT_PENDING_OFFER_TELEMETRY_SUBCLUSTER_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-pending-offer-telemetry-flow',
  "from './application/use-cases/ritual/reflect/telemetry/pause-pending-offer-telemetry-flow'",
  "from '../application/use-cases/ritual/reflect/telemetry/pause-pending-offer-telemetry-flow'",
];

/** Pending-offer telemetry I/O — import leaf trackers only (not pause-pending-offer-telemetry-flow). */
const LEGACY_PAUSE_PRESENTATION_REFLECT_PENDING_OFFER_TELEMETRY_IO_TELEMETRY_FLOW_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-pending-offer-telemetry-flow',
  "from './application/use-cases/ritual/reflect/telemetry/pause-pending-offer-telemetry-flow'",
  "from '../application/use-cases/ritual/reflect/telemetry/pause-pending-offer-telemetry-flow'",
];

/** Reflect pending-offer presentation — import adopt/decline via pause-reflect-pending-offer-flow only. */
const LEGACY_PAUSE_PRESENTATION_REFLECT_PENDING_OFFER_RPC_SUBCLUSTER_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-rpc-flow',
  "from './application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-rpc-flow'",
  "from '../application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-rpc-flow'",
];

/** Reflect pending-offer presentation — import display via pause-reflect-pending-offer-flow only. */
const LEGACY_PAUSE_PRESENTATION_REFLECT_PENDING_OFFER_DISPLAY_SUBCLUSTER_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-pending-offer-display-flow',
  "from './application/use-cases/ritual/reflect/pending-offer/pause-pending-offer-display-flow'",
  "from '../application/use-cases/ritual/reflect/pending-offer/pause-pending-offer-display-flow'",
];

/** Reflect pending-offer umbrella flow — compose leaf modules only (not pending-offer subcluster flow anchors). */
const LEGACY_PAUSE_REFLECT_PENDING_OFFER_FLOW_SUBCLUSTER_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-rpc-flow',
  '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-pending-offer-display-flow',
  '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-pending-offer-telemetry-flow',
  "from './pause-reflect-pending-offer-rpc-flow'",
  "from '../pause-reflect-pending-offer-rpc-flow'",
  "from './pause-pending-offer-display-flow'",
  "from '../pause-pending-offer-display-flow'",
  "from './pause-pending-offer-telemetry-flow'",
  "from '../pause-pending-offer-telemetry-flow'",
  "from '../telemetry/pause-pending-offer-telemetry-flow'",
];

/** Session presentation — import pending-offer PostHog leaf trackers via telemetry-io only. */
const LEGACY_PAUSE_PRESENTATION_SESSION_PENDING_OFFER_TELEMETRY_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/telemetry/pending-pause-offer-telemetry',
  '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-session-abandoned-telemetry',
  "from './application/use-cases/ritual/reflect/telemetry/pending-pause-offer-telemetry'",
  "from '../application/use-cases/ritual/reflect/telemetry/pending-pause-offer-telemetry'",
  "from './application/use-cases/ritual/reflect/telemetry/pause-session-abandoned-telemetry'",
  "from '../application/use-cases/ritual/reflect/telemetry/pause-session-abandoned-telemetry'",
];

/** Session presentation — adopt/decline/display via pause-reflect-pending-offer-flow (pending-offer-io only). */
const LEGACY_PAUSE_PRESENTATION_SESSION_PENDING_OFFER_USE_CASE_IMPORTS = [
  '@/features/pause/application/use-cases/session/pending-offer/',
  '@/features/pause/application/use-cases/session/pause-session-pending-offer-flow',
  "from './application/use-cases/session/pending-offer/",
  "from '../application/use-cases/session/pending-offer/",
  "from './application/use-cases/session/pause-session-pending-offer-flow'",
  "from '../application/use-cases/session/pause-session-pending-offer-flow'",
  '@/features/pause/application/use-cases/ritual/reflect/pending-offer/run-adopt-pending-pause-offer',
  '@/features/pause/application/use-cases/ritual/reflect/pending-offer/run-decline-pending-pause-offer',
  '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pending-pause-offer-display',
  '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-rpc-flow',
  '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-pending-offer-display-flow',
  "from './application/use-cases/ritual/reflect/pending-offer/run-adopt-pending-pause-offer'",
  "from '../application/use-cases/ritual/reflect/pending-offer/run-adopt-pending-pause-offer'",
  "from './application/use-cases/ritual/reflect/pending-offer/run-decline-pending-pause-offer'",
  "from '../application/use-cases/ritual/reflect/pending-offer/run-decline-pending-pause-offer'",
  "from './application/use-cases/ritual/reflect/pending-offer/pending-pause-offer-display'",
  "from '../application/use-cases/ritual/reflect/pending-offer/pending-pause-offer-display'",
  "from './application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-rpc-flow'",
  "from '../application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-rpc-flow'",
  "from './application/use-cases/ritual/reflect/pending-offer/pause-pending-offer-display-flow'",
  "from '../application/use-cases/ritual/reflect/pending-offer/pause-pending-offer-display-flow'",
];

/** Ritual done presentation — post-pause emotion log via pause-ritual-done-flow (done-io only). */
const LEGACY_PAUSE_PRESENTATION_RITUAL_DONE_USE_CASE_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/done/post-pause-emotion-log',
  "from './application/use-cases/ritual/done/post-pause-emotion-log'",
  "from '../application/use-cases/ritual/done/post-pause-emotion-log'",
];

/** public-home — pending-offer display copy via pause-reflect-pending-offer-io only. */
const LEGACY_PAUSE_PUBLIC_HOME_PENDING_OFFER_DISPLAY_IMPORTS = [
  '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-flow',
  '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pending-pause-offer-display',
  "from './application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-flow'",
  "from '../application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-flow'",
  "from './application/use-cases/ritual/reflect/pending-offer/pending-pause-offer-display'",
  "from '../application/use-cases/ritual/reflect/pending-offer/pending-pause-offer-display'",
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
  for (const needle of LEGACY_PAUSE_APPLICATION_REFLECT_SHARE_SESSION_TELEMETRY_IMPORTS) {
    if (text.includes(needle)) {
      failures.push(`${rel}: legacy application reflect share session telemetry import (${needle})`);
    }
  }
  for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_IMPORTS) {
    if (text.includes(needle)) {
      failures.push(`${rel}: legacy flat presentation/reflect import (${needle})`);
    }
  }
  if (
    rel.startsWith('src/features/pause/presentation/reflect/generation/') &&
    !rel.includes('/generation/manual-open/')
  ) {
    if (
      !rel.endsWith('pause-reflect-generation-io.ts') &&
      !rel.endsWith('pause-reflect-generation-io.test.ts') &&
      !rel.endsWith('pause-reflect-generation-io.re-exports.test.ts')
    ) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_GENERATION_HOOK_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy reflect generation hook import (${needle})`);
        }
      }
      for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_GENERATION_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy reflect generation import (${needle})`);
        }
      }
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
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_GENERATION_MANUAL_OPEN_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: legacy reflect manual-open generation import (${needle})`);
      }
    }
  }
  if (
    rel.endsWith('pause-home-reflect-telemetry-io.ts') ||
    rel.endsWith('pause-home-reflect-telemetry-io.test.ts')
  ) {
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_MANUAL_OPEN_TELEMETRY_IO_HOME_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: manual-open telemetry I/O must import home/manual-open telemetry leaf modules directly (${needle})`,
        );
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_MANUAL_OPEN_TELEMETRY_IO_GENERATION_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: manual-open telemetry I/O must not import generation umbrella (${needle})`,
        );
      }
    }
  }
  if (
    rel.endsWith('pause-home-reflect-io.ts') ||
    rel.endsWith('pause-home-reflect-io.test.ts') ||
    rel.endsWith('pause-home-reflect-io.re-exports.test.ts')
  ) {
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_MANUAL_OPEN_IO_GENERATION_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: manual-open reflect I/O must not import generation umbrella (${needle})`,
        );
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_MANUAL_OPEN_IO_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: manual-open reflect I/O must import manual-open sibling modules directly (${needle})`,
        );
      }
    }
  }
  if (
    rel.endsWith('pause-reflect-telemetry-io.ts') ||
    rel.endsWith('pause-reflect-telemetry-io.test.ts')
  ) {
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_SHARE_TELEMETRY_IO_TELEMETRY_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect telemetry I/O must import pause-reflect-session-ui-telemetry directly (${needle})`,
        );
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_SHARE_TELEMETRY_IO_SHARE_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect telemetry I/O must not import share umbrella (${needle})`,
        );
      }
    }
  }
  if (
    rel.endsWith('pause-reflect-pending-offer-telemetry-io.ts') ||
    rel.endsWith('pause-reflect-pending-offer-telemetry-io.test.ts')
  ) {
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_PENDING_OFFER_TELEMETRY_IO_TELEMETRY_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: pending-offer telemetry I/O must import telemetry leaf modules directly (${needle})`,
        );
      }
    }
    for (const needle of LEGACY_PAUSE_REFLECT_PENDING_OFFER_TELEMETRY_PATH_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: pending-offer telemetry I/O must import telemetry/ leaf modules (${needle})`,
        );
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_PENDING_OFFER_IO_UMBRELLA_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: pending-offer telemetry I/O must not import pending-offer umbrella (${needle})`,
        );
      }
    }
  }
  if (
    rel.endsWith('pause-reflect-share-io.ts') ||
    rel.endsWith('pause-reflect-share-io.test.ts') ||
    rel.endsWith('pause-reflect-share-io.re-exports.test.ts')
  ) {
    if (!rel.endsWith('pause-reflect-share-io.re-exports.test.ts')) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_SHARE_IO_ORCHESTRATION_FLOW_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(
            `${rel}: reflect share I/O must not import share umbrella (${needle})`,
          );
        }
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_SHARE_IO_IMAGE_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect share I/O must import run-reflection-share-image directly (${needle})`,
        );
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_SHARE_IO_TEXT_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect share I/O must import domain reflection-share-text directly (${needle})`,
        );
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_SHARE_IO_CHANNEL_URLS_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect share I/O must import domain reflection-share-channel-urls directly (${needle})`,
        );
      }
    }
  }
  if (
    rel.endsWith('pause-reflect-generation-io.ts') ||
    rel.endsWith('pause-reflect-generation-io.test.ts') ||
    rel.endsWith('pause-reflect-generation-io.re-exports.test.ts')
  ) {
    if (
      !rel.endsWith('pause-reflect-generation-io.re-exports.test.ts')
    ) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_GENERATION_IO_GENERATION_FLOW_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(
            `${rel}: holzen-reflect generation I/O must not import generation umbrella (${needle})`,
          );
        }
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_GENERATION_IO_HOOK_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: holzen-reflect generation I/O must import domain + run-reflect-generation directly (${needle})`,
        );
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_GENERATION_IO_HOOK_FLOW_BUNDLE_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: holzen-reflect generation I/O must import domain hook leaf modules directly (${needle})`,
        );
      }
    }
  }
  if (
    rel.endsWith('pause-session-decide-io.ts') ||
    rel.endsWith('pause-session-decide-io.test.ts')
  ) {
    for (const needle of LEGACY_PAUSE_SESSION_DECIDE_IO_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: session decide I/O must import PauseImpactData from domain/pause-impact-data (${needle})`,
        );
      }
    }
  }
  if (
    rel.endsWith('pause-archive-io.ts') ||
    rel.endsWith('pause-archive-io.test.ts') ||
    rel.endsWith('pause-archive-io.re-exports.test.ts')
  ) {
    if (!rel.endsWith('pause-archive-io.re-exports.test.ts')) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_ARCHIVE_IO_UMBRELLA_FLOW_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(
            `${rel}: archive decide I/O must not import archive decide umbrella (${needle})`,
          );
        }
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_ARCHIVE_IO_SUBCLUSTER_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: archive decide I/O must import ritual/decide leaf modules directly (${needle})`,
        );
      }
    }
  }
  if (
    rel.startsWith('src/features/pause/presentation/archive/') &&
    !rel.endsWith('pause-archive-io.ts') &&
    !rel.endsWith('pause-archive-io.test.ts') &&
    !rel.endsWith('pause-archive-io.re-exports.test.ts')
  ) {
    for (const needle of LEGACY_PAUSE_PRESENTATION_ARCHIVE_DECIDE_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: legacy archive decide import (${needle})`);
      }
    }
  }
  if (
    rel.startsWith('src/features/pause/presentation/ritual/done/') &&
    !rel.endsWith('-io.ts') &&
    !rel.endsWith('-io.test.ts')
  ) {
    for (const needle of LEGACY_PAUSE_PRESENTATION_RITUAL_DONE_USE_CASE_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: legacy ritual done use-case import (${needle})`);
      }
    }
  }
  if (
    rel.endsWith('pause-ritual-done-io.ts') ||
    rel.endsWith('pause-ritual-done-io.test.ts') ||
    rel.endsWith('pause-ritual-done-io.re-exports.test.ts')
  ) {
    for (const needle of LEGACY_PAUSE_PRESENTATION_RITUAL_DONE_IO_UMBRELLA_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: ritual done I/O must not import ritual done umbrella (${needle})`,
        );
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_RITUAL_DONE_IO_SUBCLUSTER_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: ritual done I/O must import post-pause-emotion-log leaf directly (${needle})`,
        );
      }
    }
  }
  if (rel === 'src/features/pause/application/use-cases/ritual/reflect/mood/pause-reflect-mood-flow.ts') {
    for (const needle of LEGACY_PAUSE_REFLECT_MOOD_FLOW_SUBCLUSTER_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect mood umbrella flow must import domain + run-initial-emotion-log directly (${needle})`,
        );
      }
    }
  }
  if (rel === 'src/features/pause/application/use-cases/ritual/reflect/hub/pause-reflect-hub-flow.ts') {
    for (const needle of LEGACY_PAUSE_REFLECT_HUB_FLOW_SUBCLUSTER_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect hub umbrella flow must import domain + run-shift-emotion-frame-hub-done directly (${needle})`,
        );
      }
    }
  }
  if (rel === 'src/features/pause/application/use-cases/ritual/reflect/steps/pause-reflect-steps-flow.ts') {
    for (const needle of LEGACY_PAUSE_REFLECT_STEPS_FLOW_SUBCLUSTER_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect steps umbrella flow must import domain + run-* leaf modules directly (${needle})`,
        );
      }
    }
  }
  if (rel === 'src/features/pause/application/use-cases/ritual/breathe/pause-session-breath-flow.ts') {
    for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_SEGMENT_LOG_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: session breath umbrella flow must compose pause-run-breath-segment-log-flow subcluster (${needle})`,
        );
      }
    }
  }
  if (rel === 'src/features/pause/application/use-cases/ritual/done/pause-ritual-done-flow.ts') {
    for (const needle of [
      '@/features/pause/application/use-cases/ritual/done/post-pause-emotion-log',
      "from './post-pause-emotion-log'",
      "from '../post-pause-emotion-log'",
    ]) {
      if (text.includes(needle)) {
        failures.push(`${rel}: ritual done umbrella flow must compose subcluster anchors (${needle})`);
      }
    }
  }
  if (rel === 'src/features/pause/application/use-cases/ritual/decide/pause-archive-decide-flow.ts') {
    for (const needle of LEGACY_PAUSE_ARCHIVE_DECIDE_FLOW_LEAF_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: archive decide umbrella flow must compose RPC + telemetry subclusters (${needle})`,
        );
      }
    }
  }
  if (rel === 'src/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-flow.ts') {
    for (const needle of LEGACY_PAUSE_REFLECT_SHARE_FLOW_SUBCLUSTER_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect share umbrella flow must import domain + leaf modules directly (${needle})`,
        );
      }
    }
  }
  if (
    rel ===
    'src/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-orchestration-flow.ts'
  ) {
    for (const needle of LEGACY_PAUSE_REFLECT_SHARE_ORCHESTRATION_FLOW_SUBCLUSTER_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect share orchestration umbrella flow must import leaf modules directly (${needle})`,
        );
      }
    }
  }
  if (
    rel === 'src/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-flow.ts'
  ) {
    for (const needle of LEGACY_PAUSE_COMPANION_ORCHESTRATE_FLOW_SUBCLUSTER_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: companion orchestrate umbrella flow must import leaf modules directly (${needle})`,
        );
      }
    }
  }
  if (rel === 'src/features/pause/application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow.ts') {
    for (const needle of LEGACY_PAUSE_REFLECT_GENERATION_FLOW_SUBCLUSTER_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect generation umbrella flow must import domain + leaf modules directly (${needle})`,
        );
      }
    }
    for (const needle of LEGACY_PAUSE_REFLECT_GENERATION_FLOW_TELEMETRY_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: reflect generation umbrella flow must not compose PostHog (${needle})`);
      }
    }
  }
  if (rel === 'src/features/pause/application/use-cases/ritual/reflect/hub/pause-shift-emotion-frame-hub-done-flow.ts') {
    for (const needle of LEGACY_PAUSE_REFLECT_HUB_FLOW_DOMAIN_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: reflect hub done-flow must not import domain/reflect/hub (${needle})`);
      }
    }
  }
  if (rel === 'src/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow.ts') {
    for (const needle of LEGACY_PAUSE_REFLECT_FLOWS_FLOW_SUBCLUSTER_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect flows umbrella flow must import domain + ritual/decide leaf modules directly (${needle})`,
        );
      }
    }
  }
  if (rel === 'src/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-view-flow.ts') {
    for (const needle of LEGACY_PAUSE_DECIDE_APPLICATION_IMPACT_TYPE_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: decide outcome view flow must import PauseImpactData via decide/impact-data (${needle})`);
      }
    }
  }
  if (
    rel.startsWith('src/features/pause/application/use-cases/ritual/decide/') &&
    !rel.endsWith('impact-data.ts') &&
    !rel.endsWith('.test.ts')
  ) {
    for (const needle of LEGACY_PAUSE_DECIDE_APPLICATION_IMPACT_TYPE_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: decide application must import PauseImpactData via impact-data (${needle})`);
      }
    }
  }
  if (rel === 'src/features/pause/public-hooks.ts') {
    for (const needle of LEGACY_PAUSE_PUBLIC_HOOKS_SCORE_IMPACT_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: public-hooks score impact must import public-ritual-reflect (${needle})`);
      }
    }
    for (const needle of LEGACY_PAUSE_PUBLIC_HOOKS_IMPACT_TYPE_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: public-hooks PauseImpactData must export domain/pause-impact-data (${needle})`);
      }
    }
  }
  if (rel === 'src/features/pause/application/use-cases/session/step-bundle-types.ts') {
    for (const needle of LEGACY_PAUSE_SESSION_APPLICATION_DECIDE_FLOW_IMPACT_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: session step bundles must import PauseImpactData from domain/pause-impact-data (${needle})`,
        );
      }
    }
  }
  if (rel.startsWith('src/screens/')) {
    for (const needle of LEGACY_PAUSE_SCREEN_SCORE_IMPACT_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: pause score impact must import public-ritual-reflect (${needle})`);
      }
    }
    if (text.includes('buildPauseScoreImpacts')) {
      for (const needle of LEGACY_PAUSE_SCREEN_SCORE_IMPACT_PUBLIC_HOOKS_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(
            `${rel}: ScoreImpact builders must import public-ritual-reflect, not public-hooks (${needle})`,
          );
        }
      }
    }
  }
  if (rel === 'src/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-flow.ts') {
    for (const needle of LEGACY_PAUSE_REFLECT_PENDING_OFFER_TELEMETRY_PATH_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect pending-offer umbrella flow must not import legacy pending-offer/ telemetry paths (${needle})`,
        );
      }
    }
    for (const needle of LEGACY_PAUSE_REFLECT_PENDING_OFFER_FLOW_SUBCLUSTER_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect pending-offer umbrella flow must import leaf modules directly (${needle})`,
        );
      }
    }
  }
  if (rel === 'src/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-rpc-flow.ts') {
    for (const needle of [
      "from './pending-pause-offer-display'",
      "from '../pending-pause-offer-display'",
      "from './pause-pending-offer-display-flow'",
      "from '../pause-pending-offer-display-flow'",
    ]) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect pending-offer RPC flow must not import display leaf or subcluster (${needle})`,
        );
      }
    }
  }
  if (rel === 'src/features/pause/application/use-cases/ritual/reflect/telemetry/pause-pending-offer-telemetry-flow.ts') {
    for (const needle of LEGACY_PAUSE_REFLECT_PENDING_OFFER_TELEMETRY_PATH_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: pending-offer telemetry flow must not import legacy pending-offer/ paths (${needle})`,
        );
      }
    }
  }
  if (rel === 'src/features/pause/public-home.ts') {
    for (const needle of LEGACY_PAUSE_PUBLIC_HOME_PENDING_OFFER_DISPLAY_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: pending-offer display must import via pause-reflect-pending-offer-io (${needle})`,
        );
      }
    }
  }
  if (rel === 'src/features/pause/application/use-cases/session/pause-session-ritual-restore-flow.ts') {
    for (const needle of LEGACY_PAUSE_SESSION_RITUAL_RESTORE_BREATH_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: session ritual restore must import breath hydration via restored-breath-ritual-state (${needle})`);
      }
    }
    for (const needle of LEGACY_PAUSE_SESSION_RITUAL_RESTORE_BRIEF_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: session ritual restore must import brief hydration via restored-brief-ritual-state (${needle})`);
      }
    }
  }
  if (
    rel.endsWith('pause-reflect-mood-io.ts') ||
    rel.endsWith('pause-reflect-mood-io.test.ts') ||
    rel.endsWith('pause-reflect-mood-io.re-exports.test.ts')
  ) {
    if (!rel.endsWith('pause-reflect-mood-io.re-exports.test.ts')) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_MOOD_IO_UMBRELLA_FLOW_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(
            `${rel}: reflect mood I/O must not import mood umbrella (${needle})`,
          );
        }
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_MOOD_IO_SUBCLUSTER_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect mood I/O must import domain mood helpers + run-initial-emotion-log directly (${needle})`,
        );
      }
    }
  }
  if (rel.startsWith('src/features/pause/presentation/reflect/mood/')) {
    if (
      !rel.endsWith('pause-reflect-mood-io.ts') &&
      !rel.endsWith('pause-reflect-mood-io.test.ts') &&
      !rel.endsWith('pause-reflect-mood-io.re-exports.test.ts')
    ) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_MOOD_DOMAIN_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy reflect mood import (${needle})`);
        }
      }
    }
  }
  if (
    rel.endsWith('pause-ritual-done-io.ts') ||
    rel.endsWith('pause-ritual-done-io.test.ts') ||
    rel.endsWith('pause-ritual-done-io.re-exports.test.ts')
  ) {
    for (const needle of LEGACY_PAUSE_PRESENTATION_RITUAL_DONE_IO_UMBRELLA_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: ritual done I/O must not import ritual done umbrella (${needle})`,
        );
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_RITUAL_DONE_IO_SUBCLUSTER_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: ritual done I/O must import post-pause-emotion-log leaf directly (${needle})`,
        );
      }
    }
  }
  if (rel.startsWith('src/features/pause/presentation/ritual/done/')) {
    if (
      !rel.endsWith('pause-ritual-done-io.ts') &&
      !rel.endsWith('pause-ritual-done-io.test.ts') &&
      !rel.endsWith('pause-ritual-done-io.re-exports.test.ts')
    ) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_RITUAL_DONE_DOMAIN_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy ritual done import (${needle})`);
        }
      }
      for (const needle of LEGACY_PAUSE_PRESENTATION_RITUAL_DONE_IO_USE_CASE_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy ritual done import (${needle})`);
        }
      }
    }
  }
  if (
    rel.endsWith('pause-reflect-hub-io.ts') ||
    rel.endsWith('pause-reflect-hub-io.test.ts')
  ) {
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_HUB_IO_UMBRELLA_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect hub I/O must not import hub umbrella (${needle})`,
        );
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_HUB_IO_DONE_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect hub I/O must import run-shift-emotion-frame-hub-done directly (${needle})`,
        );
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_HUB_IO_PRESENTATION_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect hub I/O must import domain shift-frame-hub-done-presentation directly (${needle})`,
        );
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_HUB_IO_LOG_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect hub I/O must import domain shift-emotion-log directly (${needle})`,
        );
      }
    }
  }
  if (rel.startsWith('src/features/pause/presentation/reflect/hub/')) {
    if (
      !rel.endsWith('pause-reflect-hub-io.ts') &&
      !rel.endsWith('pause-reflect-hub-io.test.ts') &&
      !rel.endsWith('pause-reflect-hub-io.re-exports.test.ts')
    ) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_HUB_DOMAIN_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy reflect hub import (${needle})`);
        }
      }
    }
  }
  if (
    rel.endsWith('pause-reflect-steps-io.ts') ||
    rel.endsWith('pause-reflect-steps-io.test.ts') ||
    rel.endsWith('pause-reflect-steps-io.re-exports.test.ts')
  ) {
    if (!rel.endsWith('pause-reflect-steps-io.re-exports.test.ts')) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_STEPS_IO_UMBRELLA_FLOW_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(
            `${rel}: reflect steps I/O must not import steps umbrella (${needle})`,
          );
        }
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_STEPS_IO_FAVORITE_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect steps I/O must import run-pause-favorite-toggle and domain favorite-toggle directly (${needle})`,
        );
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_STEPS_IO_NOTE_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect steps I/O must import run-pause-reflect-note-update directly (${needle})`,
        );
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_STEPS_IO_TAG_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect steps I/O must import run-pause-reflect-tag-update directly (${needle})`,
        );
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_STEPS_IO_REFLECTION_STEP_LOG_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect steps I/O must import run-pause-reflection-step-log and domain reflection-step-log directly (${needle})`,
        );
      }
    }
  }
  if (rel.startsWith('src/features/pause/presentation/reflect/steps/')) {
    if (
      !rel.endsWith('pause-reflect-steps-io.ts') &&
      !rel.endsWith('pause-reflect-steps-io.test.ts') &&
      !rel.endsWith('pause-reflect-steps-io.re-exports.test.ts')
    ) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_STEPS_DOMAIN_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy reflect steps import (${needle})`);
        }
      }
    }
  }
  if (rel.startsWith('src/features/pause/presentation/reflect/ambience/')) {
    const ambienceIoAllowlisted =
      rel.endsWith('pause-reflect-ambience-io.ts') ||
      rel.endsWith('pause-reflect-ambience-io.test.ts') ||
      rel.endsWith('pause-reflect-ambience-io.re-exports.test.ts');
    if (!ambienceIoAllowlisted) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_AMBIENCE_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy reflect ambience import (${needle})`);
        }
      }
    }
  }
  if (
    rel.endsWith('pause-reflect-ambience-io.ts') ||
    rel.endsWith('pause-reflect-ambience-io.test.ts') ||
    rel.endsWith('pause-reflect-ambience-io.re-exports.test.ts')
  ) {
    if (!rel.endsWith('pause-reflect-ambience-io.re-exports.test.ts')) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_AMBIENCE_IO_FLOW_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(
            `${rel}: reflect ambience I/O must import domain reflect-frame-focus-ambience directly (${needle})`,
          );
        }
      }
    }
  }
  if (rel.startsWith('src/features/pause/presentation/reflect/share/')) {
    const shareIoAllowlisted =
      rel.endsWith('pause-reflect-share-io.ts') ||
      rel.endsWith('pause-reflect-share-io.test.ts') ||
      rel.endsWith('pause-reflect-share-io.re-exports.test.ts');
    if (!shareIoAllowlisted) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_SHARE_DOMAIN_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy reflect share import (${needle})`);
        }
      }
      for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_SHARE_TELEMETRY_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy reflect share telemetry import (${needle})`);
        }
      }
    }
  }
  if (
    rel.endsWith('pause-companion-orchestration-io.ts') ||
    rel.endsWith('pause-companion-orchestration-io.test.ts') ||
    rel.endsWith('pause-companion-orchestration-io.re-exports.test.ts')
  ) {
    if (!rel.endsWith('pause-companion-orchestration-io.re-exports.test.ts')) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_COMPANION_ORCHESTRATION_IO_UMBRELLA_FLOW_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(
            `${rel}: companion orchestration I/O must not import orchestration umbrella (${needle})`,
          );
        }
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_COMPANION_ORCHESTRATION_IO_SUBCLUSTER_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: companion orchestration I/O must import ritual/frame leaf modules directly (${needle})`,
        );
      }
    }
  }
  if (
    rel.endsWith('pause-companion-orchestrate-io.ts') ||
    rel.endsWith('pause-companion-orchestrate-io.test.ts') ||
    rel.endsWith('pause-companion-orchestrate-io.re-exports.test.ts')
  ) {
    if (!rel.endsWith('pause-companion-orchestrate-io.re-exports.test.ts')) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_COMPANION_ORCHESTRATE_IO_UMBRELLA_FLOW_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(
            `${rel}: companion orchestrate I/O must not import orchestrate umbrella (${needle})`,
          );
        }
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_COMPANION_ORCHESTRATE_IO_SUBCLUSTER_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: companion orchestrate I/O must import ritual/frame leaf modules directly (${needle})`,
        );
      }
    }
  }
  if (
    rel.endsWith('pause-companion-frame-ui-io.ts') ||
    rel.endsWith('pause-companion-frame-ui-io.test.ts') ||
    rel.endsWith('pause-companion-frame-ui-io.re-exports.test.ts')
  ) {
    if (!rel.endsWith('pause-companion-frame-ui-io.re-exports.test.ts')) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_COMPANION_FRAME_UI_IO_UMBRELLA_FLOW_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(
            `${rel}: companion frame UI I/O must not import frame UI umbrella (${needle})`,
          );
        }
      }
      for (const needle of LEGACY_PAUSE_PRESENTATION_COMPANION_FRAME_UI_IO_SUBCLUSTER_FLOW_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(
            `${rel}: companion frame UI I/O must import ritual/frame leaf modules directly (${needle})`,
          );
        }
      }
    }
  }
  if (rel === 'src/features/pause/application/use-cases/ritual/frame/pause-companion-frame-ui-flow.ts') {
    for (const needle of LEGACY_PAUSE_COMPANION_FRAME_UI_FLOW_SUBCLUSTER_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: companion frame UI umbrella flow must import leaf modules directly (${needle})`,
        );
      }
    }
  }
  if (rel === 'src/features/pause/application/use-cases/ritual/frame/pause-companion-orchestration-flow.ts') {
    for (const needle of LEGACY_PAUSE_COMPANION_ORCHESTRATION_FLOW_SUBCLUSTER_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: companion orchestration umbrella flow must import leaf modules directly (${needle})`,
        );
      }
    }
  }
  if (rel.startsWith('src/features/pause/presentation/companion/')) {
    if (
      !rel.endsWith('pause-companion-orchestration-io.ts') &&
      !rel.endsWith('pause-companion-orchestration-io.test.ts') &&
      !rel.endsWith('pause-companion-orchestration-io.re-exports.test.ts') &&
      !rel.endsWith('pause-companion-orchestrate-io.ts') &&
      !rel.endsWith('pause-companion-orchestrate-io.test.ts') &&
      !rel.endsWith('pause-companion-orchestrate-io.re-exports.test.ts') &&
      !rel.endsWith('pause-companion-analytics-io.ts') &&
      !rel.endsWith('pause-companion-analytics-io.test.ts') &&
      !rel.endsWith('pause-companion-analytics-io.re-exports.test.ts') &&
      !rel.endsWith('pause-companion-frame-ui-io.ts') &&
      !rel.endsWith('pause-companion-frame-ui-io.test.ts') &&
      !rel.endsWith('pause-companion-frame-ui-io.re-exports.test.ts')
    ) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_COMPANION_ORCHESTRATION_DOMAIN_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy companion orchestration import (${needle})`);
        }
      }
      for (const needle of LEGACY_PAUSE_PRESENTATION_COMPANION_FRAME_UI_DOMAIN_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy companion frame UI import (${needle})`);
        }
      }
    }
  }
  if (
    rel.endsWith('pause-reflect-flows-io.ts') ||
    rel.endsWith('pause-reflect-flows-io.test.ts') ||
    rel.endsWith('pause-reflect-flows-io.re-exports.test.ts')
  ) {
    for (const needle of LEGACY_PAUSE_REFLECT_FLOWS_IO_DECIDE_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect flows I/O must import PauseImpactData via pause-session-decide-io (${needle})`,
        );
      }
    }
    if (!rel.endsWith('pause-reflect-flows-io.re-exports.test.ts')) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_FLOWS_IO_UMBRELLA_FLOW_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(
            `${rel}: reflect flows I/O must not import flows umbrella (${needle})`,
          );
        }
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_FLOWS_IO_SCORE_IMPACTS_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect flows I/O must import score impacts via score-impacts + score-impact-presentation (${needle})`,
        );
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_FLOWS_IO_SUBCLUSTER_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: reflect flows I/O must import domain/decide leaf modules directly (${needle})`,
        );
      }
    }
  }
  if (rel.startsWith('src/features/pause/presentation/reflect/flows/')) {
    if (
      rel.endsWith('-types.ts') ||
      rel.endsWith('-handler-types.ts')
    ) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_FLOWS_IMPACT_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: reflect flows impact type must use pause-session-decide-io (${needle})`);
        }
      }
    }
    if (
      !rel.endsWith('pause-reflect-flows-io.ts') &&
      !rel.endsWith('pause-reflect-flows-io.test.ts') &&
      !rel.endsWith('pause-reflect-flows-io.re-exports.test.ts')
    ) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_FLOWS_DOMAIN_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy reflect flows import (${needle})`);
        }
      }
    }
  }
  if (
    rel.endsWith('pause-session-breath-io.ts') ||
    rel.endsWith('pause-session-breath-io.test.ts') ||
    rel.endsWith('pause-session-breath-io.re-exports.test.ts')
  ) {
    for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_IO_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: session breath I/O must import via ritual/breathe sibling modules (${needle})`,
        );
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_IO_AUDIO_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: session breath I/O must import ritual-audio directly (${needle})`,
        );
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_IO_SEGMENT_LOG_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: session breath I/O must import run-breath-segment-log directly (${needle})`,
        );
      }
    }
  }
  if (rel.startsWith('src/features/pause/presentation/session/breath/')) {
    const breathIoAllowlisted =
      rel.endsWith('pause-session-breath-io.ts') ||
      rel.endsWith('pause-session-breath-io.test.ts') ||
      rel.endsWith('pause-session-breath-io.re-exports.test.ts') ||
      rel.endsWith('pause-session-breath-step-navigation-io.ts') ||
      rel.endsWith('pause-session-breath-step-navigation-io.test.ts');
    if (!breathIoAllowlisted) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_AUDIO_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy session breath ritual-audio import (${needle})`);
        }
      }
    }
    if (!breathIoAllowlisted) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_SEGMENT_LOG_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy session breath segment-log import (${needle})`);
        }
      }
      for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_RPC_FLAGS_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy session breath rpc-flags import (${needle})`);
        }
      }
      for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_STEP_NAV_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy session breath step-navigation import (${needle})`);
        }
      }
      for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_HYDRATION_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy session breath hydration import (${needle})`);
        }
      }
      for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_DOMAIN_AUX_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy session breath domain aux import (${needle})`);
        }
      }
      for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_FLOW_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy session breath-flow import (${needle})`);
        }
      }
    }
    if (
      rel.endsWith('pause-session-breath-step-navigation-io.ts') ||
      rel.endsWith('pause-session-breath-step-navigation-io.test.ts')
    ) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_BREATH_STEP_NAV_IO_FLOW_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(
            `${rel}: session breath step-navigation I/O must import pause-breath-step-navigation domain leaf directly (${needle})`,
          );
        }
      }
    }
  }
  if (rel.startsWith('src/features/pause/presentation/session/')) {
    for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_PENDING_OFFER_CLUSTER_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: legacy session pending-offer cluster import (${needle})`);
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_TELEMETRY_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: legacy session telemetry import (${needle})`);
      }
    }
  }
  if (rel.startsWith('src/features/pause/presentation/reflect/pending-offer/')) {
    const pendingOfferIoAllowlisted =
      rel.endsWith('pause-reflect-pending-offer-io.ts') ||
      rel.endsWith('pause-reflect-pending-offer-io.test.ts') ||
      rel.endsWith('pause-reflect-pending-offer-io.re-exports.test.ts');
    for (const needle of LEGACY_PAUSE_REFLECT_PENDING_OFFER_TELEMETRY_PATH_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: legacy reflect/pending-offer telemetry import (${needle})`);
      }
    }
    if (!pendingOfferIoAllowlisted) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_PENDING_OFFER_TELEMETRY_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy pending-offer telemetry import (${needle})`);
        }
      }
      for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_PENDING_OFFER_TELEMETRY_SUBCLUSTER_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy pending-offer telemetry subcluster import (${needle})`);
        }
      }
      for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_PENDING_OFFER_RPC_SUBCLUSTER_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy pending-offer RPC subcluster import (${needle})`);
        }
      }
      for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_PENDING_OFFER_DISPLAY_SUBCLUSTER_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy pending-offer display subcluster import (${needle})`);
        }
      }
      for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_PENDING_OFFER_USE_CASE_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy pending-offer use-case import (${needle})`);
        }
      }
    }
    if (
      rel.endsWith('pause-reflect-pending-offer-io.ts') ||
      rel.endsWith('pause-reflect-pending-offer-io.test.ts') ||
      rel.endsWith('pause-reflect-pending-offer-io.re-exports.test.ts')
    ) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_PENDING_OFFER_IO_RPC_FLOW_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(
            `${rel}: pending-offer RPC I/O must import adopt/decline leaf use cases directly (${needle})`,
          );
        }
      }
      for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_PENDING_OFFER_IO_DISPLAY_FLOW_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(
            `${rel}: pending-offer RPC I/O must import display leaf module directly (${needle})`,
          );
        }
      }
      if (!rel.endsWith('pause-reflect-pending-offer-io.re-exports.test.ts')) {
        for (const needle of LEGACY_PAUSE_PRESENTATION_REFLECT_PENDING_OFFER_IO_UMBRELLA_FLOW_IMPORTS) {
          if (text.includes(needle)) {
            failures.push(
              `${rel}: pending-offer RPC I/O must not import pending-offer umbrella (${needle})`,
            );
          }
        }
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
    if (
      rel.endsWith('pause-session-terminal-entry-io.ts') ||
      rel.endsWith('pause-session-terminal-entry-io.test.ts')
    ) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_TERMINAL_ENTRY_IO_FLOW_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(
            `${rel}: session terminal-entry I/O must import terminal-entry-guard directly (${needle})`,
          );
        }
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
    if (
      rel.endsWith('pause-session-step-transition-io.ts') ||
      rel.endsWith('pause-session-step-transition-io.test.ts')
    ) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_STEP_TRANSITION_IO_FLOW_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(
            `${rel}: session step-transition I/O must import step-transition + step-swipe-direction directly (${needle})`,
          );
        }
      }
    }
    if (text.includes('pause-session-shell-io')) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_STEP_TRANSITION_SHELL_IO_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(
            `${rel}: session step-transition via pause-session-shell-io (${needle}) — use pause-session-step-transition-io`,
          );
        }
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_HOLZEN_PROVIDERS_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: legacy session holzen-providers import (${needle})`);
      }
    }
    const persistedTabIoAllowlisted =
      rel.endsWith('pause-persisted-tab-session-io.ts') ||
      rel.endsWith('pause-persisted-tab-session-io.test.ts');
    if (!persistedTabIoAllowlisted) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_PERSISTED_TAB_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy session persisted-tab-session import (${needle})`);
        }
      }
    }
    if (!persistedTabIoAllowlisted) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_PERSISTED_TAB_FLOW_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy session persisted-tab-session-flow import (${needle})`);
        }
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_MAP_PERSISTED_STEP_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: legacy session map-persisted-step import (${needle})`);
      }
    }
    const sessionDecideIoAllowlisted =
      rel.endsWith('pause-session-decide-io.ts') || rel.endsWith('pause-session-decide-io.test.ts');
    if (!sessionDecideIoAllowlisted) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_DECIDE_IMPACT_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy session decide impact import (${needle})`);
        }
      }
    }
    const sessionShellIoAllowlisted =
      rel.endsWith('pause-session-shell-io.ts') ||
      rel.endsWith('pause-session-shell-io.test.ts');
    if (!sessionShellIoAllowlisted) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_SHELL_USE_CASE_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy session shell use-case import (${needle})`);
        }
      }
    }
    const sessionScaffoldIoAllowlisted =
      rel.endsWith('pause-session-scaffold-io.ts') ||
      rel.endsWith('pause-session-scaffold-io.test.ts');
    if (!sessionScaffoldIoAllowlisted) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_SCAFFOLD_USE_CASE_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy session scaffold use-case import (${needle})`);
        }
      }
    }
    const sessionBriefIoAllowlisted =
      rel.endsWith('pause-session-brief-io.ts') ||
      rel.endsWith('pause-session-brief-io.test.ts') ||
      rel.endsWith('pause-session-brief-io.re-exports.test.ts');
    if (!sessionBriefIoAllowlisted) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_BRIEF_USE_CASE_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy session brief use-case import (${needle})`);
        }
      }
    }
    const sessionRitualRestoreIoAllowlisted =
      rel.endsWith('pause-session-ritual-restore-io.ts') ||
      rel.endsWith('pause-session-ritual-restore-io.test.ts') ||
      rel.endsWith('pause-session-ritual-restore-io.re-exports.test.ts') ||
      rel.endsWith('pause-session-breath-io.ts') ||
      rel.endsWith('pause-session-breath-io.test.ts') ||
      rel.endsWith('pause-session-breath-io.re-exports.test.ts') ||
      rel.endsWith('pause-session-frame-io.ts') ||
      rel.endsWith('pause-session-frame-io.test.ts') ||
      rel.endsWith('pause-session-frame-io.re-exports.test.ts');
    if (!sessionRitualRestoreIoAllowlisted) {
      for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_RITUAL_RESTORE_USE_CASE_IMPORTS) {
        if (text.includes(needle)) {
          failures.push(`${rel}: legacy session ritual-restore use-case import (${needle})`);
        }
      }
    }
    for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_DOMAIN_GUARDS_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(`${rel}: legacy session domain guard import (${needle})`);
      }
    }
  }
  if (
    rel.endsWith('pause-session-shell-io.ts') ||
    rel.endsWith('pause-session-shell-io.test.ts')
  ) {
    for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_SHELL_IO_UMBRELLA_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: session shell I/O must import via session subcluster modules (${needle})`,
        );
      }
    }
  }
  if (
    rel.endsWith('pause-session-scaffold-io.ts') ||
    rel.endsWith('pause-session-scaffold-io.test.ts')
  ) {
    for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_SCAFFOLD_IO_UMBRELLA_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: session scaffold I/O must import via session subcluster modules (${needle})`,
        );
      }
    }
  }
  if (
    rel.endsWith('pause-session-brief-io.ts') ||
    rel.endsWith('pause-session-brief-io.test.ts') ||
    rel.endsWith('pause-session-brief-io.re-exports.test.ts')
  ) {
    for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_BRIEF_IO_UMBRELLA_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: session brief I/O must import via session + ritual/brief modules (${needle})`,
        );
      }
    }
  }
  if (
    rel.endsWith('pause-session-frame-io.ts') ||
    rel.endsWith('pause-session-frame-io.test.ts') ||
    rel.endsWith('pause-session-frame-io.re-exports.test.ts')
  ) {
    for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_FRAME_IO_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: session frame I/O must import restored-frame-ritual-state directly (${needle})`,
        );
      }
    }
  }
  if (
    rel.endsWith('pause-session-ritual-restore-io.ts') ||
    rel.endsWith('pause-session-ritual-restore-io.test.ts') ||
    rel.endsWith('pause-session-ritual-restore-io.re-exports.test.ts')
  ) {
    for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_RITUAL_RESTORE_IO_UMBRELLA_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: session ritual-restore I/O must import via session + ritual subcluster modules (${needle})`,
        );
      }
    }
  }
  if (
    rel.endsWith('pause-persisted-tab-session-io.ts') ||
    rel.endsWith('pause-persisted-tab-session-io.test.ts')
  ) {
    for (const needle of LEGACY_PAUSE_PRESENTATION_SESSION_PERSISTED_TAB_IO_FLOW_IMPORTS) {
      if (text.includes(needle)) {
        failures.push(
          `${rel}: persisted tab session I/O must import persisted-tab-session directly (${needle})`,
        );
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

const pausePublicHooksPath = join(root, 'src/features/pause/public-hooks.ts');
if (existsSync(pausePublicHooksPath)) {
  const publicHooksText = readFileSync(pausePublicHooksPath, 'utf8');
  for (const needle of LEGACY_PAUSE_PUBLIC_HOOKS_SCORE_IMPACT_IMPORTS) {
    if (publicHooksText.includes(needle)) {
      failures.push(
        `src/features/pause/public-hooks.ts: score-impact helpers must import via pause-reflect-flows-flow (${needle})`,
      );
    }
  }
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
