import { describe, expect, it } from 'vitest';

import { runPauseReflectNoteUpdate as runNoteDirect } from './run-pause-reflect-note-update';
import { runPauseReflectNoteUpdate } from './pause-reflect-note-flow';
import { runPauseReflectTagUpdate as runTagFromTagFlow } from './pause-reflect-tag-flow';
import {
  runPauseReflectionStepLogOnce as runReflectionStepFromLogFlow,
  shouldLogPauseReflectionStep as shouldLogFromLogFlow,
} from './pause-reflection-step-log-flow';
import {
  runPauseFavoriteToggle as runFavoriteFromToggleFlow,
  shouldShowFavoriteProHint as shouldShowFromToggleFlow,
} from './pause-favorite-toggle-flow';
import {
  runPauseFavoriteToggle as runFavoriteFromStepsFlow,
  runPauseReflectTagUpdate as runTagFromStepsFlow,
  runPauseReflectionStepLogOnce as runReflectionStepFromStepsFlow,
  shouldLogPauseReflectionStep as shouldLogFromStepsFlow,
  shouldShowFavoriteProHint as shouldShowFavoriteFromStepsFlow,
} from './pause-reflect-steps-flow';

describe('pause-reflect-note-flow', () => {
  it('re-exports note update use case from leaf module', () => {
    expect(typeof runPauseReflectNoteUpdate).toBe('function');
    expect(runPauseReflectNoteUpdate).toBe(runNoteDirect);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-tag-flow.test.ts` (note vs tag subclusters).
   * Dedicated sibling file: `pause-reflect-note-tag-flow-sibling-parity.test.ts`.
   */
  it('sibling cluster: tag-flow export stays distinct from note-flow export', () => {
    expect(runPauseReflectNoteUpdate).not.toBe(runTagFromTagFlow);
    expect(runPauseReflectNoteUpdate).not.toBe(runReflectionStepFromLogFlow);
    expect(runPauseReflectNoteUpdate).not.toBe(shouldLogFromLogFlow);
    expect(runPauseReflectNoteUpdate).not.toBe(runFavoriteFromToggleFlow);
    expect(runPauseReflectNoteUpdate).not.toBe(shouldShowFromToggleFlow);
    expect(runPauseReflectNoteUpdate).not.toBe(runFavoriteFromStepsFlow);
    expect(runPauseReflectNoteUpdate).not.toBe(runReflectionStepFromStepsFlow);
    // Reciprocal inline pins: `pause-reflect-tag-flow.test.ts`.
  });

  it('sibling cluster: steps-flow exports stay distinct from note-flow export', () => {
    expect(runPauseReflectNoteUpdate).not.toBe(runFavoriteFromStepsFlow);
    expect(runPauseReflectNoteUpdate).not.toBe(runTagFromStepsFlow);
    expect(runPauseReflectNoteUpdate).not.toBe(runReflectionStepFromStepsFlow);
    expect(runPauseReflectNoteUpdate).not.toBe(shouldShowFavoriteFromStepsFlow);
    expect(runPauseReflectNoteUpdate).not.toBe(shouldLogFromStepsFlow);
    // Full cross-flow pins: `pause-reflect-steps-note-tag-flow-sibling-parity.test.ts`.
  });
});
