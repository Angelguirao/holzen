export type CompanionOrchestrateRetryResetInput = {
  pauseInstanceId: string | null;
  interventionSkipped: boolean;
};

export type CompanionOrchestrateRetryResetPorts = {
  resetInterventionIdempotency: (pauseInstanceId: string) => void;
  queuePendingRetryConfirm: (pauseInstanceId: string) => void;
  resetFetchedSlots: () => void;
  clearSlotContent: () => void;
  clearInterventionFetchDedupe: () => void;
  resetRelaxations: () => void;
};

/**
 * Side effects for "retry orchestrate" — clears idempotency, slot UI, intervention dedupe.
 * Caller bumps `retryCount` to re-run intervention bootstrap effect.
 */
export function applyCompanionOrchestrateRetryReset(
  input: CompanionOrchestrateRetryResetInput,
  ports: CompanionOrchestrateRetryResetPorts,
): void {
  const id = input.pauseInstanceId;
  if (id) {
    ports.resetInterventionIdempotency(id);
    if (input.interventionSkipped) {
      ports.queuePendingRetryConfirm(id);
    }
  }
  ports.resetFetchedSlots();
  ports.clearSlotContent();
  ports.clearInterventionFetchDedupe();
  ports.resetRelaxations();
}
