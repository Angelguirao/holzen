import { describe, expect, it } from 'vitest';
import { buildOutcomeLoggedPayload } from '@/features/pause/public';

describe('buildOutcomeLoggedPayload', () => {
  it('wraps the decision string', () => {
    expect(buildOutcomeLoggedPayload('held')).toEqual({ outcome: 'held' });
  });
});
