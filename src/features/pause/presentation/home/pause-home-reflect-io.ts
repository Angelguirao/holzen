/**
 * Home manual-open reflect cluster I/O (use cases, domain builders, dismiss preview, default ports).
 * Conductors import here instead of the aggregate `pause-home-io` barrel when possible.
 */
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { dismissOpenPauseHome } from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/dismiss-open-pause-home';
import {
  pauseDismissCurrent,
  supabasePauseRepository,
  supabaseReflectGenerator,
} from '@/features/pause/public-rpc';

export {
  buildManualPauseCreateOrReuseParams,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE,
  type ManualPauseCreateOrReuseParams,
} from '@/features/pause/domain/reflect/generation/build-manual-pause-create-or-reuse-params';
export {
  buildManualPauseOpenParams,
  type BuildManualPauseOpenParamsInput,
} from '@/features/pause/domain/reflect/generation/build-manual-pause-open-params';
export {
  buildManualPauseMarketContext,
  type ManualPauseMarketContext,
} from '@/features/pause/domain/reflect/generation/build-manual-pause-market-context';
export type {
  OpenManualPauseFromHomeParams,
  OpenManualPauseFromHomePorts,
  OpenManualPauseFromHomeResult,
} from '@/features/pause/domain/reflect/generation/open-manual-pause-from-home-types';
export type {
  PersistSilentReflectionStubInput,
  PersistSilentReflectionStubResult,
} from '@/features/pause/domain/reflect/generation/persist-silent-reflection-stub-types';
export type {
  RunOpenManualPauseSilentModeAfterCreateError,
  RunOpenManualPauseSilentModeAfterCreateInput,
  RunOpenManualPauseSilentModeAfterCreateOpened,
  RunOpenManualPauseSilentModeAfterCreateResult,
} from '@/features/pause/domain/reflect/generation/open-manual-pause-silent-mode-after-create-types';
export { mapManualTriggerStartError } from '@/features/pause/domain/reflect/generation/map-manual-trigger-start-error';
export {
  computeAutoCooldownRemainingMs,
  computeManualCooldownRemainingMs,
} from '@/features/pause/domain/reflect/generation/compute-pause-trigger-cooldowns';
export {
  buildManualTriggerCooldownStorageKey,
  isManualTriggerBlockedByCooldown,
  parseManualTriggerCooldownFromStorageEvent,
  type ManualTriggerCooldownStorageEvent,
} from '@/features/pause/domain/reflect/generation/manual-trigger-cooldown-flow';
export { shouldNavigateAfterManualTrigger } from '@/features/pause/domain/reflect/generation/should-navigate-after-manual-trigger';
export type {
  TrackManualPauseInstanceCreatedPayload,
  TrackPauseManualCompletedPayload,
} from '@/features/pause/domain/reflect/generation/manual-pause-home-telemetry-types';
export { openManualPauseFromHome } from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/open-manual-pause-from-home';
export { runOpenManualPauseSilentModeAfterCreate } from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/run-open-manual-pause-silent-mode-after-create';
export { runPersistSilentReflectionStub } from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/run-persist-silent-reflection-stub';
export {
  readManualTriggerCooldownAtMs,
  writeManualTriggerCooldownAtMs,
} from '@/features/pause/infrastructure/manual-trigger-cooldown-storage';
export {
  applyManualPauseOpenResult,
  type ApplyManualPauseOpenResultInput,
  type ManualPauseHomePreviewPorts,
} from './apply-manual-pause-open-result';

export { dismissOpenPauseHome };

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
