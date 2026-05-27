import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/public';
import { useProfile } from '@/features/user/public-hooks';
import type { ReflectGenerationProfileInput } from '@/features/pause/domain/reflect/generation/reflect-generation-edge-params';
import {
  messageFromReflectGenerationResult,
  pauseReflectGeneration,
  reflectGenerationPrerequisite,
  reflectGenerationUserErrorMessage,
  reflectGenerator,
  resolveEffectiveReflectionCopy,
  resolveReflectGenerationPrefetch,
  shouldCommitReflectGeneration,
} from './pause-reflect-generation-io';
import type { UsePauseReflectGenerationParams } from './use-pause-reflect-generation-types';
import { usePauseArtifactReflectionText } from './use-pause-artifact-reflection-text';

export type { UsePauseReflectGenerationParams } from './use-pause-reflect-generation-types';

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
  const profileForReflect = useMemo<ReflectGenerationProfileInput>(
    () => ({
      reflectionTone: profile.reflectionTone,
      reflectionStyle: profile.reflectionStyle,
      customPrompt: profile.customPrompt ?? '',
      motivations: profile.motivations ?? [],
      mantra: profile.mantra ?? '',
      groundingActivities: profile.groundingActivities ?? [],
      currency: profile.currency,
      language: profile.language,
    }),
    [
      profile.reflectionTone,
      profile.reflectionStyle,
      profile.customPrompt,
      profile.motivations,
      profile.mantra,
      profile.groundingActivities,
      profile.currency,
      profile.language,
    ],
  );

  const [reflectionMessage, setReflectionMessage] = useState(initialReflectionMessage);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  /** Bumped when `pauseInstanceId` changes so stale async work cannot commit. */
  const validityRef = useRef(0);
  /** Aborts the in-flight `holzen-reflect` when superseded, `pauseInstanceId` changes, `enabled` turns false, or the effect cleans up. */
  const reflectGenAbortRef = useRef<AbortController | null>(null);
  const runGenerationRef = useRef<() => void>(() => {});

  const navSeedEmpty = !initialReflectionMessage.trim();
  const { artifactReflectionText } = usePauseArtifactReflectionText({
    pauseInstanceId,
    trigger: 'whenEnabled',
    fetchEnabled: enabled && navSeedEmpty,
  });

  useEffect(() => {
    reflectGenAbortRef.current?.abort();
    validityRef.current += 1;
  }, [pauseInstanceId]);

  useEffect(() => {
    setReflectionMessage(initialReflectionMessage);
    setError(null);
  }, [pauseInstanceId, initialReflectionMessage]);

  /** Show persisted `reflection_text` while holzen-reflect runs (nav seed empty). */
  useEffect(() => {
    if (!enabled || !navSeedEmpty || !artifactReflectionText) return;
    setReflectionMessage((prev) =>
      resolveEffectiveReflectionCopy(prev, artifactReflectionText),
    );
  }, [enabled, navSeedEmpty, artifactReflectionText]);

  const runGeneration = useCallback(() => {
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
      return;
    }

    const validityTicket = validityRef.current;
    const instanceForThisRun = pauseInstanceId!;
    reflectGenAbortRef.current?.abort();
    const ac = new AbortController();
    reflectGenAbortRef.current = ac;

    startTransition(async () => {
      setError(null);
      try {
        const result = await pauseReflectGeneration(
          {
            pauseInstanceId: instanceForThisRun,
            userId: user!.id,
            context: context!.trim(),
            initialReflectionMessage,
            severityAbsPct,
            profile: profileForReflect,
            signal: ac.signal,
          },
          reflectGenerator,
        );
        if (!shouldCommitReflectGeneration(validityTicket, validityRef.current)) return;
        const message = messageFromReflectGenerationResult(result);
        if (message != null) setReflectionMessage(message);
      } catch (e: unknown) {
        if (!shouldCommitReflectGeneration(validityTicket, validityRef.current)) return;
        const raw = e instanceof Error ? e.message : String(e);
        setError(reflectGenerationUserErrorMessage(raw));
      }
    });
  }, [
    t,
    enabled,
    pauseInstanceId,
    user,
    context,
    initialReflectionMessage,
    severityAbsPct,
    profileForReflect,
    startTransition,
  ]);

  runGenerationRef.current = runGeneration;

  useEffect(() => {
    if (!enabled) {
      reflectGenAbortRef.current?.abort();
      return () => {
        reflectGenAbortRef.current?.abort();
      };
    }
    runGenerationRef.current();
    return () => {
      reflectGenAbortRef.current?.abort();
    };
  }, [
    enabled,
    pauseInstanceId,
    context,
    initialReflectionMessage,
    user?.id,
    severityAbsPct,
    profileForReflect,
  ]);

  const retry = useCallback(() => {
    setError(null);
    validityRef.current += 1;
    runGeneration();
  }, [runGeneration]);

  return {
    reflectionMessage,
    loading: isPending,
    error,
    retry,
  };
}
