import { describe, expect, it } from 'vitest';

import { runPauseReflectNoteUpdate } from './pause-reflect-note-flow';
import { runPauseReflectTagUpdate } from './pause-reflect-tag-flow';
import * as noteFlow from './pause-reflect-note-flow';
import * as tagFlow from './pause-reflect-tag-flow';

/**
 * Note ↔ tag subcluster anchors only. Steps umbrella parity:
 * `pause-reflect-steps-note-tag-flow-sibling-parity.test.ts` (reciprocal inline pins on
 * `pause-reflect-steps-flow.test.ts`, `pause-reflect-note-flow.test.ts`, `pause-reflect-tag-flow.test.ts`).
 */
describe('pause-reflect-note-flow ↔ pause-reflect-tag-flow sibling parity', () => {
  it('note-flow and tag-flow are distinct sibling CI anchors', () => {
    expect(typeof runPauseReflectNoteUpdate).toBe('function');
    expect(typeof runPauseReflectTagUpdate).toBe('function');

    expect('runPauseReflectNoteUpdate' in noteFlow).toBe(true);
    expect('runPauseReflectTagUpdate' in noteFlow).toBe(false);
    expect('runPauseReflectNoteUpdate' in tagFlow).toBe(false);
    expect('runPauseReflectTagUpdate' in tagFlow).toBe(true);
  });

  it('note umbrella export stays off tag update leaf binding', () => {
    expect(runPauseReflectNoteUpdate).not.toBe(runPauseReflectTagUpdate);
  });

  it('tag umbrella export stays off note update leaf binding', () => {
    expect(runPauseReflectTagUpdate).not.toBe(runPauseReflectNoteUpdate);
  });
});
