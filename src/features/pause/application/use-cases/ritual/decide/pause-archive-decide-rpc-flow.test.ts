import { describe, expect, it } from 'vitest';

import { logRetrospectiveOutcome as logRetrospectiveOutcomeDirect } from './log-retrospective-outcome';

import { logRetrospectiveOutcome } from './pause-archive-decide-rpc-flow';

describe('pause-archive-decide-rpc-flow', () => {
  it('re-exports archive retrospective outcome_logged use case from log-retrospective-outcome', () => {
    expect(typeof logRetrospectiveOutcome).toBe('function');
    expect(logRetrospectiveOutcome).toBe(logRetrospectiveOutcomeDirect);
  });
});
