/**
 * Home presentation aggregate barrel (manual-open reflect cluster + telemetry + dismiss).
 * Conductors import `pause-home-reflect-io` / `pause-home-reflect-telemetry-io` directly when possible.
 */
export {
  applyManualPauseOpenResult,
  buildManualPauseCreateOrReuseParams,
  buildManualPauseMarketContext,
  buildManualPauseOpenParams,
  dismissOpenPauseHome,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE,
  openManualPauseFromHome,
  pauseDismissOpenPauseHomePreview,
  pauseDismissOpenPauseHomePreviewWithRepository,
  pauseHomeManualOpenPorts,
  type ApplyManualPauseOpenResultInput,
  type BuildManualPauseOpenParamsInput,
  type ManualPauseCreateOrReuseParams,
  type ManualPauseHomePreviewPorts,
  type ManualPauseMarketContext,
  type OpenManualPauseFromHomeParams,
  type OpenManualPauseFromHomePorts,
  type OpenManualPauseFromHomeResult,
  runOpenManualPauseSilentModeAfterCreate,
  runPersistSilentReflectionStub,
  type TrackManualPauseInstanceCreatedPayload,
  type TrackPauseManualCompletedPayload,
} from './pause-home-reflect-io';
export {
  markPauseManualStartedHomeOnce,
  trackHomePendingPauseBannerPauseOpened,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
  type OpenPauseStateForAnalytics,
  type PauseDismissAnalyticsSurface,
} from './pause-home-reflect-telemetry-io';
