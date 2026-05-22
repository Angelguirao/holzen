/**
 * CI cluster anchor for ritual reflect generation presentation I/O (§3 / check:architecture-alignment).
 * Composes holzen-reflect hook + Home manual-open subcluster (PostHog stays on `pause-home-reflect-telemetry-flow`).
 * Presentation: `pause-reflect-generation-io.ts` imports `pause-reflect-generation-hook-flow`;
 * `pause-home-reflect-io.ts` imports `pause-reflect-generation-manual-open-flow`;
 * `pause-home-reflect-telemetry-io.ts` imports `pause-home-reflect-telemetry-flow`.
 */
export {
  messageFromReflectGenerationResult,
  reflectGenerationPrerequisite,
  reflectGenerationUserErrorMessage,
  resolveEffectiveReflectionCopy,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
  shouldClearReflectGenerationLoading,
  shouldCommitReflectGeneration,
  type ReflectGenerationPrefetch,
  type RunReflectGenerationInput,
} from './holzen-reflect/pause-reflect-generation-hook-flow';
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
} from './manual-open/pause-reflect-generation-manual-open-flow';
