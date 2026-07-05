const HOME_GREETING_SEEN_KEY_PREFIX = 'holzen_home_greeting_seen_v1';

export type HomeGreetingVariant = 'helloName' | 'welcome' | 'helloAgain';

export function homeGreetingSeenStorageKey(userId: string): string {
  return `${HOME_GREETING_SEEN_KEY_PREFIX}_${userId}`;
}

export function hasSeenHomeGreeting(userId: string | undefined): boolean {
  if (!userId) return false;
  try {
    return localStorage.getItem(homeGreetingSeenStorageKey(userId)) === '1';
  } catch {
    return false;
  }
}

export function markHomeGreetingSeen(userId: string): void {
  try {
    localStorage.setItem(homeGreetingSeenStorageKey(userId), '1');
  } catch {
    void 0;
  }
}

/** Name wins; otherwise first Home visit is Welcome, later visits Hello, again. */
export function resolveHomeGreetingVariant(
  firstName: string | null | undefined,
  hasSeenBefore: boolean,
): HomeGreetingVariant {
  const name = firstName?.trim();
  if (name) return 'helloName';
  if (!hasSeenBefore) return 'welcome';
  return 'helloAgain';
}
