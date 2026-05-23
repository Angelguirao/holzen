export type CompanionFullviewKind = 'signal' | 'grounding' | 'history' | 'zoomOut';

export interface LogCompanionFullviewOpenedInput {
  userId: string;
  companion: CompanionFullviewKind;
  pauseInstanceId: string;
}

export function buildCompanionFullviewOpenedMetadata(
  input: Omit<LogCompanionFullviewOpenedInput, 'userId'>,
): Record<string, unknown> {
  return {
    companion: input.companion,
    pause_instance_id: input.pauseInstanceId,
    ts: new Date().toISOString(),
  };
}
