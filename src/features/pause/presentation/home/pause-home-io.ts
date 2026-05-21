import { dismissOpenPauseHome } from '@/features/pause/application/use-cases/home/dismiss-open-pause-home';
import {
  buildManualPauseOpenParams,
  type BuildManualPauseOpenParamsInput,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/build-manual-pause-open-params';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { supabasePauseRepository, supabaseReflectGenerator } from '@/features/pause/public-rpc';

export { buildManualPauseOpenParams, type BuildManualPauseOpenParamsInput };

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
