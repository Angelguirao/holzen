/**
 * @deprecated Import from `presentation/reflect/generation/manual-open/pause-home-reflect-telemetry-io` instead.
 * Re-export shim keeps `presentation/reflect/telemetry/home/` for architecture-alignment CI.
 */
export {
  markPauseManualStartedHomeOnce,
  trackHomePendingPauseBannerPauseOpened,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
  type OpenPauseStateForAnalytics,
  type PauseDismissAnalyticsSurface,
} from '@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-telemetry-io';
