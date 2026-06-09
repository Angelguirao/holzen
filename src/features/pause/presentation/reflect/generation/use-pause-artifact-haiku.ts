import { useEffect, useRef, useState } from 'react';
import { reflectGenerator } from './pause-reflect-generation-io';
import type {
  PauseArtifactHaikuFetchPhase,
  UsePauseArtifactHaikuParams,
  UsePauseArtifactHaikuResult,
} from './use-pause-artifact-haiku-types';

export type {
  PauseArtifactHaikuFetchPhase,
  UsePauseArtifactHaikuImmediateParams,
  UsePauseArtifactHaikuParams,
  UsePauseArtifactHaikuResult,
  UsePauseArtifactHaikuWhenEnabledParams,
} from './use-pause-artifact-haiku-types';

/**
 * Loads persisted haiku text from `pause_ai_artifacts` for the Frame haiku companion.
 */
export function usePauseArtifactHaiku(params: UsePauseArtifactHaikuParams): UsePauseArtifactHaikuResult {
  const { pauseInstanceId, companionHaikuEnabled, trigger } = params;
  const fetchEnabled = params.trigger === 'whenEnabled' ? params.fetchEnabled : true;
  const reflectionMessage =
    params.trigger === 'whenEnabled' ? (params.reflectionMessage?.trim() ?? '') : '';
  const [artifactHaiku, setArtifactHaiku] = useState<string | null>(null);
  const [haikuFetch, setHaikuFetch] = useState<PauseArtifactHaikuFetchPhase>('idle');
  const fetchedForPauseRef = useRef<string | null>(null);
  const fetchedForReflectionRef = useRef<string>('');

  useEffect(() => {
    setArtifactHaiku(null);
    setHaikuFetch('idle');
    fetchedForPauseRef.current = null;
    fetchedForReflectionRef.current = '';
  }, [pauseInstanceId]);

  useEffect(() => {
    if (trigger === 'whenEnabled' && !fetchEnabled) return;
    if (!pauseInstanceId || !companionHaikuEnabled) return;

    if (trigger === 'whenEnabled' && fetchedForPauseRef.current === pauseInstanceId) {
      if (reflectionMessage === fetchedForReflectionRef.current) {
        return;
      }
      fetchedForPauseRef.current = null;
    }

    const myId = pauseInstanceId;
    let cancelled = false;

    if (trigger === 'whenEnabled') {
      fetchedForPauseRef.current = myId;
      fetchedForReflectionRef.current = reflectionMessage;
      setHaikuFetch('loading');
    }

    void reflectGenerator.fetchHaikuText(myId)
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
            fetchedForReflectionRef.current = '';
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pauseInstanceId, companionHaikuEnabled, trigger, fetchEnabled, reflectionMessage]);

  return { artifactHaiku, haikuFetch };
}
