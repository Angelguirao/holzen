import { useEffect, useRef, useState } from 'react';
import { fetchReflectionTextForPauseInstance } from '@/features/pause/public-rpc';

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

/**
 * Loads persisted `reflection_text` from `pause_ai_artifacts` for Reflect / Frame steps.
 * Mirrors `usePauseArtifactHaiku` — artifact-only hydrate without `holzen-reflect`.
 */
export function usePauseArtifactReflectionText(
  params: UsePauseArtifactReflectionTextParams,
): UsePauseArtifactReflectionTextResult {
  const { pauseInstanceId, trigger } = params;
  const fetchEnabled = params.trigger === 'whenEnabled' ? params.fetchEnabled : true;
  const [artifactReflectionText, setArtifactReflectionText] = useState<string | null>(null);
  const [reflectionTextFetch, setReflectionTextFetch] =
    useState<PauseArtifactReflectionTextFetchPhase>('idle');
  const fetchedForPauseRef = useRef<string | null>(null);

  useEffect(() => {
    setArtifactReflectionText(null);
    setReflectionTextFetch('idle');
    fetchedForPauseRef.current = null;
  }, [pauseInstanceId]);

  useEffect(() => {
    if (trigger === 'whenEnabled' && !fetchEnabled) return;
    if (!pauseInstanceId) return;

    if (trigger === 'whenEnabled' && fetchedForPauseRef.current === pauseInstanceId) {
      return;
    }

    const myId = pauseInstanceId;
    let cancelled = false;

    if (trigger === 'whenEnabled') {
      fetchedForPauseRef.current = myId;
      setReflectionTextFetch('loading');
    }

    void fetchReflectionTextForPauseInstance(myId)
      .then((text) => {
        if (cancelled) return;
        if (trigger === 'whenEnabled' && fetchedForPauseRef.current !== myId) return;
        setArtifactReflectionText(text);
        if (trigger === 'whenEnabled') setReflectionTextFetch('done');
      })
      .catch(() => {
        if (cancelled) return;
        if (trigger === 'whenEnabled') {
          if (fetchedForPauseRef.current === myId) {
            setReflectionTextFetch('error');
            fetchedForPauseRef.current = null;
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pauseInstanceId, trigger, fetchEnabled]);

  return { artifactReflectionText, reflectionTextFetch };
}
