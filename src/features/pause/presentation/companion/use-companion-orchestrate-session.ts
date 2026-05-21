import { useCallback } from 'react';
import { pauseLoadCompanionOrchestrateSession } from '@/features/pause/presentation/companion/pause-companion-orchestration-io';

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
      pauseLoadCompanionOrchestrateSession({
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
