import { useEffect, useRef, useState } from 'react';
import { fetchHaikuTextForPauseInstance } from '../../../public-queries';

export type PauseArtifactHaikuFetchPhase = 'idle' | 'loading' | 'error' | 'done';

type UsePauseArtifactHaikuBase = {
  pauseInstanceId: string | null;
  companionHaikuEnabled: boolean;
};

export type UsePauseArtifactHaikuImmediateParams = UsePauseArtifactHaikuBase & {
  /** Fetch as soon as `pauseInstanceId` is set (Reflect step). */
  trigger: 'immediate';
};

export type UsePauseArtifactHaikuWhenEnabledParams = UsePauseArtifactHaikuBase & {
  /** Fetch only when true (Frame step — user expanded haiku). */
  trigger: 'whenEnabled';
  fetchEnabled: boolean;
};

export type UsePauseArtifactHaikuParams =
  | UsePauseArtifactHaikuImmediateParams
  | UsePauseArtifactHaikuWhenEnabledParams;

export type UsePauseArtifactHaikuResult = {
  artifactHaiku: string | null;
  haikuFetch: PauseArtifactHaikuFetchPhase;
};

/**
 * Loads persisted haiku text from `pause_ai_artifacts` for Reflect / Frame steps.
 */
export function usePauseArtifactHaiku(params: UsePauseArtifactHaikuParams): UsePauseArtifactHaikuResult {
  const { pauseInstanceId, companionHaikuEnabled, trigger } = params;
  const fetchEnabled = params.trigger === 'whenEnabled' ? params.fetchEnabled : true;
  const [artifactHaiku, setArtifactHaiku] = useState<string | null>(null);
  const [haikuFetch, setHaikuFetch] = useState<PauseArtifactHaikuFetchPhase>('idle');
  const fetchedForPauseRef = useRef<string | null>(null);

  useEffect(() => {
    setArtifactHaiku(null);
    setHaikuFetch('idle');
    fetchedForPauseRef.current = null;
  }, [pauseInstanceId]);

  useEffect(() => {
    if (trigger === 'whenEnabled' && !fetchEnabled) return;
    if (!pauseInstanceId || !companionHaikuEnabled) return;

    if (trigger === 'whenEnabled' && fetchedForPauseRef.current === pauseInstanceId) {
      return;
    }

    const myId = pauseInstanceId;
    let cancelled = false;

    if (trigger === 'whenEnabled') {
      fetchedForPauseRef.current = myId;
      setHaikuFetch('loading');
    }

    void fetchHaikuTextForPauseInstance(myId)
      .then((h) => {
        if (cancelled) return;
        if (trigger === 'whenEnabled' && fetchedForPauseRef.current !== myId) return;
        setArtifactHaiku(h);
        if (trigger === 'whenEnabled') setHaikuFetch('done');
      })
      .catch(() => {
        if (cancelled) return;
        if (trigger === 'whenEnabled') {
          if (fetchedForPauseRef.current === myId) {
            setHaikuFetch('error');
            fetchedForPauseRef.current = null;
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pauseInstanceId, companionHaikuEnabled, trigger, fetchEnabled]);

  return { artifactHaiku, haikuFetch };
}
