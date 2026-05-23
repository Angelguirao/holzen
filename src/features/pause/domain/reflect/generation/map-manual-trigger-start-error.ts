/** User-facing copy when Home manual trigger fails before RPC. */
export function mapManualTriggerStartError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (raw.includes('fetch') || raw.includes('Failed to fetch')) {
    return 'Could not connect. Check your internet and try again.';
  }
  return 'Could not start a pause right now. Try again in a moment.';
}
