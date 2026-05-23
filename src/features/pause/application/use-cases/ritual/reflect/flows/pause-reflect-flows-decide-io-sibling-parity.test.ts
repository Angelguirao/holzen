import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import {
  initialDecisionFromRestored,
  initialPhaseFromRestored,
} from '@/features/pause/application/use-cases/session/pause-session-decide-flow';
import * as decideIo from '@/features/pause/presentation/session/pause-session-decide-io';
import * as flowsIo from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import {
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  getSessionQuote,
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  reflectPauseRepository,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';

/**
 * Application sibling parity: flows-io vs session decide-io (parity with
 * `pause-reflect-flows-decide-flow-sibling-parity.test.ts` and presentation
 * `pause-reflect-flows-decide-io-sibling-parity.test.ts`).
 * Reciprocal inline pins: `pause-reflect-flows-io-parity.test.ts` ↔
 * `pause-session-decide-io-parity.test.ts`.
 */
describe('pause-reflect-flows-io ↔ pause-session-decide-io sibling parity (application)', () => {
  it('flows-io and session decide-io are distinct presentation I/O surfaces', () => {
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
    expect(typeof formatReinforcementQuoteFromSession).toBe('function');
    expect(typeof resolvePauseDecideOutcomeFlow).toBe('function');
    expect(typeof getSessionQuote).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');
    expect(typeof pauseReflectOutcomeLog).toBe('function');
    expect(typeof pauseReflectOutcomeLogWithRepository).toBe('function');
    expect(typeof showPauseOutcomeNotCompletedToast).toBe('function');
    expect(typeof showPauseOutcomeSaveFailedToast).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');
    expect(typeof initialDecisionFromRestored).toBe('function');
    expect(typeof initialPhaseFromRestored).toBe('function');

    expect(Object.keys(decideIo)).toEqual([]);
    expect('pauseReflectOutcomeLog' in decideIo).toBe(false);
    expect('resolvePauseSessionReflectAndDecidePreflight' in decideIo).toBe(false);
    expect('reflectPauseRepository' in decideIo).toBe(false);

    expect('initialDecisionFromRestored' in flowsIo).toBe(false);
    expect('initialPhaseFromRestored' in flowsIo).toBe(false);
    expect('pauseReflectOutcomeLog' in decideIo).toBe(false);
    expect('resolvePauseSessionReflectAndDecideAfterGeneration' in decideIo).toBe(false);
  });

  it('reflect+decide flows I/O keeps outcome RPC wrappers off restored decide hydration', () => {
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(initialDecisionFromRestored);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(initialPhaseFromRestored);
    expect(pauseReflectOutcomeLog).not.toBe(initialDecisionFromRestored);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(initialPhaseFromRestored);
    expect(formatReinforcementQuoteFromSession).not.toBe(initialDecisionFromRestored);
    expect(buildPauseScoreImpacts).not.toBe(initialPhaseFromRestored);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(initialPhaseFromRestored);
    expect(getSessionQuote).not.toBe(initialDecisionFromRestored);
    expect(showPauseOutcomeNotCompletedToast).not.toBe(initialPhaseFromRestored);
    expect(showPauseOutcomeSaveFailedToast).not.toBe(initialDecisionFromRestored);
  });

  it('session decide hydration exports stay off reflect+decide preflight and outcome helpers', () => {
    expect(initialDecisionFromRestored).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(initialPhaseFromRestored).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(initialDecisionFromRestored).not.toBe(pauseReflectOutcomeLog);
    expect(initialPhaseFromRestored).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(initialDecisionFromRestored).not.toBe(formatReinforcementQuoteFromSession);
    expect(initialPhaseFromRestored).not.toBe(showPauseOutcomeNotCompletedToast);
    expect(initialDecisionFromRestored).not.toBe(getSessionQuote);
    expect(initialPhaseFromRestored).not.toBe(buildPauseScoreImpacts);
    expect(initialDecisionFromRestored).not.toBe(reflectPauseRepository);
  });
});
