/**
 * Reflect ritual beat — screen-facing pure helpers and presentation hooks.
 * Mutations/edge stay on `public-rpc.ts`; session shell on `public-session.ts`.
 */
export { resolveEffectiveReflectionCopy } from './domain/reflect/generation/resolve-effective-reflection-copy';
export { resolveFrameHaikuDisplayBody } from './domain/reflect/generation/resolve-frame-haiku-display-body';
export {
  resolvePauseReflectMessageView,
  type PauseReflectMessageView,
} from './domain/reflect/generation/resolve-pause-reflect-message-view';
export { buildReflectionShareText } from './domain/reflect/share/reflection-share-text';

export {
  usePauseReflectGeneration,
  type UsePauseReflectGenerationParams,
} from './presentation/reflect/generation/use-pause-reflect-generation';
export {
  usePauseArtifactHaiku,
  type PauseArtifactHaikuFetchPhase,
  type UsePauseArtifactHaikuParams,
  type UsePauseArtifactHaikuResult,
} from './presentation/reflect/generation/use-pause-artifact-haiku';
export {
  usePauseArtifactReflectionText,
  type PauseArtifactReflectionTextFetchPhase,
  type UsePauseArtifactReflectionTextParams,
  type UsePauseArtifactReflectionTextResult,
} from './presentation/reflect/generation/use-pause-artifact-reflection-text';
export {
  useReflectionShareHandlers,
  type UseReflectionShareHandlersParams,
} from './presentation/reflect/share/use-reflection-share-handlers';
export { usePauseReflectionStepLog } from './presentation/reflect/steps/use-pause-reflection-step-log';
export { usePauseReflectUiTelemetry } from './presentation/reflect/telemetry/use-pause-reflect-ui-telemetry';
export { usePauseReflectTags } from './presentation/reflect/steps/use-pause-reflect-tags';
export { usePauseReflectNote } from './presentation/reflect/steps/use-pause-reflect-note';
export { usePauseReflectFrameFocusAmbience } from './presentation/reflect/ambience/use-pause-reflect-frame-focus-ambience';
export { usePauseFavoriteToggle } from './presentation/reflect/steps/use-pause-favorite-toggle';
export { usePauseSessionMoodChromeHandlers } from './presentation/reflect/mood/use-pause-session-mood-chrome-handlers';
export {
  usePauseSessionMoodAndPersist,
  type UsePauseSessionMoodAndPersistParams,
} from './presentation/reflect/mood/use-pause-session-mood-and-persist';
export { usePauseSessionDepthPickerHandlers } from './presentation/reflect/mood/use-pause-session-depth-picker-handlers';
export { usePauseSessionFeelTilesSelect } from './presentation/reflect/mood/use-pause-session-feel-tiles-select';
export { usePauseSessionInitialMoodHandlers } from './presentation/reflect/mood/use-pause-session-initial-mood-handlers';
export { usePauseShiftFrameDoneHandler } from './presentation/reflect/hub/use-pause-shift-frame-done-handler';
export {
  usePauseSessionReflectAndDecide,
  type UsePauseSessionReflectAndDecideParams,
} from './presentation/reflect/flows/use-pause-session-reflect-and-decide';
export { usePauseSessionDepthAndBriefCopy } from './presentation/reflect/mood/use-pause-session-depth-and-brief-copy';

export { PAUSE_DEPTH_PICKER_CARD_BUTTON_CLASS } from './presentation/reflect/mood/pause-depth-picker-styles';
export { usePauseFeelShiftLogDedupeRefs } from './presentation/reflect/mood/use-pause-feel-shift-log-dedupe-refs';
export { applyBreathSegmentLogOutcome } from './domain/reflect/flows/apply-breath-segment-log-outcome';
export { initialBreathSegmentRpcLoggedFlagsFromRestored } from './domain/reflect/flows/initial-breath-segment-rpc-flags';
export { usePauseBreathSegmentRpcLoggers } from './presentation/reflect/flows/use-pause-breath-segment-rpc-loggers';
export { usePauseSessionBreathStepHandlers } from './presentation/reflect/flows/use-pause-session-breath-step-handlers';
export {
  usePauseSessionBreathHandlers,
  type UsePauseSessionBreathHandlersParams,
} from './presentation/reflect/flows/use-pause-session-breath-handlers';
export { usePauseSessionBreathReflectHandlers } from './presentation/reflect/flows/use-pause-session-breath-reflect-handlers';
