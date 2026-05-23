/** Params for artifact-only `reflection_text` hydrate on Reflect / Frame beats. */
export type PauseArtifactReflectionTextFetchPhase = 'idle' | 'loading' | 'error' | 'done';

type UsePauseArtifactReflectionTextBase = {
  pauseInstanceId: string | null;
};

export type UsePauseArtifactReflectionTextImmediateParams = UsePauseArtifactReflectionTextBase & {
  /** Fetch as soon as `pauseInstanceId` is set (Reflect step hydration). */
  trigger: 'immediate';
};

export type UsePauseArtifactReflectionTextWhenEnabledParams = UsePauseArtifactReflectionTextBase & {
  /** Fetch only when true (deferred read — e.g. Frame fallback when session seed is empty). */
  trigger: 'whenEnabled';
  fetchEnabled: boolean;
};

export type UsePauseArtifactReflectionTextParams =
  | UsePauseArtifactReflectionTextImmediateParams
  | UsePauseArtifactReflectionTextWhenEnabledParams;

export type UsePauseArtifactReflectionTextResult = {
  artifactReflectionText: string | null;
  reflectionTextFetch: PauseArtifactReflectionTextFetchPhase;
};
