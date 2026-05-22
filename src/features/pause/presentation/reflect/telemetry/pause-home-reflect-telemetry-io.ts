/**
 * Home manual-open PostHog helpers (manual open + dismiss/banner).
 * Colocated under `presentation/reflect/telemetry/` beside session reflect UI telemetry
 * (`pause-reflect-telemetry-io`); application trackers stay in `ritual/reflect/generation/manual-open/`.
 * Imports trackers from leaf modules directly (not generation umbrella or telemetry-flow anchor).
 * Parity pins: `pause-home-reflect-telemetry-io.test.ts`, `pause-home-reflect-telemetry-io.re-exports.test.ts`,
 * `pause-home-reflect-telemetry-io-parity.test.ts` (colocated).
 * Sibling parity: `presentation/reflect/generation/manual-open/pause-reflect-telemetry-home-reflect-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-telemetry-io`;
 * `presentation/reflect/generation/manual-open/pause-home-reflect-telemetry-home-reflect-io-sibling-parity.test.ts` ↔ `pause-home-reflect-io`.
 */
export {
  trackHomePendingPauseBannerPauseOpened,
  trackPauseOpenDismissed,
  type OpenPauseStateForAnalytics,
  type PauseDismissAnalyticsSurface,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/home-pause-actions-telemetry';
export {
  markPauseManualStartedHomeOnce,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/manual-pause-trigger-telemetry';
