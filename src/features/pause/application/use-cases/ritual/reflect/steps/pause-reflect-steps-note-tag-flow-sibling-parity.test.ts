import { describe, expect, it } from 'vitest';

import { runPauseReflectNoteUpdate } from './pause-reflect-note-flow';
import { runPauseReflectTagUpdate } from './pause-reflect-tag-flow';
import {
  runPauseFavoriteToggle,
  runPauseReflectNoteUpdate as runNoteFromStepsFlow,
  runPauseReflectTagUpdate as runTagFromStepsFlow,
  runPauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from './pause-reflect-steps-flow';
import * as noteFlow from './pause-reflect-note-flow';
import * as stepsFlow from './pause-reflect-steps-flow';
import * as tagFlow from './pause-reflect-tag-flow';

/**
 * Application sibling parity: steps umbrella vs note/tag subcluster CI anchors (parity with
 * `pause-reflect-steps-generation-flow-sibling-parity.test.ts`; complements
 * `pause-reflect-note-tag-flow-sibling-parity.test.ts` and presentation
 * `pause-reflect-steps-note-tag-io-sibling-parity.test.ts` (application + presentation).
 */
describe('pause-reflect-steps-flow ↔ pause-reflect-note-flow / pause-reflect-tag-flow sibling parity', () => {
  it('steps-flow, note-flow, and tag-flow are distinct sibling CI anchors', () => {
    expect(typeof runNoteFromStepsFlow).toBe('function');
    expect(typeof runTagFromStepsFlow).toBe('function');
    expect(typeof runPauseReflectNoteUpdate).toBe('function');
    expect(typeof runPauseReflectTagUpdate).toBe('function');

    expect('runPauseReflectNoteUpdate' in stepsFlow).toBe(true);
    expect('runPauseReflectTagUpdate' in stepsFlow).toBe(true);
    expect('runPauseFavoriteToggle' in stepsFlow).toBe(true);
    expect('runPauseReflectNoteUpdate' in noteFlow).toBe(true);
    expect('runPauseReflectTagUpdate' in noteFlow).toBe(false);
    expect('runPauseReflectNoteUpdate' in tagFlow).toBe(false);
    expect('runPauseReflectTagUpdate' in tagFlow).toBe(true);
    expect('runPauseFavoriteToggle' in noteFlow).toBe(false);
    expect('runPauseFavoriteToggle' in tagFlow).toBe(false);
  });

  it('steps umbrella exports stay off note/tag subcluster leaf bindings', () => {
    expect(runNoteFromStepsFlow).toBe(runPauseReflectNoteUpdate);
    expect(runTagFromStepsFlow).toBe(runPauseReflectTagUpdate);
    expect(runPauseFavoriteToggle).not.toBe(runPauseReflectNoteUpdate);
    expect(runPauseFavoriteToggle).not.toBe(runPauseReflectTagUpdate);
    expect(runPauseReflectionStepLogOnce).not.toBe(runPauseReflectNoteUpdate);
    expect(runPauseReflectionStepLogOnce).not.toBe(runPauseReflectTagUpdate);
    expect(shouldShowFavoriteProHint).not.toBe(runPauseReflectNoteUpdate);
    expect(shouldLogPauseReflectionStep).not.toBe(runPauseReflectTagUpdate);
    expect(runNoteFromStepsFlow).not.toBe(runPauseFavoriteToggle);
    expect(runTagFromStepsFlow).not.toBe(runPauseReflectionStepLogOnce);
  });

  it('note and tag subcluster exports stay off steps umbrella-only bindings', () => {
    expect(runPauseReflectNoteUpdate).not.toBe(runPauseFavoriteToggle);
    expect(runPauseReflectTagUpdate).not.toBe(runPauseFavoriteToggle);
    expect(runPauseReflectNoteUpdate).not.toBe(runPauseReflectionStepLogOnce);
    expect(runPauseReflectTagUpdate).not.toBe(shouldShowFavoriteProHint);
    expect(runPauseReflectNoteUpdate).not.toBe(shouldLogPauseReflectionStep);
    expect(runPauseReflectTagUpdate).not.toBe(runPauseReflectionStepLogOnce);
    expect(runPauseReflectNoteUpdate).not.toBe(runTagFromStepsFlow);
    expect(runPauseReflectTagUpdate).not.toBe(runNoteFromStepsFlow);
  });
});
