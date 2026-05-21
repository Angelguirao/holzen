import { useCallback } from 'react';
import { loadPauseCompanionOrchestrateSession } from '@/features/pause/public-rpc';

export type UseCompanionOrchestrateSessionParams = {
  pauseInstanceId?: string | null;
  context?: string | null;
  reflectionMessage?: string | null;
  mood?: string | null;
  severityNumber?: number;
  language: string;
};

/** Async session builder for slot lazy-fetch / regenerate orchestrate invokes. */
export function useCompanionOrchestrateSession({
  pauseInstanceId,
  context,
  reflectionMessage,
  mood,
  severityNumber,
  language,
}: UseCompanionOrchestrateSessionParams) {
  return useCallback(
    () =>
      loadPauseCompanionOrchestrateSession({
        pauseInstanceId,
        context,
        language,
        reflectionMessage,
        mood,
        severityNumber,
      }),
    [pauseInstanceId, context, language, reflectionMessage, mood, severityNumber],
  );
}
