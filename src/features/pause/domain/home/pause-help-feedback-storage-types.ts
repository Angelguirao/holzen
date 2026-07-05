export type PauseHelpFeedbackStorageState = {
  ratedPauseIds: string[];
  deferredPauseIds: string[];
  deferralCount: number;
  optedOut: boolean;
  lastPromptLocalDate: string | null;
  lastPromptPauseInstanceId: string | null;
  /** ISO timestamp of last successful rating submit — gates re-prompt cooldown. */
  lastSubmittedAt: string | null;
};
