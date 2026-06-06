import { describe, expect, it } from 'vitest';

import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle
} from './pause-session-step-handlers-flow';
import * as handlersFlow from './pause-session-step-handlers-flow';
import {
  buildPauseScoreImpacts,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  runPauseOutcomeLog,
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast
} from '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow';
import * as flowsFlow from '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow';

/**
 * Cross-surface application sibling parity: session step-handlers-flow vs reflect flows-flow.
 * Complements presentation `pause-session-step-handlers-flows-io-sibling-parity.test.ts`.
 */
describe('pause-session-step-handlers-flow ↔ pause-reflect-flows-flow sibling parity', () => {
  it('step-handlers-flow and reflect flows-flow are distinct CI anchors', () => {
    expect(typeof buildPauseSessionStepShellBundle).toBe('function');
    expect(typeof buildPauseSessionStepRitualBundle).toBe('function');

    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
    expect(typeof runPauseOutcomeLog).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');

    expect('buildPauseSessionStepShellBundle' in flowsFlow).toBe(false);
    expect('buildPauseSessionStepRitualBundle' in flowsFlow).toBe(false);
    expect('resolvePauseSessionReflectAndDecidePreflight' in handlersFlow).toBe(false);
    expect('runPauseOutcomeLog' in handlersFlow).toBe(false);
    expect('buildPauseScoreImpacts' in handlersFlow).toBe(false);
  });

  it('step-handlers umbrella exports stay off reflect+decide flows CI helpers', () => {
    expect(buildPauseSessionStepShellBundle).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(buildPauseSessionStepRitualBundle).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(buildPauseSessionStepShellBundle).not.toBe(runPauseOutcomeLog);
    expect(buildPauseSessionStepRitualBundle).not.toBe(buildPauseScoreImpacts);
    expect(buildPauseSessionStepShellBundle).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(buildPauseSessionStepRitualBundle).not.toBe(showPauseOutcomeNotCompletedToast);
    expect(buildPauseSessionStepShellBundle).not.toBe(showPauseOutcomeSaveFailedToast);
  });

  it('reflect flows umbrella exports stay off session step bundle builders', () => {
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(buildPauseSessionStepShellBundle);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(buildPauseSessionStepRitualBundle);
    expect(runPauseOutcomeLog).not.toBe(buildPauseSessionStepShellBundle);
    expect(buildPauseScoreImpacts).not.toBe(buildPauseSessionStepRitualBundle);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(buildPauseSessionStepShellBundle);
    expect(showPauseOutcomeNotCompletedToast).not.toBe(buildPauseSessionStepRitualBundle);
    expect(showPauseOutcomeSaveFailedToast).not.toBe(buildPauseSessionStepShellBundle);
  });
});
