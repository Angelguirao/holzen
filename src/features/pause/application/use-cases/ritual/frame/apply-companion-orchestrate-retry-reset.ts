export type CompanionOrchestrateRetryResetInput = {
  pauseInstanceId: string | null;
};

export type CompanionOrchestrateRetryResetPorts = {
  resetFetchedSlots: () => void;
  clearSlotContent: () => void;
  resetRelaxations: () => void;
};

/** Side effects for "retry orchestrate" — clears slot UI state. */
export function applyCompanionOrchestrateRetryReset(
  _input: CompanionOrchestrateRetryResetInput,
  ports: CompanionOrchestrateRetryResetPorts,
): void {
  ports.resetFetchedSlots();
  ports.clearSlotContent();
  ports.resetRelaxations();
}
