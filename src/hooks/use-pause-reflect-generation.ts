import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import {
  fetchReflectionTextForPauseInstance,
  generateReflectionAtReflectStep,
} from '@/lib/pause-reflect-artifact';

function isAbortLike(e: unknown): boolean {
  if (e instanceof DOMException && e.name === 'AbortError') return true;
  if (e instanceof Error && e.name === 'AbortError') return true;
  return false;
}

export type UsePauseReflectGenerationParams = {
  pauseInstanceId: string | null;
  context: string | null;
  /** Hydrated / nav seed — skipped when empty. */
  initialReflectionMessage: string;
  severityAbsPct: number;
  /** When false, hook idles (e.g. not on Reflect/Frame). */
  enabled: boolean;
};

export function usePauseReflectGeneration({
  pauseInstanceId,
  context,
  initialReflectionMessage,
  severityAbsPct,
  enabled,
}: UsePauseReflectGenerationParams) {
  const { user } = useAuth();
  const profile = useProfile();

  const [reflectionMessage, setReflectionMessage] = useState(initialReflectionMessage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Monotonic id of the in-flight generation; only that run may clear loading / commit. */
  const activeRunRef = useRef(0);
  /** Bumped when `pauseInstanceId` changes so stale async work cannot commit. */
  const validityRef = useRef(0);
  /** Aborts the in-flight `holzen-reflect` when superseded or the instance changes. */
  const reflectGenAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    reflectGenAbortRef.current?.abort();
    validityRef.current += 1;
  }, [pauseInstanceId]);

  useEffect(() => {
    setReflectionMessage(initialReflectionMessage);
    setError(null);
  }, [pauseInstanceId, initialReflectionMessage]);

  const runGeneration = useCallback(async () => {
    if (!enabled || !pauseInstanceId || !user?.id || !context?.trim()) return;

    const seed = initialReflectionMessage.trim();
    if (seed) {
      setReflectionMessage(seed);
      setLoading(false);
      return;
    }

    const ticket = validityRef.current;
    const instanceForThisRun = pauseInstanceId;
    const myRun = ++activeRunRef.current;
    reflectGenAbortRef.current?.abort();
    const ac = new AbortController();
    reflectGenAbortRef.current = ac;
    const signal = ac.signal;
    setLoading(true);
    setError(null);

    try {
      const cached = await fetchReflectionTextForPauseInstance(instanceForThisRun);
      if (ticket !== validityRef.current) return;
      if (cached) {
        setReflectionMessage(cached);
        return;
      }

      const { message } = await generateReflectionAtReflectStep({
        pauseInstanceId: instanceForThisRun,
        userId: user.id,
        context: context.trim(),
        severity: severityAbsPct,
        tone: profile.reflectionTone,
        style: profile.reflectionStyle,
        customPrompt: profile.customPrompt || undefined,
        motivations: profile.motivations.length > 0 ? profile.motivations : undefined,
        mantra: profile.mantra || undefined,
        groundingActivities:
          profile.groundingActivities.length > 0 ? profile.groundingActivities : undefined,
        currency: profile.currency,
        language: profile.language,
        signal,
      });
      if (ticket !== validityRef.current) return;
      setReflectionMessage(message);
    } catch (e: unknown) {
      if (ticket !== validityRef.current) return;
      if (isAbortLike(e) || signal.aborted) return;
      const raw = e instanceof Error ? e.message : String(e);
      if (raw.includes('fetch') || raw.includes('network') || raw.includes('Failed to fetch')) {
        setError('Could not reach Holzen. Check your connection.');
      } else if (raw.includes('rate') || raw.includes('limit') || raw.includes('429')) {
        setError('Too many requests — please wait a moment and try again.');
      } else {
        setError('Reflection unavailable right now. Try again shortly.');
      }
    } finally {
      if (activeRunRef.current === myRun) {
        setLoading(false);
      }
    }
  }, [
    enabled,
    pauseInstanceId,
    user?.id,
    context,
    initialReflectionMessage,
    severityAbsPct,
    profile.reflectionTone,
    profile.reflectionStyle,
    profile.customPrompt,
    profile.motivations,
    profile.mantra,
    profile.groundingActivities,
    profile.currency,
    profile.language,
  ]);

  useEffect(() => {
    if (!enabled) {
      reflectGenAbortRef.current?.abort();
      return () => {
        reflectGenAbortRef.current?.abort();
      };
    }
    void runGeneration();
    return () => {
      reflectGenAbortRef.current?.abort();
    };
  }, [enabled, runGeneration]);

  const retry = useCallback(() => {
    validityRef.current += 1;
    void runGeneration();
  }, [runGeneration]);

  return {
    reflectionMessage,
    loading,
    error,
    retry,
  };
}
