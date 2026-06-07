const HOME_POST_MANUAL_COOLDOWN_IDLE_KEY_PREFIX = 'holzen_home_post_manual_cooldown_idle_v1';

export function homePostManualCooldownIdleStorageKey(userId: string): string {
  return `${HOME_POST_MANUAL_COOLDOWN_IDLE_KEY_PREFIX}_${userId}`;
}

/** True after manual cooldown ends (D → A) until user starts another pause. */
export function shouldShowPostManualCooldownIdlePrompt(userId: string | undefined): boolean {
  if (!userId) return false;
  try {
    return localStorage.getItem(homePostManualCooldownIdleStorageKey(userId)) === '1';
  } catch {
    return false;
  }
}

export function markPostManualCooldownIdlePrompt(userId: string): void {
  try {
    localStorage.setItem(homePostManualCooldownIdleStorageKey(userId), '1');
  } catch {
    void 0;
  }
}

export function clearPostManualCooldownIdlePrompt(userId: string): void {
  try {
    localStorage.removeItem(homePostManualCooldownIdleStorageKey(userId));
  } catch {
    void 0;
  }
}
