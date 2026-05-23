/** Stale async guard: only the run that captured this validity ticket may commit. */
export function shouldCommitReflectGeneration(validityTicket: number, currentValidity: number): boolean {
  return validityTicket === currentValidity;
}

/** Only the active run id may clear the loading flag in `finally`. */
export function shouldClearReflectGenerationLoading(runId: number, activeRunId: number): boolean {
  return activeRunId === runId;
}
