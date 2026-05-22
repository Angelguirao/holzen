/**
 * Reflect ritual beat — screen-facing pure helpers and presentation hooks.
 * Mutations/edge stay on `public-rpc.ts`; tab autosave/sync conductors live under `presentation/session/scaffold/` (re-exported here for reflect mood bundle).
 */
export {
  clampFeelIntensity,
  isPauseMoodValue,
  PAUSE_MOOD_GROUPS,
  PAUSE_MOOD_VALUES,
  type MoodValue,
} from './domain/mood-value';
export type { FeelStepTile } from './domain/feel-step-tile';
export { PAUSE_FEEL_STEP_TILE_ROWS } from './domain/pause-feel-step-tiles';
export {
  PAUSE_FEEL_INTENSITY_KEYS,
  type PauseFeelIntensityKey,
} from './domain/pause-feel-intensity';
export { resolveEffectiveReflectionCopy } from './domain/reflect/generation/resolve-effective-reflection-copy';
export { resolveFrameHaikuDisplayBody } from './domain/reflect/generation/resolve-frame-haiku-display-body';
export {
  resolvePauseReflectMessageView,
  type PauseReflectMessageView,
} from './domain/reflect/generation/resolve-pause-reflect-message-view';
export { buildReflectionShareText } from './domain/reflect/share/reflection-share-text';

export { usePauseReflectGeneration } from './presentation/reflect/generation/use-pause-reflect-generation';
export type { UsePauseReflectGenerationParams } from './presentation/reflect/generation/use-pause-reflect-generation-types';
export { usePauseArtifactHaiku } from './presentation/reflect/generation/use-pause-artifact-haiku';
export type {
  PauseArtifactHaikuFetchPhase,
  UsePauseArtifactHaikuParams,
  UsePauseArtifactHaikuResult,
} from './presentation/reflect/generation/use-pause-artifact-haiku-types';
export { usePauseArtifactReflectionText } from './presentation/reflect/generation/use-pause-artifact-reflection-text';
export type {
  PauseArtifactReflectionTextFetchPhase,
  UsePauseArtifactReflectionTextParams,
  UsePauseArtifactReflectionTextResult,
} from './presentation/reflect/generation/use-pause-artifact-reflection-text-types';
export { useReflectionShareHandlers } from './presentation/reflect/share/use-reflection-share-handlers';
export type { UseReflectionShareHandlersParams } from './presentation/reflect/share/reflection-share-handler-types';
export { usePauseReflectionStepLog } from './presentation/reflect/steps/use-pause-reflection-step-log';
export { usePauseReflectUiTelemetry } from './presentation/reflect/telemetry/session/use-pause-reflect-ui-telemetry';
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
export { usePauseSessionDecideHandler } from './presentation/reflect/flows/use-pause-session-decide-handler';
export { usePauseSessionDepthAndBriefCopy } from './presentation/reflect/mood/use-pause-session-depth-and-brief-copy';
export { usePauseSessionPersistToStorage } from './presentation/session/scaffold/use-pause-session-persist-to-storage';
export { usePauseSessionRitualStorageSync } from './presentation/session/scaffold/use-pause-session-ritual-storage-sync';

export { PAUSE_DEPTH_PICKER_CARD_BUTTON_CLASS } from './presentation/reflect/mood/pause-depth-picker-styles';
export { usePauseFeelShiftLogDedupeRefs } from './presentation/reflect/mood/use-pause-feel-shift-log-dedupe-refs';
