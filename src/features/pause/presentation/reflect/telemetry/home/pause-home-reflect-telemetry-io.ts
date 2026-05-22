/**
 * Home manual-open PostHog helpers (manual open + dismiss/banner).
 * Colocated under `presentation/reflect/telemetry/home/` beside application
 * `ritual/reflect/generation/manual-open/` Home PostHog trackers (dismiss/banner + manual trigger).
 * Imports trackers via `pause-home-reflect-telemetry-flow` CI anchor
 * (parity with `pause-reflect-telemetry-io` → share cluster + session telemetry flow).
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
