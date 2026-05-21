import { describe, expect, it } from 'vitest';
import {
  initialDecisionFromRestored,
  initialPhaseFromRestored,
} from './pause-session-decide-io';

describe('pause-session-decide-io', () => {
  it('re-exports restored decide ritual hydration helpers', () => {
    expect(initialPhaseFromRestored(null)).toBe('session');
    expect(initialPhaseFromRestored({ phase: 'done' } as Parameters<typeof initialPhaseFromRestored>[0])).toBe('done');
    expect(initialDecisionFromRestored(null)).toBeNull();
    expect(
      initialDecisionFromRestored({ decision: 'hold' } as Parameters<typeof initialDecisionFromRestored>[0]),
    ).toBe('hold');
  });
});
