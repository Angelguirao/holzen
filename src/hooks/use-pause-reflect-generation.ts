import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import {
  fetchReflectionTextForPauseInstance,
  generateReflectionAtReflectStep,
} from '@/lib/pause-reflect-artifact';

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
  const inflightRef = useRef<string | null>(null);

  useEffect(() => {
    setReflectionMessage(initialReflectionMessage);
    setError(null);
  }, [pauseInstanceId, initialReflectionMessage]);

  const runGeneration = useCallback(async () => {
    if (!enabled || !pauseInstanceId || !user?.id || !context?.trim()) return;

    const seed = initialReflectionMessage.trim();
    if (seed) {
      setReflectionMessage(seed);
      return;
    }

    if (inflightRef.current === pauseInstanceId) return;
    inflightRef.current = pauseInstanceId;
    setLoading(true);
    setError(null);

    try {
      const cached = await fetchReflectionTextForPauseInstance(pauseInstanceId);
      if (cached) {
        setReflectionMessage(cached);
        return;
      }

      const { message } = await generateReflectionAtReflectStep({
        pauseInstanceId,
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
      });
      setReflectionMessage(message);
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : String(e);
      if (raw.includes('fetch') || raw.includes('network') || raw.includes('Failed to fetch')) {
        setError('Could not reach Holzen. Check your connection.');
      } else if (raw.includes('rate') || raw.includes('limit') || raw.includes('429')) {
        setError('Too many requests — please wait a moment and try again.');
      } else {
        setError('Reflection unavailable right now. Try again shortly.');
      }
    } finally {
      if (inflightRef.current === pauseInstanceId) {
        inflightRef.current = null;
      }
      setLoading(false);
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
    if (!enabled) return;
    void runGeneration();
  }, [enabled, runGeneration]);

  const retry = useCallback(() => {
    inflightRef.current = null;
    void runGeneration();
  }, [runGeneration]);

  return {
    reflectionMessage,
    loading,
    error,
    retry,
  };
}
