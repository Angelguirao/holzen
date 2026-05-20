import { trackEvent } from '@/lib/posthog';

const PAUSE_MANUAL_START_HOME = 'holzen_sess_pause_manual_started_home';

export type PauseManualStartedSurface = 'home';

/** PostHog: user starts a manual home pause (taxonomy: pause.manual_started). */
export function trackPauseManualStarted(surface: PauseManualStartedSurface): void {
  try {
    trackEvent('pause.manual_started', { surface });
  } catch {
    /* no-op */
  }
}

/** Once per tab session before opening a manual pause from Home. */
export function markPauseManualStartedHomeOnce(): void {
  try {
    if (sessionStorage.getItem(PAUSE_MANUAL_START_HOME)) return;
    sessionStorage.setItem(PAUSE_MANUAL_START_HOME, '1');
    trackPauseManualStarted('home');
  } catch {
    /* sessionStorage unavailable */
  }
}
