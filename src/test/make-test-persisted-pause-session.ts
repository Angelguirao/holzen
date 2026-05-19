import { type PersistedSession } from '@/features/pause/public';

/**
 * Minimal {@link PersistedSession} for Vitest (pause hydrate helpers, breath RPC mount dedupe, etc.).
 * Keeps defaults aligned across pause-related tests — extend here instead of copying the object literal.
 */
export function makeTestPersistedPauseSession(overrides: Partial<PersistedSession> = {}): PersistedSession {
  return {
    message: 'hello',
    context: null,
    pauseInstanceId: 'p1',
    companions: {
      haiku: null,
      groundingTitle: null,
      groundingBody: null,
    },
    companionPrefs: {
      breathing: true,
      haiku: true,
      grounding: true,
      signal: true,
      zoomOut: true,
      history: true,
    },
    severity: 'mild',
    moodDone: false,
    moodAfterDone: false,
    phase: 'session',
    decision: null,
    step: 'feel',
    ...overrides,
  };
}
