import { describe, expect, it } from 'vitest';
import { buildOutcomeLoggedPayload } from './outcome-log-payload';

describe('buildOutcomeLoggedPayload', () => {
  it('wraps the decision string', () => {
    expect(buildOutcomeLoggedPayload('held')).toEqual({ outcome: 'held' });
  });
});
