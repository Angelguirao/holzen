import { dismissOpenPauseHome } from '@/features/pause/application/use-cases/home/dismiss-open-pause-home';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { supabasePauseRepository, supabaseReflectGenerator } from '@/features/pause/public-rpc';
export {
  applyManualPauseOpenResult,
  buildManualPauseCreateOrReuseParams,
  buildManualPauseMarketContext,
  buildManualPauseOpenParams,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE,
  openManualPauseFromHome,
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
} from './pause-home-reflect-io';
export {
  markPauseManualStartedHomeOnce,
  trackHomePendingPauseBannerPauseOpened,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
  type OpenPauseStateForAnalytics,
  type PauseDismissAnalyticsSurface,
  type TrackManualPauseInstanceCreatedPayload,
  type TrackPauseManualCompletedPayload,
} from './pause-home-telemetry-io';

/** Default ports for `openManualPauseFromHome` (Home manual trigger). */
export const pauseHomeManualOpenPorts = {
  repository: supabasePauseRepository,
  reflect: supabaseReflectGenerator,
} as const;

/** Default port + use case: clear Home preview and dismiss current pause instance. */
export function pauseDismissOpenPauseHomePreview(ports: {
  hasUser: boolean;
  clearPreview: () => void;
}): ReturnType<typeof dismissOpenPauseHome> {
  return dismissOpenPauseHome(ports.hasUser, {
    clearPreview: ports.clearPreview,
    repository: supabasePauseRepository,
  });
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
