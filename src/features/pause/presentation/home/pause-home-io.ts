import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { pauseDismissCurrent } from '@/features/pause/public-rpc';
export {
  applyManualPauseOpenResult,
  dismissOpenPauseHome,
  pauseHomeManualOpenPorts,
  buildManualPauseCreateOrReuseParams,
  buildManualPauseMarketContext,
  buildManualPauseOpenParams,
  mapManualTriggerStartError,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE,
  openManualPauseFromHome,
  shouldNavigateAfterManualTrigger,
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

/** Default facade: clear Home preview and dismiss current pause instance. */
export async function pauseDismissOpenPauseHomePreview(ports: {
  hasUser: boolean;
  clearPreview: () => void;
}): Promise<void> {
  ports.clearPreview();
  if (!ports.hasUser) return;
  try {
    await pauseDismissCurrent();
  } catch {
    /* non-fatal — preview already cleared locally */
  }
}

/** Test seam: inject a custom `PauseRepository` for Home dismiss. */
export function pauseDismissOpenPauseHomePreviewWithRepository(
  repository: PauseRepository,
  ports: { hasUser: boolean; clearPreview: () => void },
): ReturnType<typeof dismissOpenPauseHome> {
  return dismissOpenPauseHome(ports.hasUser, {
    clearPreview: ports.clearPreview,
    repository,
  });
}
