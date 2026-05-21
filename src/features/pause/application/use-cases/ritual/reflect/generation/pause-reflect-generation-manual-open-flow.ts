/**
 * CI cluster anchor for Home manual-open reflect generation (§3 / check:architecture-alignment).
 * Domain builders/types and manual-open use cases live in sibling modules.
 * Presentation: `pause-home-reflect-io.ts` imports through this anchor (off deep domain/manual-open paths).
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
export { shouldNavigateAfterManualTrigger } from '@/features/pause/domain/reflect/generation/should-navigate-after-manual-trigger';
export type {
  TrackManualPauseInstanceCreatedPayload,
  TrackPauseManualCompletedPayload,
} from '@/features/pause/domain/reflect/generation/manual-pause-home-telemetry-types';
export { dismissOpenPauseHome } from './manual-open/dismiss-open-pause-home';
export { openManualPauseFromHome } from './manual-open/open-manual-pause-from-home';
export { runOpenManualPauseSilentModeAfterCreate } from './manual-open/run-open-manual-pause-silent-mode-after-create';
export { runPersistSilentReflectionStub } from './manual-open/run-persist-silent-reflection-stub';
