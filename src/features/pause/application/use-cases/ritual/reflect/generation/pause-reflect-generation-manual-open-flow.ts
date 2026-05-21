/**
 * CI cluster anchor for Home manual-open reflect generation (§3 / check:architecture-alignment).
 * Domain builders/types and use cases in sibling modules — re-export for presentation I/O imports.
 */
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
export { dismissOpenPauseHome } from './dismiss-open-pause-home';
export { openManualPauseFromHome } from './open-manual-pause-from-home';
export { runOpenManualPauseSilentModeAfterCreate } from './run-open-manual-pause-silent-mode-after-create';
export { runPersistSilentReflectionStub } from './run-persist-silent-reflection-stub';
