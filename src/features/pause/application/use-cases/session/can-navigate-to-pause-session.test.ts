import { describe, expect, it } from 'vitest';
import { canNavigateToPauseSession } from './can-navigate-to-pause-session';

describe('canNavigateToPauseSession', () => {
  it('allows navigation with only pauseInstanceId (non-silent manual path)', () => {
    expect(canNavigateToPauseSession(null, 'pause-uuid')).toBe(true);
  });

  it('allows navigation with reflection message only', () => {
    expect(canNavigateToPauseSession('Take a breath.', null)).toBe(true);
  });

  it('blocks when both are empty', () => {
    expect(canNavigateToPauseSession(null, null)).toBe(false);
    expect(canNavigateToPauseSession('', null)).toBe(false);
    expect(canNavigateToPauseSession('   ', null)).toBe(false);
  });
});
