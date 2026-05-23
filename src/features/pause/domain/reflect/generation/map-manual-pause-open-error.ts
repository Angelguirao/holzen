/** Error branch for Home manual open when create-or-reuse throws. */
export type ManualPauseOpenErrorResult = {
  outcome: 'error';
  userMessage: string;
  isNetwork: boolean;
};

export function mapManualPauseOpenError(e: unknown): ManualPauseOpenErrorResult {
  const raw = e instanceof Error ? e.message : String(e);
  if (raw.includes('fetch') || raw.includes('network') || raw.includes('Failed to fetch')) {
    return {
      outcome: 'error',
      userMessage: 'Could not reach Holzen. Check your connection.',
      isNetwork: true,
    };
  }
  return {
    outcome: 'error',
    userMessage: 'Could not open a pause right now. Try again shortly.',
    isNetwork: false,
  };
}
