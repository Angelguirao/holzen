import { describe, expect, it } from 'vitest';
import { pauseCreateSkippedUserMessage } from './pause-create-skipped-user-message';

describe('pauseCreateSkippedUserMessage', () => {
  it('maps recent_dismissal reuse reason', () => {
    expect(pauseCreateSkippedUserMessage('recent_dismissal')).toContain('recently dismissed');
  });

  it('maps fingerprint_match reuse reason', () => {
    expect(pauseCreateSkippedUserMessage('fingerprint_match')).toContain('open pause');
  });

  it('falls back for unknown reuse reason', () => {
    expect(pauseCreateSkippedUserMessage(null)).toBe('Could not open a pause right now. Try again shortly.');
  });
});
