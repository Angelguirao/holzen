/**
 * Home manual-open PostHog helpers (manual open + dismiss/banner).
 * Colocated under `presentation/reflect/generation/manual-open/` beside
 * `pause-home-reflect-io` and application `ritual/reflect/generation/manual-open/` trackers.
 * Imports trackers via `pause-reflect-generation-flow` CI anchor
 * (parity with `pause-reflect-telemetry-io` → share umbrella).
 */
export {
  markPauseManualStartedHomeOnce,
  trackHomePendingPauseBannerPauseOpened,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
  type OpenPauseStateForAnalytics,
  type PauseDismissAnalyticsSurface,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow';
