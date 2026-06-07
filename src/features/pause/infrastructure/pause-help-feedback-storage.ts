const STORAGE_KEY_PREFIX = 'holzen_pause_help_feedback_v1';

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

const EMPTY: PauseHelpFeedbackStorageState = {
  ratedPauseIds: [],
  deferredPauseIds: [],
  deferralCount: 0,
  optedOut: false,
  lastPromptLocalDate: null,
  lastPromptPauseInstanceId: null,
  lastSubmittedAt: null,
};

export function pauseHelpFeedbackStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}_${userId}`;
}

function normalizeState(raw: unknown): PauseHelpFeedbackStorageState {
  if (!raw || typeof raw !== 'object') return { ...EMPTY };
  const o = raw as Record<string, unknown>;
  const ids = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

  return {
    ratedPauseIds: ids(o.ratedPauseIds),
    deferredPauseIds: ids(o.deferredPauseIds),
    deferralCount: typeof o.deferralCount === 'number' ? Math.max(0, o.deferralCount) : 0,
    optedOut: o.optedOut === true,
    lastPromptLocalDate: typeof o.lastPromptLocalDate === 'string' ? o.lastPromptLocalDate : null,
    lastPromptPauseInstanceId:
      typeof o.lastPromptPauseInstanceId === 'string' ? o.lastPromptPauseInstanceId : null,
    lastSubmittedAt: typeof o.lastSubmittedAt === 'string' ? o.lastSubmittedAt : null,
  };
}

export function readPauseHelpFeedbackStorage(userId: string | undefined): PauseHelpFeedbackStorageState {
  if (!userId) return { ...EMPTY };
  try {
    const raw = localStorage.getItem(pauseHelpFeedbackStorageKey(userId));
    if (!raw) return { ...EMPTY };
    return normalizeState(JSON.parse(raw));
  } catch {
    return { ...EMPTY };
  }
}

export function writePauseHelpFeedbackStorage(
  userId: string,
  state: PauseHelpFeedbackStorageState,
): void {
  try {
    localStorage.setItem(pauseHelpFeedbackStorageKey(userId), JSON.stringify(state));
  } catch {
    void 0;
  }
}
