import {
  type PauseHelpFeedbackStorageState,
  readPauseHelpFeedbackStorage,
} from '@/features/pause/infrastructure/pause-help-feedback-storage';

export const PAUSE_HELP_FEEDBACK_MAX_DEFERRALS = 3;
export const PAUSE_HELP_FEEDBACK_MAX_PROMPTS_PER_LOCAL_DAY = 1;
export const PAUSE_HELP_FEEDBACK_SUBMIT_COOLDOWN_DAYS = 7;
export const PAUSE_HELP_FEEDBACK_SUBMIT_COOLDOWN_MS =
  PAUSE_HELP_FEEDBACK_SUBMIT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export function localCalendarYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export type PauseHelpFeedbackEligibilityInput = {
  userId: string | undefined;
  pauseInstanceId: string | null;
  storage?: PauseHelpFeedbackStorageState;
  now?: Date;
};

/** Whether Home should open the post-pause help bottom sheet for this completed instance. */
export function shouldShowPauseHelpFeedback(input: PauseHelpFeedbackEligibilityInput): boolean {
  const { userId, pauseInstanceId } = input;
  if (!userId || !pauseInstanceId) return false;

  const storage = input.storage ?? readPauseHelpFeedbackStorage(userId);
  if (storage.optedOut) return false;
  if (storage.ratedPauseIds.includes(pauseInstanceId)) return false;
  if (storage.deferredPauseIds.includes(pauseInstanceId)) return false;

  const now = input.now ?? new Date();
  if (storage.lastSubmittedAt) {
    const submittedAt = new Date(storage.lastSubmittedAt).getTime();
    if (
      Number.isFinite(submittedAt) &&
      now.getTime() - submittedAt < PAUSE_HELP_FEEDBACK_SUBMIT_COOLDOWN_MS
    ) {
      return false;
    }
  }
  const today = localCalendarYmd(now);
  if (
    storage.lastPromptLocalDate === today &&
    storage.lastPromptPauseInstanceId !== pauseInstanceId
  ) {
    return false;
  }

  return true;
}

export function buildPauseHelpFeedbackMessage(rating: number, comment: string | null): string {
  const stars = `${rating}/5`;
  const trimmed = comment?.trim();
  if (!trimmed) return `Pause help rating: ${stars}`;
  return `Pause help rating: ${stars}\n\n${trimmed}`;
}
