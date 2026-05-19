/** Payload for `pauseLogStep` with `stepType: 'outcome_logged'`. */
export function buildOutcomeLoggedPayload(outcome: string): Record<string, unknown> {
  return { outcome };
}
