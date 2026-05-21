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
