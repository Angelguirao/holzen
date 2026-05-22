/**
 * CI cluster anchor for Home reflect PostHog telemetry (§3 / check:architecture-alignment).
 * Trackers live in `home/home-pause-actions-telemetry.ts` and `manual-open/manual-pause-trigger-telemetry.ts`.
 * Presentation: `presentation/reflect/telemetry/home/pause-home-reflect-telemetry-io.ts` imports through this anchor (off deep telemetry paths).
 */
export {
  trackHomePendingPauseBannerPauseOpened,
  trackPauseOpenDismissed,
  type OpenPauseStateForAnalytics,
  type PauseDismissAnalyticsSurface,
} from './home/home-pause-actions-telemetry';
export {
  markPauseManualStartedHomeOnce,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
} from './manual-open/manual-pause-trigger-telemetry';
