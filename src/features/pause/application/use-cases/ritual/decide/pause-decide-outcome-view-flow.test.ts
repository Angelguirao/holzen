import { describe, expect, it } from 'vitest';

import {
  formatReinforcementQuoteFromSession as formatQuoteDirect,
  resolvePauseDecideOutcomeFlow as resolveOutcomeFlowDirect,
} from '@/features/pause/domain/decide/pause-decide-outcome-flow';

import {
  formatReinforcementQuoteFromSession,
  resolvePauseDecideOutcomeFlow,
} from './pause-decide-outcome-view-flow';

describe('pause-decide-outcome-view-flow', () => {
  it('re-exports decide outcome flow mapping helpers from domain', () => {
    expect(typeof formatReinforcementQuoteFromSession).toBe('function');
    expect(typeof resolvePauseDecideOutcomeFlow).toBe('function');
    expect(formatReinforcementQuoteFromSession).toBe(formatQuoteDirect);
    expect(resolvePauseDecideOutcomeFlow).toBe(resolveOutcomeFlowDirect);
  });
});
