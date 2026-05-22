import { describe, expect, it } from 'vitest';

import { runPauseReflectNoteUpdate as runNoteDirect } from './run-pause-reflect-note-update';
import { runPauseReflectNoteUpdate } from './pause-reflect-note-flow';
import { runPauseReflectTagUpdate as runTagFromTagFlow } from './pause-reflect-tag-flow';

describe('pause-reflect-note-flow', () => {
  it('re-exports note update use case from leaf module', () => {
    expect(typeof runPauseReflectNoteUpdate).toBe('function');
    expect(runPauseReflectNoteUpdate).toBe(runNoteDirect);
  });

  it('sibling cluster: tag-flow export stays distinct from note-flow export', () => {
    expect(runPauseReflectNoteUpdate).not.toBe(runTagFromTagFlow);
  });
});
