import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/public';
import { useProfile } from '@/features/user/public-hooks';
import {
  fetchOpeningMessageForPauseInstance,
  generateReflectionAtReflectStep,
} from '@/features/pause/public-queries';
import { reflectGenerationPrerequisite } from '@/features/pause/public';

function isAbortLike(e: unknown): boolean {
  if (e instanceof DOMException && e.name === 'AbortError') return true;
  if (e instanceof Error && e.name === 'AbortError') return true;
  if (typeof e === 'object' && e !== null && 'name' in e && (e as { name: unknown }).name === 'AbortError') {
    return true;
  }
  return false;
}

export type UsePauseReflectGenerationParams = {
  pauseInstanceId: string | null;
  context: string | null;
  /** Hydrated / nav seed — when non-empty, used as-is and skips edge `holzen-reflect`. */
  initialReflectionMessage: string;
  severityAbsPct: number;
  /**
   * When false, aborts in-flight work and idles. For `/pause` deep ritual, `PauseSession` passes
   * true on Reflect, Frame, second Breathe, and Decide so `holzen-reflect` can finish after the
   * Reflect card (see `docs/systems/pause-system.md` §7.1, Reflection + haiku (deep)).
   */
  enabled: boolean;
};

export function usePauseReflectGeneration({
  pauseInstanceId,
  context,
  initialReflectionMessage,
  severityAbsPct,
  enabled,
}: UsePauseReflectGenerationParams) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const profile = useProfile();

  const [reflectionMessage, setReflectionMessage] = useState(initialReflectionMessage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Monotonic id of the in-flight generation; only that run may clear loading / commit. */
  const activeRunRef = useRef(0);
  /** Bumped when `pauseInstanceId` changes so stale async work cannot commit. */
  const validityRef = useRef(0);
  /** Aborts the in-flight `holzen-reflect` when superseded, `pauseInstanceId` changes, `enabled` turns false, or the effect cleans up. */
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
    const prereq = reflectGenerationPrerequisite({
      enabled,
      pauseInstanceId,
      userId: user?.id,
      context,
    });
    if (prereq === 'idle') return;
    if (prereq === 'missing_context') {
      setLoading(false);
      setError(
        t('pause.reflectMissingContext', {
          defaultValue:
            'This pause is missing market context. Go back to Home and start a new pause.',
        }),
      );
      return;
    }

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
      const cached = await fetchOpeningMessageForPauseInstance(instanceForThisRun);
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
    t,
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
