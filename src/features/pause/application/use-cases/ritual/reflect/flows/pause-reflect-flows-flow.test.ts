import { describe, expect, it } from 'vitest';

import {
  buildPauseScoreImpacts,
  getSessionQuote,
  resolvePauseSessionReflectAndDecidePreflight,
  runPauseOutcomeLog,
} from './pause-reflect-flows-flow';

describe('pause-reflect-flows-flow', () => {
  it('re-exports reflect+decide helpers from domain + ritual/decide leaf modules', () => {
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof getSessionQuote).toBe('function');
    expect(typeof runPauseOutcomeLog).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');
  });
});
