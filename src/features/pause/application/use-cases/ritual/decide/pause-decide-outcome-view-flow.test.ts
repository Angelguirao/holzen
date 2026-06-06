import { describe, expect, it } from 'vitest';

import { resolvePauseDecideOutcomeFlow as resolveOutcomeFlowDirect } from '@/features/pause/domain/decide/pause-decide-outcome-flow';

import { resolvePauseDecideOutcomeFlow } from './pause-decide-outcome-view-flow';

describe('pause-decide-outcome-view-flow', () => {
  it('re-exports decide outcome flow mapping helpers from domain', () => {
    expect(typeof resolvePauseDecideOutcomeFlow).toBe('function');
    expect(resolvePauseDecideOutcomeFlow).toBe(resolveOutcomeFlowDirect);
  });
});
