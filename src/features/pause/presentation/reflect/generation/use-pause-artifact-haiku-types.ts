/** Params for artifact-only haiku hydrate (Frame companion hub). */
export type PauseArtifactHaikuFetchPhase = 'idle' | 'loading' | 'error' | 'done';

type UsePauseArtifactHaikuBase = {
  pauseInstanceId: string | null;
  companionHaikuEnabled: boolean;
};

export type UsePauseArtifactHaikuImmediateParams = UsePauseArtifactHaikuBase & {
  /** Fetch as soon as `pauseInstanceId` is set (legacy / tests). */
  trigger: 'immediate';
};

export type UsePauseArtifactHaikuWhenEnabledParams = UsePauseArtifactHaikuBase & {
  /** Fetch only when true (Frame step — user expanded haiku). */
  trigger: 'whenEnabled';
  fetchEnabled: boolean;
  /** When this changes after a prior fetch, retries artifact read (late holzen-reflect persist). */
  reflectionMessage?: string;
};

export type UsePauseArtifactHaikuParams =
  | UsePauseArtifactHaikuImmediateParams
  | UsePauseArtifactHaikuWhenEnabledParams;

export type UsePauseArtifactHaikuResult = {
  artifactHaiku: string | null;
  haikuFetch: PauseArtifactHaikuFetchPhase;
};
