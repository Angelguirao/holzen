import { describe, expect, it } from 'vitest';

import { shouldLogPauseReflectionStep } from '@/features/pause/domain/reflect/steps/reflection-step-log';

import {
  runPauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep as shouldLogFromFlow,
} from './pause-reflection-step-log-flow';
import { runPauseReflectionStepLogOnce as runReflectionStepDirect } from './run-pause-reflection-step-log';
import {
  runPauseReflectNoteUpdate as runNoteFromNoteFlow,
} from './pause-reflect-note-flow';
import {
  runPauseReflectTagUpdate as runTagFromTagFlow,
} from './pause-reflect-tag-flow';
import {
  runPauseFavoriteToggle as runFavoriteFromToggleFlow,
  shouldShowFavoriteProHint as shouldShowFromToggleFlow,
} from './pause-favorite-toggle-flow';
import {
  runPauseReflectNoteUpdate as runNoteFromStepsFlow,
  runPauseReflectTagUpdate as runTagFromStepsFlow,
  runPauseFavoriteToggle as runFavoriteFromStepsFlow,
  runPauseReflectionStepLogOnce as runReflectionStepFromStepsFlow,
  shouldLogPauseReflectionStep as shouldLogFromStepsFlow,
  shouldShowFavoriteProHint as shouldShowFavoriteFromStepsFlow,
} from './pause-reflect-steps-flow';

describe('pause-reflection-step-log-flow', () => {
  it('re-exports reflection_step log use case and domain dedupe gate', () => {
    expect(typeof runPauseReflectionStepLogOnce).toBe('function');
    expect(typeof shouldLogFromFlow).toBe('function');

    expect(runPauseReflectionStepLogOnce).toBe(runReflectionStepDirect);
    expect(shouldLogFromFlow).toBe(shouldLogPauseReflectionStep);
  });

  /**
   * Reciprocal inline pins ↔ `pause-favorite-toggle-flow.test.ts` (reflection_step log vs favorite).
   * Dedicated sibling files: `pause-favorite-toggle-reflection-step-log-flow-sibling-parity.test.ts`,
   * `pause-reflect-steps-favorite-reflection-step-log-flow-sibling-parity.test.ts`.
   */
  it('sibling cluster: favorite-toggle-flow exports stay distinct from reflection-step-log-flow exports', () => {
    expect(runPauseReflectionStepLogOnce).not.toBe(runFavoriteFromToggleFlow);
    expect(shouldLogFromFlow).not.toBe(shouldShowFromToggleFlow);
    expect(runPauseReflectionStepLogOnce).not.toBe(shouldShowFromToggleFlow);
    expect(shouldLogFromFlow).not.toBe(runFavoriteFromToggleFlow);
    expect(runPauseReflectionStepLogOnce).not.toBe(runNoteFromNoteFlow);
    expect(runPauseReflectionStepLogOnce).not.toBe(runTagFromTagFlow);
    expect(shouldLogFromFlow).not.toBe(runFavoriteFromToggleFlow);
    expect(shouldLogFromFlow).not.toBe(shouldShowFromToggleFlow);
    // Full umbrella pins: `pause-reflect-steps-flow.test.ts`.
  });

  it('sibling cluster: steps-flow exports stay distinct from reflection-step-log-flow export', () => {
    expect(runPauseReflectionStepLogOnce).not.toBe(runFavoriteFromStepsFlow);
    expect(runPauseReflectionStepLogOnce).not.toBe(runNoteFromStepsFlow);
    expect(runPauseReflectionStepLogOnce).not.toBe(runTagFromStepsFlow);
    expect(shouldLogFromFlow).not.toBe(shouldShowFavoriteFromStepsFlow);
    expect(runPauseReflectionStepLogOnce).toBe(runReflectionStepFromStepsFlow);
    expect(shouldLogFromFlow).toBe(shouldLogFromStepsFlow);
    // Full cross-flow pins: `pause-reflect-steps-favorite-reflection-step-log-flow-sibling-parity.test.ts`.
  });
});
