/**
 * CI cluster anchor for ritual reflect generation presentation I/O (§3 / check:architecture-alignment).
 * Composes holzen-reflect domain helpers + `run-reflect-generation` + manual-open leaf use cases
 * (not holzen-reflect / manual-open subcluster flow anchors; PostHog stays on telemetry-flow modules).
 * Sibling cluster anchor: `pause-reflect-ambience-flow` (frame-focus bed; presentation via `pause-reflect-ambience-io`).
 * Presentation: `pause-reflect-generation-io.ts` and `pause-home-reflect-io.ts` import leaf modules directly.
 * `pause-reflect-generation-io.re-exports.test.ts` and `pause-reflect-generation-io-parity.test.ts`;
 * sibling pins: `pause-reflect-ambience-flow.test.ts`, `pause-reflect-generation-flow.test.ts` ↔ `pause-reflect-flows-flow.test.ts`.
 * may import this umbrella for parity; production generation I/O keeps leaf imports.
 */
export {
  messageFromReflectGenerationResult,
  resolveReflectGenerationPrefetch,
  shouldClearReflectGenerationLoading,
  shouldCommitReflectGeneration,
  type ReflectGenerationPrefetch,
} from '@/features/pause/domain/reflect/generation/reflect-generation-hook-flow';
export { reflectGenerationPrerequisite } from '@/features/pause/domain/reflect/generation/reflect-generation-prerequisites';
export { reflectGenerationUserErrorMessage } from '@/features/pause/domain/reflect/generation/reflect-generation-errors';
export { resolveEffectiveReflectionCopy } from '@/features/pause/domain/reflect/generation/resolve-effective-reflection-copy';
export { runReflectGeneration, type RunReflectGenerationInput } from './holzen-reflect/run-reflect-generation';
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
export { dismissOpenPauseHome } from './manual-open/dismiss-open-pause-home';
export { openManualPauseFromHome } from './manual-open/open-manual-pause-from-home';
export { runOpenManualPauseSilentModeAfterCreate } from './manual-open/run-open-manual-pause-silent-mode-after-create';
export { runPersistSilentReflectionStub } from './manual-open/run-persist-silent-reflection-stub';
