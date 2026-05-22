/**
 * Home manual-open reflect cluster I/O (use cases, domain builders, dismiss preview, default ports).
 * Colocated under `presentation/reflect/generation/manual-open/` (parity with application `generation/manual-open/` cluster).
 * Imports manual-open use cases and domain builders via `pause-reflect-generation-manual-open-flow`
 * CI anchor (parity with `pause-home-reflect-telemetry-io` → leaf telemetry modules, not generation umbrella).
 */
import {
  buildManualPauseCreateOrReuseParams,
  buildManualPauseMarketContext,
  buildManualPauseOpenParams,
  dismissOpenPauseHome,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE,
  openManualPauseFromHome,
  runOpenManualPauseSilentModeAfterCreate,
  runPersistSilentReflectionStub,
  type BuildManualPauseOpenParamsInput,
  type ManualPauseCreateOrReuseParams,
  type ManualPauseMarketContext,
  type OpenManualPauseFromHomeParams,
  type OpenManualPauseFromHomePorts,
  type OpenManualPauseFromHomeResult,
  type PersistSilentReflectionStubInput,
  type PersistSilentReflectionStubResult,
  type RunOpenManualPauseSilentModeAfterCreateError,
  type RunOpenManualPauseSilentModeAfterCreateInput,
  type RunOpenManualPauseSilentModeAfterCreateOpened,
  type RunOpenManualPauseSilentModeAfterCreateResult,
  type TrackManualPauseInstanceCreatedPayload,
  type TrackPauseManualCompletedPayload,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/pause-reflect-generation-manual-open-flow';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import {
  supabasePauseRepository,
  supabaseReflectGenerator,
} from '@/features/pause/public-rpc';

export {
  buildManualPauseCreateOrReuseParams,
  buildManualPauseMarketContext,
  buildManualPauseOpenParams,
  dismissOpenPauseHome,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE,
  openManualPauseFromHome,
  runOpenManualPauseSilentModeAfterCreate,
  runPersistSilentReflectionStub,
  type BuildManualPauseOpenParamsInput,
  type ManualPauseCreateOrReuseParams,
  type ManualPauseMarketContext,
  type OpenManualPauseFromHomeParams,
  type OpenManualPauseFromHomePorts,
  type OpenManualPauseFromHomeResult,
  type PersistSilentReflectionStubInput,
  type PersistSilentReflectionStubResult,
  type RunOpenManualPauseSilentModeAfterCreateError,
  type RunOpenManualPauseSilentModeAfterCreateInput,
  type RunOpenManualPauseSilentModeAfterCreateOpened,
  type RunOpenManualPauseSilentModeAfterCreateResult,
  type TrackManualPauseInstanceCreatedPayload,
  type TrackPauseManualCompletedPayload,
};
export {
  applyManualPauseOpenResult,
  type ApplyManualPauseOpenResultInput,
  type ManualPauseHomePreviewPorts,
} from './apply-manual-pause-open-result';

/** Default ports for `openManualPauseFromHome` (Home manual trigger). */
export const pauseHomeManualOpenPorts = {
  repository: supabasePauseRepository,
  reflect: supabaseReflectGenerator,
} as const;

/** Default facade: clear Home preview and dismiss current pause instance. */
export async function pauseDismissOpenPauseHomePreview(ports: {
  hasUser: boolean;
  clearPreview: () => void;
}): Promise<void> {
  return dismissOpenPauseHome(ports.hasUser, {
    clearPreview: ports.clearPreview,
    repository: pauseHomeManualOpenPorts.repository,
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
