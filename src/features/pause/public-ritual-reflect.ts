/**
 * Reflect ritual beat — holzen-reflect, reflect step editors, reflect+decide conductors, share.
 * Feel-step hooks and mood constants: `public-ritual-feel.ts`.
 */
export { resolveEffectiveReflectionCopy } from './domain/reflect/generation/resolve-effective-reflection-copy';
export {
  reflectionContentFromLegacyMessage,
  type CurrentFeelForReflect,
  type ReflectionContentV2,
} from './domain/reflect/generation/reflection-content-v2';
export {
  formatReflectDisplayLetter,
  formatReflectIntegratedProse,
} from './domain/reflect/generation/format-reflect-integrated-prose';
export { buildReflectFeelRecapLine } from './domain/reflect/generation/build-reflect-feel-recap-line';
export { resolveFrameHaikuDisplayBody } from './domain/reflect/generation/resolve-frame-haiku-display-body';
export {
  resolvePauseReflectMessageView,
  type PauseReflectMessageView,
} from './domain/reflect/generation/resolve-pause-reflect-message-view';
export { resolvePauseReflectDisplayContent } from './domain/reflect/generation/resolve-pause-reflect-display-content';
export { isPauseReflectContinueDisabled } from './domain/reflect/generation/is-pause-reflect-continue-disabled';
export {
  trackPauseReflectBlockViewed,
  trackPauseReflectContextStripExpanded,
  trackPauseReflectInquiryDisplayed,
} from './presentation/reflect/telemetry/pause-reflect-telemetry-io';
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
export { usePauseReflectUiTelemetry } from './presentation/reflect/telemetry/use-pause-reflect-ui-telemetry';
export { usePauseReflectNote } from './presentation/reflect/steps/use-pause-reflect-note';
export { usePauseReflectFrameFocusAmbience } from './presentation/reflect/ambience/use-pause-reflect-frame-focus-ambience';
export { usePauseFavoriteToggle } from './presentation/reflect/steps/use-pause-favorite-toggle';
export { usePauseShiftFrameDoneHandler } from './presentation/reflect/hub/use-pause-shift-frame-done-handler';
export {
  usePauseSessionReflectAndDecide,
  type UsePauseSessionReflectAndDecideParams,
} from './presentation/reflect/flows/use-pause-session-reflect-and-decide';
export { usePauseSessionDecideHandler } from './presentation/reflect/flows/use-pause-session-decide-handler';
export {
  buildPauseScoreImpacts,
  resolveScoreImpactDisplayImpacts,
  resolveScoreImpactViewMode,
  scoreImpactMotionDelaySec,
  type PauseImpactData,
  type PauseScoreImpactRow,
  type ScoreImpactVariant,
  type ScoreImpactViewMode,
} from './presentation/reflect/flows/pause-reflect-flows-io';
export { usePauseSessionPersistToStorage } from './presentation/session/scaffold/use-pause-session-persist-to-storage';
export { usePauseSessionRitualStorageSync } from './presentation/session/scaffold/use-pause-session-ritual-storage-sync';
