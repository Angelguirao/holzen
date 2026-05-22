import { describe, expect, it } from 'vitest';

import { runPauseReflectTagUpdate as runTagDirect } from './run-pause-reflect-tag-update';
import { runPauseReflectTagUpdate } from './pause-reflect-tag-flow';
import { runPauseReflectNoteUpdate as runNoteFromNoteFlow } from './pause-reflect-note-flow';
import {
  runPauseFavoriteToggle as runFavoriteFromStepsFlow,
  runPauseReflectNoteUpdate as runNoteFromStepsFlow,
  runPauseReflectionStepLogOnce as runReflectionStepFromStepsFlow,
  shouldLogPauseReflectionStep as shouldLogFromStepsFlow,
  shouldShowFavoriteProHint as shouldShowFavoriteFromStepsFlow,
} from './pause-reflect-steps-flow';

describe('pause-reflect-tag-flow', () => {
  it('re-exports tag update use case from leaf module', () => {
    expect(typeof runPauseReflectTagUpdate).toBe('function');
    expect(runPauseReflectTagUpdate).toBe(runTagDirect);
  });

  it('sibling cluster: note-flow export stays distinct from tag-flow export', () => {
    expect(runPauseReflectTagUpdate).not.toBe(runNoteFromNoteFlow);
  });

  it('sibling cluster: steps-flow exports stay distinct from tag-flow export', () => {
    expect(runPauseReflectTagUpdate).not.toBe(runFavoriteFromStepsFlow);
    expect(runPauseReflectTagUpdate).not.toBe(runNoteFromStepsFlow);
    expect(runPauseReflectTagUpdate).not.toBe(runReflectionStepFromStepsFlow);
    expect(runPauseReflectTagUpdate).not.toBe(shouldShowFavoriteFromStepsFlow);
    expect(runPauseReflectTagUpdate).not.toBe(shouldLogFromStepsFlow);
    // Full cross-flow pins: `pause-reflect-steps-note-tag-flow-sibling-parity.test.ts`.
  });
});
