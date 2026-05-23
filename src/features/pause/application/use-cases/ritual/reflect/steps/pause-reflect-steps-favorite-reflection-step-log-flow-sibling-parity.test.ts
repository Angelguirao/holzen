import { describe, expect, it } from 'vitest';

import {
  runPauseFavoriteToggle,
  shouldShowFavoriteProHint,
} from './pause-favorite-toggle-flow';
import {
  runPauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep,
} from './pause-reflection-step-log-flow';
import {
  runPauseFavoriteToggle as runFavoriteFromStepsFlow,
  runPauseReflectionStepLogOnce as runReflectionStepFromStepsFlow,
  runPauseReflectNoteUpdate as runNoteFromStepsFlow,
  runPauseReflectTagUpdate as runTagFromStepsFlow,
  shouldLogPauseReflectionStep as shouldLogFromStepsFlow,
  shouldShowFavoriteProHint as shouldShowFavoriteFromStepsFlow,
} from './pause-reflect-steps-flow';
import * as favoriteFlow from './pause-favorite-toggle-flow';
import * as reflectionStepLogFlow from './pause-reflection-step-log-flow';
import * as stepsFlow from './pause-reflect-steps-flow';

/**
 * Application sibling parity: steps umbrella vs favorite-toggle / reflection-step-log
 * subcluster CI anchors (parity with `pause-reflect-steps-note-tag-flow-sibling-parity.test.ts`;
 * complements `pause-favorite-toggle-reflection-step-log-flow-sibling-parity.test.ts` and
 * reciprocal inline pins on `pause-favorite-toggle-flow.test.ts` /
 * `pause-reflection-step-log-flow.test.ts`).
 */
describe('pause-reflect-steps-flow ↔ pause-favorite-toggle-flow / pause-reflection-step-log-flow sibling parity', () => {
  it('steps-flow, favorite-toggle-flow, and reflection-step-log-flow are distinct sibling CI anchors', () => {
    expect(typeof runFavoriteFromStepsFlow).toBe('function');
    expect(typeof runReflectionStepFromStepsFlow).toBe('function');
    expect(typeof runPauseFavoriteToggle).toBe('function');
    expect(typeof runPauseReflectionStepLogOnce).toBe('function');

    expect('runPauseFavoriteToggle' in stepsFlow).toBe(true);
    expect('runPauseReflectionStepLogOnce' in stepsFlow).toBe(true);
    expect('shouldShowFavoriteProHint' in stepsFlow).toBe(true);
    expect('shouldLogPauseReflectionStep' in stepsFlow).toBe(true);
    expect('runPauseFavoriteToggle' in favoriteFlow).toBe(true);
    expect('runPauseReflectionStepLogOnce' in favoriteFlow).toBe(false);
    expect('runPauseFavoriteToggle' in reflectionStepLogFlow).toBe(false);
    expect('runPauseReflectionStepLogOnce' in reflectionStepLogFlow).toBe(true);
    expect('runPauseReflectNoteUpdate' in favoriteFlow).toBe(false);
    expect('runPauseReflectTagUpdate' in reflectionStepLogFlow).toBe(false);
  });

  it('steps umbrella exports stay off favorite-toggle / reflection_step log leaf bindings', () => {
    expect(runFavoriteFromStepsFlow).toBe(runPauseFavoriteToggle);
    expect(runReflectionStepFromStepsFlow).toBe(runPauseReflectionStepLogOnce);
    expect(shouldShowFavoriteFromStepsFlow).toBe(shouldShowFavoriteProHint);
    expect(shouldLogFromStepsFlow).toBe(shouldLogPauseReflectionStep);
    expect(runFavoriteFromStepsFlow).not.toBe(runPauseReflectionStepLogOnce);
    expect(runReflectionStepFromStepsFlow).not.toBe(runPauseFavoriteToggle);
    expect(runFavoriteFromStepsFlow).not.toBe(runNoteFromStepsFlow);
    expect(runReflectionStepFromStepsFlow).not.toBe(runTagFromStepsFlow);
  });

  it('favorite-toggle and reflection_step log subcluster exports stay off steps umbrella-only bindings', () => {
    expect(runPauseFavoriteToggle).not.toBe(runReflectionStepFromStepsFlow);
    expect(runPauseReflectionStepLogOnce).not.toBe(runFavoriteFromStepsFlow);
    expect(shouldShowFavoriteProHint).not.toBe(shouldLogFromStepsFlow);
    expect(shouldLogPauseReflectionStep).not.toBe(shouldShowFavoriteFromStepsFlow);
    expect(runPauseFavoriteToggle).not.toBe(runNoteFromStepsFlow);
    expect(runPauseReflectionStepLogOnce).not.toBe(runTagFromStepsFlow);
  });
});
