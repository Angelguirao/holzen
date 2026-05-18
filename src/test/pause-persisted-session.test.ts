import { describe, expect, it } from 'vitest';
import { hasPersistedPauseSessionPayload } from '@/features/pause/application/session/persisted-session-guards';
import { DEFAULT_COMPANIONS, DEFAULT_PREFS } from '@/features/pause/domain/session-model';

const base = {
  message: '',
  context: 'ctx',
  pauseInstanceId: 'pause-1',
  companions: DEFAULT_COMPANIONS,
  companionPrefs: DEFAULT_PREFS,
  severity: 'mild' as const,
  moodDone: false,
  moodAfterDone: false,
  phase: 'session' as const,
  decision: null,
  step: 'feel' as const,
};

describe('hasPersistedPauseSessionPayload', () => {
  it('is true when pauseInstanceId is set even if message is empty', () => {
    expect(hasPersistedPauseSessionPayload(base)).toBe(true);
  });

  it('is true when message is non-empty', () => {
    expect(hasPersistedPauseSessionPayload({ ...base, pauseInstanceId: null, message: 'hi' })).toBe(true);
  });

  it('is false when both message and instance id are missing', () => {
    expect(hasPersistedPauseSessionPayload({ ...base, pauseInstanceId: null, message: '' })).toBe(false);
    expect(hasPersistedPauseSessionPayload(null)).toBe(false);
  });
});
