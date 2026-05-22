/**
 * Home manual-open PostHog helpers (manual open + dismiss/banner).
 * Colocated under `presentation/reflect/generation/manual-open/` beside
 * `pause-home-reflect-io` and application `ritual/reflect/generation/manual-open/` trackers.
 * Imports trackers via `pause-home-reflect-telemetry-flow` CI anchor
 * (parity with `pause-reflect-pending-offer-telemetry-io` → pending-offer telemetry flow).
 */
export {
  markPauseManualStartedHomeOnce,
  trackHomePendingPauseBannerPauseOpened,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
  type OpenPauseStateForAnalytics,
  type PauseDismissAnalyticsSurface,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/pause-home-reflect-telemetry-flow';
