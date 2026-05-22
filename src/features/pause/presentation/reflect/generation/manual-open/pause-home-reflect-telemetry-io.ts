/**
 * Home manual-open PostHog helpers (manual open + dismiss/banner).
 * Colocated under `presentation/reflect/generation/manual-open/` beside
 * `pause-home-reflect-io` and application `ritual/reflect/generation/manual-open/` trackers.
 * Imports trackers from leaf modules directly (parity with
 * `pause-reflect-telemetry-io` → `pause-reflect-session-ui-telemetry`; not generation umbrella or telemetry-flow anchor).
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
