import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
}));

import {
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  getSessionQuote,
  parseScoreImpactVolatilityPct,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  resolveScoreImpactDisplayImpacts,
  resolveScoreImpactViewMode,
  runPauseOutcomeLog,
  scoreImpactMotionDelaySec,
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow';
import * as flowsFlow from '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow';
import {
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  reflectPauseRepository,
} from './pause-reflect-flows-io';
import * as flowsIo from './pause-reflect-flows-io';

/**
 * Presentation sibling parity: flows-flow CI umbrella vs flows-io port-bound wrappers.
 * Mirrors application `pause-reflect-flows-flow-io-wrapper-sibling-parity.test.ts`
 * (colocated beside `pause-reflect-flows-io.ts`).
 * Delegation parity: colocated `pause-reflect-flows-io-parity.test.ts`.
 */
describe('pause-reflect-flows-flow ↔ pause-reflect-flows-io wrapper sibling parity (presentation)', () => {
  it('flows-flow CI umbrella and presentation flows-io are distinct anchors', () => {
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
    expect(typeof resolvePauseDecideOutcomeFlow).toBe('function');
    expect(typeof formatReinforcementQuoteFromSession).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');
    expect(typeof runPauseOutcomeLog).toBe('function');
    expect(typeof getSessionQuote).toBe('function');
    expect(typeof pauseReflectOutcomeLog).toBe('function');
    expect(typeof pauseReflectOutcomeLogWithRepository).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect('pauseReflectOutcomeLog' in flowsFlow).toBe(false);
    expect('pauseReflectOutcomeLogWithRepository' in flowsFlow).toBe(false);
    expect('reflectPauseRepository' in flowsFlow).toBe(false);
    expect('runPauseOutcomeLog' in flowsIo).toBe(false);
  });

  it('flows-flow umbrella exports stay off presentation port-bound wrappers', () => {
    expect(runPauseOutcomeLog).not.toBe(pauseReflectOutcomeLog);
    expect(runPauseOutcomeLog).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(runPauseOutcomeLog).not.toBe(reflectPauseRepository);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(pauseReflectOutcomeLog);
    expect(getSessionQuote).not.toBe(reflectPauseRepository);
  });

  it('presentation flows-io wrappers stay off flows-flow leaf re-exports', () => {
    expect(pauseReflectOutcomeLog).not.toBe(runPauseOutcomeLog);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(runPauseOutcomeLog);
    expect(pauseReflectOutcomeLog).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(reflectPauseRepository).not.toBe(runPauseOutcomeLog);
    expect(pauseReflectOutcomeLog).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(buildPauseScoreImpacts);
  });
});
