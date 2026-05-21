/**
 * Home manual-open PostHog helpers (manual open + dismiss/banner).
 * Colocated under `presentation/home/manual-open/`.
 * Imports trackers via `pause-home-reflect-telemetry-flow` CI anchor
 * (parity with `pause-reflect-generation-io` → hook-flow anchor).
 */
export {
  markPauseManualStartedHomeOnce,
  trackHomePendingPauseBannerPauseOpened,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
  type OpenPauseStateForAnalytics,
  type PauseDismissAnalyticsSurface,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-home-reflect-telemetry-flow';
