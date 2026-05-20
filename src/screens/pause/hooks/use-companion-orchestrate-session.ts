import { useCallback } from 'react';
import { loadCompanionOrchestrateSession } from '@/features/pause/public';
import { loadMoodHistoryForOrchestrate } from '@/features/pause/public-queries';

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
      loadCompanionOrchestrateSession(
        {
          pauseInstanceId,
          context,
          language,
          reflectionMessage,
          mood,
          severityNumber,
        },
        { loadMoodHistory: loadMoodHistoryForOrchestrate },
      ),
    [pauseInstanceId, context, language, reflectionMessage, mood, severityNumber],
  );
}
