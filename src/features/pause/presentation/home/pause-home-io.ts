import { dismissOpenPauseHome } from '@/features/pause/application/use-cases/home/dismiss-open-pause-home';
import {
  buildManualPauseOpenParams,
  type BuildManualPauseOpenParamsInput,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/build-manual-pause-open-params';
import { openManualPauseFromHome } from '@/features/pause/application/use-cases/ritual/reflect/generation/open-manual-pause-from-home';
import type { OpenManualPauseFromHomeResult } from '@/features/pause/application/use-cases/ritual/reflect/generation/open-manual-pause-from-home-types';
import {
  markPauseManualStartedHomeOnce,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  type TrackManualPauseInstanceCreatedPayload,
  type TrackPauseManualCompletedPayload,
} from '@/features/pause/application/use-cases/trigger/manual-pause-trigger-telemetry';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { supabasePauseRepository, supabaseReflectGenerator } from '@/features/pause/public-rpc';
import {
  applyManualPauseOpenResult,
  type ApplyManualPauseOpenResultInput,
  type ManualPauseHomePreviewPorts,
} from './apply-manual-pause-open-result';
<<<<<<< HEAD

export {
  applyManualPauseOpenResult,
  buildManualPauseOpenParams,
  openManualPauseFromHome,
  type ApplyManualPauseOpenResultInput,
  type BuildManualPauseOpenParamsInput,
  type ManualPauseHomePreviewPorts,
=======
export { buildManualPauseOpenParams, openManualPauseFromHome, type BuildManualPauseOpenParamsInput };
export type { OpenManualPauseFromHomeResult };
export {
  markPauseManualStartedHomeOnce,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  type TrackManualPauseInstanceCreatedPayload,
  type TrackPauseManualCompletedPayload,
>>>>>>> efc275e6 (refactor(pause): bind manual-pause telemetry on pause-home-io)
};

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
