import { describe, expect, it } from 'vitest';

import {
  initialDecisionFromRestored,
  initialPhaseFromRestored,
} from '@/features/pause/application/use-cases/session/pause-session-decide-flow';
import * as decideFlow from '@/features/pause/application/use-cases/session/pause-session-decide-flow';
import {
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  getSessionQuote,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  runPauseOutcomeLog,
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow';
import * as flowsFlow from '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow';

/**
 * Presentation mirror of application flow sibling parity (CI anchors only — production I/O
 * uses `pause-reflect-flows-io` / `pause-session-decide-io` leaf bindings).
 * Application source: `application/.../flows/pause-reflect-flows-decide-flow-sibling-parity.test.ts`.
 */
describe('pause-reflect-flows-flow ↔ pause-session-decide-flow sibling parity (presentation)', () => {
  it('flows-flow and session decide-flow are distinct sibling CI anchors', () => {
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
    expect(typeof formatReinforcementQuoteFromSession).toBe('function');
    expect(typeof resolvePauseDecideOutcomeFlow).toBe('function');
    expect(typeof getSessionQuote).toBe('function');
    expect(typeof runPauseOutcomeLog).toBe('function');
    expect(typeof showPauseOutcomeNotCompletedToast).toBe('function');
    expect(typeof showPauseOutcomeSaveFailedToast).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');
    expect(typeof initialDecisionFromRestored).toBe('function');
    expect(typeof initialPhaseFromRestored).toBe('function');

    expect('initialDecisionFromRestored' in flowsFlow).toBe(false);
    expect('initialPhaseFromRestored' in flowsFlow).toBe(false);
    expect('resolvePauseSessionReflectAndDecidePreflight' in decideFlow).toBe(false);
    expect('resolvePauseSessionReflectAndDecideAfterGeneration' in decideFlow).toBe(false);
    expect('formatReinforcementQuoteFromSession' in decideFlow).toBe(false);
    expect('resolvePauseDecideOutcomeFlow' in decideFlow).toBe(false);
    expect('runPauseOutcomeLog' in decideFlow).toBe(false);
    expect('buildPauseScoreImpacts' in decideFlow).toBe(false);
  });

  it('reflect+decide flows umbrella exports stay off restored decide hydration', () => {
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(initialDecisionFromRestored);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(initialPhaseFromRestored);
    expect(runPauseOutcomeLog).not.toBe(initialDecisionFromRestored);
    expect(formatReinforcementQuoteFromSession).not.toBe(initialPhaseFromRestored);
    expect(buildPauseScoreImpacts).not.toBe(initialDecisionFromRestored);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(initialPhaseFromRestored);
  });

  it('session decide-flow exports stay off reflect+decide preflight and outcome helpers', () => {
    expect(initialDecisionFromRestored).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(initialPhaseFromRestored).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(initialDecisionFromRestored).not.toBe(runPauseOutcomeLog);
    expect(initialPhaseFromRestored).not.toBe(formatReinforcementQuoteFromSession);
    expect(initialDecisionFromRestored).not.toBe(showPauseOutcomeNotCompletedToast);
    expect(initialPhaseFromRestored).not.toBe(getSessionQuote);
  });
});
