/**
 * CI cluster anchor for Home manual-open reflect generation (§3 / check:architecture-alignment).
 * Domain builders/types and manual-open use cases live in sibling modules.
 * Presentation: `pause-home-reflect-io.ts` imports sibling modules directly (CI cluster anchor only; not `pause-reflect-generation-flow` umbrella).
 * Parity: `pause-home-reflect-io-parity.test.ts` and `pause-home-reflect-io.re-exports.test.ts` pin presentation ↔ this anchor.
 * Sibling parity: `pause-reflect-generation-manual-open-flow-sibling-parity.test.ts` ↔ `pause-reflect-generation-flow` /
 * `pause-reflect-generation-hook-flow` (holzen-reflect vs manual-open CI anchors).
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
export type {
  TrackManualPauseInstanceCreatedPayload,
  TrackPauseManualCompletedPayload,
} from '@/features/pause/domain/reflect/generation/manual-pause-home-telemetry-types';
export { dismissOpenPauseHome } from './dismiss-open-pause-home';
export { openManualPauseFromHome } from './open-manual-pause-from-home';
export { runOpenManualPauseSilentModeAfterCreate } from './run-open-manual-pause-silent-mode-after-create';
export { runPersistSilentReflectionStub } from './run-persist-silent-reflection-stub';
