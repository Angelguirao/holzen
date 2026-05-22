import { describe, expect, it } from 'vitest';

import { runPauseReflectNoteUpdate as runNoteDirect } from './run-pause-reflect-note-update';
import { runPauseReflectNoteUpdate } from './pause-reflect-note-flow';
import { runPauseReflectTagUpdate as runTagFromTagFlow } from './pause-reflect-tag-flow';
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

  it('sibling cluster: tag-flow export stays distinct from note-flow export', () => {
    expect(runPauseReflectNoteUpdate).not.toBe(runTagFromTagFlow);
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
