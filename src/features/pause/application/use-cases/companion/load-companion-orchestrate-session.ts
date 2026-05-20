import {
  buildCompanionOrchestrateSessionFromRitual,
  type CompanionOrchestrateMoodHistoryEntry,
  type CompanionOrchestrateSessionContext,
} from '../ritual/frame/build-companion-orchestrate-body';

export type LoadCompanionOrchestrateSessionInput = {
  pauseInstanceId?: string | null;
  context?: string | null;
  language: string;
  reflectionMessage?: string | null;
  mood?: string | null;
  severityNumber?: number | null;
};

export type LoadCompanionOrchestrateSessionPorts = {
  loadMoodHistory: () => Promise<CompanionOrchestrateMoodHistoryEntry[]>;
};

/**
 * Loads mood history then builds the ritual session payload for `companion-orchestrate`.
 */
export async function loadCompanionOrchestrateSession(
  input: LoadCompanionOrchestrateSessionInput,
  ports: LoadCompanionOrchestrateSessionPorts,
): Promise<CompanionOrchestrateSessionContext | null> {
  if (!input.pauseInstanceId) return null;
  const moodHistory = await ports.loadMoodHistory();
  return buildCompanionOrchestrateSessionFromRitual({
    pauseInstanceId: input.pauseInstanceId,
    context: input.context,
    language: input.language,
    reflectionMessage: input.reflectionMessage,
    mood: input.mood,
    severityNumber: input.severityNumber,
    moodHistory,
  });
}
