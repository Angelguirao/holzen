import { describe, expect, it } from 'vitest';

import {
  buildPauseScoreImpacts,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  runPauseOutcomeLog,
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast
} from '../flows/pause-reflect-flows-flow';
import * as flowsFlow from '../flows/pause-reflect-flows-flow';
import {
  runPauseFavoriteToggle,
  runPauseReflectNoteUpdate,
  runPauseReflectTagUpdate,
  runPauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint
} from './pause-reflect-steps-flow';
import * as stepsFlow from './pause-reflect-steps-flow';

/**
 * Flow-level sibling parity (parity with `pause-reflect-steps-flows-io-sibling-parity.test.ts`
 * and `pause-reflect-flows-steps-io-sibling-parity.test.ts`).
 */
describe('pause-reflect-steps-flow ↔ pause-reflect-flows-flow sibling parity', () => {
  it('steps-flow and flows-flow are distinct sibling CI anchors', () => {
    expect(typeof runPauseFavoriteToggle).toBe('function');
    expect(typeof runPauseReflectNoteUpdate).toBe('function');
    expect(typeof runPauseReflectTagUpdate).toBe('function');
    expect(typeof runPauseReflectionStepLogOnce).toBe('function');
    expect(typeof shouldShowFavoriteProHint).toBe('function');
    expect(typeof shouldLogPauseReflectionStep).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
    expect(typeof resolvePauseDecideOutcomeFlow).toBe('function');
    expect(typeof runPauseOutcomeLog).toBe('function');
    expect(typeof showPauseOutcomeNotCompletedToast).toBe('function');
    expect(typeof showPauseOutcomeSaveFailedToast).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');

    expect('resolvePauseSessionReflectAndDecidePreflight' in stepsFlow).toBe(false);
    expect('resolvePauseSessionReflectAndDecideAfterGeneration' in stepsFlow).toBe(false);
    expect('resolvePauseDecideOutcomeFlow' in stepsFlow).toBe(false);
    expect('runPauseOutcomeLog' in stepsFlow).toBe(false);
    expect('showPauseOutcomeNotCompletedToast' in stepsFlow).toBe(false);
    expect('showPauseOutcomeSaveFailedToast' in stepsFlow).toBe(false);
    expect('buildPauseScoreImpacts' in stepsFlow).toBe(false);
    expect('runPauseFavoriteToggle' in flowsFlow).toBe(false);
    expect('runPauseReflectNoteUpdate' in flowsFlow).toBe(false);
    expect('runPauseReflectTagUpdate' in flowsFlow).toBe(false);
    expect('runPauseReflectionStepLogOnce' in flowsFlow).toBe(false);
    expect('shouldShowFavoriteProHint' in flowsFlow).toBe(false);
    expect('shouldLogPauseReflectionStep' in flowsFlow).toBe(false);
  });

  it('steps umbrella exports stay off reflect+decide flows and outcome helpers', () => {
    expect(runPauseFavoriteToggle).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(runPauseReflectNoteUpdate).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(runPauseReflectionStepLogOnce).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(shouldShowFavoriteProHint).not.toBe(runPauseOutcomeLog);
    expect(shouldLogPauseReflectionStep).not.toBe(runPauseOutcomeLog);
    expect(shouldShowFavoriteProHint).not.toBe(showPauseOutcomeNotCompletedToast);
    expect(shouldLogPauseReflectionStep).not.toBe(buildPauseScoreImpacts);
  });

  it('flows umbrella exports stay off step mutations and domain step gates', () => {
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(runPauseFavoriteToggle);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(runPauseReflectNoteUpdate);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(shouldShowFavoriteProHint);
    expect(runPauseOutcomeLog).not.toBe(runPauseReflectionStepLogOnce);
    expect(runPauseOutcomeLog).not.toBe(shouldLogPauseReflectionStep);
    expect(showPauseOutcomeSaveFailedToast).not.toBe(runPauseReflectTagUpdate);
    expect(buildPauseScoreImpacts).not.toBe(shouldShowFavoriteProHint);
  });
});
