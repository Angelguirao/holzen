import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/public';
import { useProfile } from '@/features/user/public-hooks';
import type { ReflectGenerationProfileInput } from '@/features/pause/domain/reflect/generation/reflect-generation-edge-params';
import {
  reflectionContentFromLegacyMessage,
  type ReflectionContentV2,
} from '@/features/pause/domain/reflect/generation/reflection-content-v2';
import {
  contentFromReflectGenerationResult,
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

function initialContentFromMessage(message: string): ReflectionContentV2 | null {
  const trimmed = message.trim();
  if (!trimmed) return null;
  return reflectionContentFromLegacyMessage(trimmed);
}

export function usePauseReflectGeneration({
  pauseInstanceId,
  context,
  initialReflectionMessage,
  severityAbsPct,
  currentFeel,
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

  const [reflectionContent, setReflectionContent] = useState<ReflectionContentV2 | null>(() =>
    initialContentFromMessage(initialReflectionMessage),
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const validityRef = useRef(0);
  const reflectGenAbortRef = useRef<AbortController | null>(null);
  const runGenerationRef = useRef<() => void>(() => {});

  const reflectionMessage = reflectionContent?.message ?? '';

  const navSeedEmpty = !initialReflectionMessage.trim();
  const { artifactReflectionText, artifactReflectionContent } = usePauseArtifactReflectionText({
    pauseInstanceId,
    trigger: 'whenEnabled',
    fetchEnabled: enabled && navSeedEmpty,
  });

  useEffect(() => {
    reflectGenAbortRef.current?.abort();
    validityRef.current += 1;
  }, [pauseInstanceId]);

  useEffect(() => {
    setReflectionContent(initialContentFromMessage(initialReflectionMessage));
    setError(null);
  }, [pauseInstanceId, initialReflectionMessage]);

  useEffect(() => {
    if (!enabled || !navSeedEmpty) return;
    if (artifactReflectionContent) {
      setReflectionContent((prev) =>
        prev?.message === artifactReflectionContent.message ? prev : artifactReflectionContent,
      );
      return;
    }
    if (!artifactReflectionText) return;
    setReflectionContent((prev) => {
      const next = reflectionContentFromLegacyMessage(
        resolveEffectiveReflectionCopy(prev?.message ?? '', artifactReflectionText),
      );
      return prev?.message === next.message ? prev : next;
    });
  }, [enabled, navSeedEmpty, artifactReflectionContent, artifactReflectionText]);

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
      setReflectionContent(reflectionContentFromLegacyMessage(prefetch.message));
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
            currentFeel,
            signal: ac.signal,
          },
          reflectGenerator,
        );
        if (!shouldCommitReflectGeneration(validityTicket, validityRef.current)) return;
        const content = contentFromReflectGenerationResult(result);
        if (content) setReflectionContent(content);
      } catch (e: unknown) {
        if (!shouldCommitReflectGeneration(validityTicket, validityRef.current)) return;
        setReflectionContent(null);
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
    currentFeel,
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
    currentFeel,
  ]);

  const retry = useCallback(() => {
    setError(null);
    validityRef.current += 1;
    runGeneration();
  }, [runGeneration]);

  return {
    reflectionMessage,
    reflectionContent,
    loading: isPending,
    error,
    retry,
  };
}
