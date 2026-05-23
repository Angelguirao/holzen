import { describe, expect, it } from 'vitest';

import { shouldShowFavoriteProHint } from '@/features/pause/domain/reflect/steps/favorite-toggle';

import { runPauseFavoriteToggle as runFavoriteDirect } from './run-pause-favorite-toggle';
import { runPauseFavoriteToggle, shouldShowFavoriteProHint as shouldShowFromFlow } from './pause-favorite-toggle-flow';
import {
  runPauseReflectNoteUpdate as runNoteFromNoteFlow,
} from './pause-reflect-note-flow';
import {
  runPauseReflectTagUpdate as runTagFromTagFlow,
} from './pause-reflect-tag-flow';
import {
  runPauseReflectionStepLogOnce as runReflectionStepFromLogFlow,
  shouldLogPauseReflectionStep as shouldLogFromLogFlow,
} from './pause-reflection-step-log-flow';
import {
  runPauseReflectNoteUpdate as runNoteFromStepsFlow,
  runPauseReflectTagUpdate as runTagFromStepsFlow,
  runPauseFavoriteToggle as runFavoriteFromStepsFlow,
  runPauseReflectionStepLogOnce as runReflectionStepFromStepsFlow,
  shouldLogPauseReflectionStep as shouldLogFromStepsFlow,
  shouldShowFavoriteProHint as shouldShowFavoriteFromStepsFlow,
} from './pause-reflect-steps-flow';

describe('pause-favorite-toggle-flow', () => {
  it('re-exports favorite toggle use case and domain pro-hint gate', () => {
    expect(typeof runPauseFavoriteToggle).toBe('function');
    expect(typeof shouldShowFromFlow).toBe('function');

    expect(runPauseFavoriteToggle).toBe(runFavoriteDirect);
    expect(shouldShowFromFlow).toBe(shouldShowFavoriteProHint);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflection-step-log-flow.test.ts` (favorite vs reflection_step log).
   * Dedicated sibling files: `pause-favorite-toggle-reflection-step-log-flow-sibling-parity.test.ts`,
   * `pause-reflect-steps-favorite-reflection-step-log-flow-sibling-parity.test.ts`.
   */
  it('sibling cluster: reflection-step-log-flow exports stay distinct from favorite-toggle-flow exports', () => {
    expect(runPauseFavoriteToggle).not.toBe(runReflectionStepFromLogFlow);
    expect(shouldShowFromFlow).not.toBe(shouldLogFromLogFlow);
    expect(runPauseFavoriteToggle).not.toBe(shouldLogFromLogFlow);
    expect(shouldShowFromFlow).not.toBe(runReflectionStepFromLogFlow);
    expect(runPauseFavoriteToggle).not.toBe(runNoteFromNoteFlow);
    expect(runPauseFavoriteToggle).not.toBe(runTagFromTagFlow);
    expect(shouldShowFromFlow).not.toBe(runReflectionStepFromLogFlow);
    expect(shouldShowFromFlow).not.toBe(shouldLogFromLogFlow);
    // Full umbrella pins: `pause-reflect-steps-flow.test.ts`.
  });

  it('sibling cluster: steps-flow exports stay distinct from favorite-toggle-flow export', () => {
    expect(runPauseFavoriteToggle).not.toBe(runNoteFromStepsFlow);
    expect(runPauseFavoriteToggle).not.toBe(runTagFromStepsFlow);
    expect(runPauseFavoriteToggle).not.toBe(runReflectionStepFromStepsFlow);
    expect(shouldShowFromFlow).not.toBe(shouldLogFromStepsFlow);
    expect(runPauseFavoriteToggle).toBe(runFavoriteFromStepsFlow);
    expect(shouldShowFromFlow).toBe(shouldShowFavoriteFromStepsFlow);
    // Full cross-flow pins: `pause-reflect-steps-favorite-reflection-step-log-flow-sibling-parity.test.ts`.
  });
});
