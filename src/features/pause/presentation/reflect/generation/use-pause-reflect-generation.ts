import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/public';
import { useProfile } from '@/features/user/public-hooks';
import { reflectGenerationPrerequisite } from '@/features/pause/domain/reflect-generation-prerequisites';
import { reflectGenerationUserErrorMessage } from '@/features/pause/domain/reflect-generation-errors';
import {
  messageFromReflectGenerationResult,
  resolveReflectGenerationPrefetch,
  shouldClearReflectGenerationLoading,
  shouldCommitReflectGeneration,
} from '@/features/pause/domain/reflect-generation-hook-flow';
import { runPauseReflectGeneration } from '@/features/pause/public-rpc';

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
    const prefetch = resolveReflectGenerationPrefetch(
      reflectGenerationPrerequisite({
        enabled,
        pauseInstanceId,
        userId: user?.id,
        context,
      }),
      initialReflectionMessage,
    );

    if (prefetch.kind === 'stop') return;
    if (prefetch.kind === 'missing_context') {
      setLoading(false);
      setError(
        t('pause.reflectMissingContext', {
          defaultValue:
            'This pause is missing market context. Go back to Home and start a new pause.',
        }),
      );
      return;
    }
    if (prefetch.kind === 'seed') {
      setReflectionMessage(prefetch.message);
      setLoading(false);
      return;
    }

    const validityTicket = validityRef.current;
    const instanceForThisRun = pauseInstanceId!;
    const runId = ++activeRunRef.current;
    reflectGenAbortRef.current?.abort();
    const ac = new AbortController();
    reflectGenAbortRef.current = ac;
    setLoading(true);
    setError(null);

    try {
      const result = await runPauseReflectGeneration({
        pauseInstanceId: instanceForThisRun,
        userId: user!.id,
        context: context!.trim(),
        initialReflectionMessage,
        severityAbsPct,
        profile,
        signal: ac.signal,
      });
      if (!shouldCommitReflectGeneration(validityTicket, validityRef.current)) return;
      const message = messageFromReflectGenerationResult(result);
      if (message != null) setReflectionMessage(message);
    } catch (e: unknown) {
      if (!shouldCommitReflectGeneration(validityTicket, validityRef.current)) return;
      const raw = e instanceof Error ? e.message : String(e);
      setError(reflectGenerationUserErrorMessage(raw));
    } finally {
      if (shouldClearReflectGenerationLoading(runId, activeRunRef.current)) {
        setLoading(false);
      }
    }
  }, [t, enabled, pauseInstanceId, user, context, initialReflectionMessage, severityAbsPct, profile]);

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
