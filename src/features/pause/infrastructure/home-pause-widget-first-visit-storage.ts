const HOME_PAUSE_WIDGET_FIRST_VISIT_KEY_PREFIX = 'holzen_home_pause_widget_first_visit_v1';

export function homePauseWidgetFirstVisitStorageKey(userId: string): string {
  return `${HOME_PAUSE_WIDGET_FIRST_VISIT_KEY_PREFIX}_${userId}`;
}

/**
 * False after the user taps idle **Let's pause**, or an open pause exists first
 * (Holzen offer — the first-visit A expanded onboarding is forfeited).
 */
export function shouldExpandHomePauseWidgetFirstVisit(userId: string | undefined): boolean {
  if (!userId) return false;
  try {
    return localStorage.getItem(homePauseWidgetFirstVisitStorageKey(userId)) !== '1';
  } catch {
    return false;
  }
}

export function markHomePauseWidgetFirstVisitHandled(userId: string): void {
  try {
    localStorage.setItem(homePauseWidgetFirstVisitStorageKey(userId), '1');
  } catch {
    void 0;
  }
}
