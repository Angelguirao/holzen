import { describe, expect, it } from 'vitest';

import { runPauseReflectNoteUpdate as runNoteDirect } from './run-pause-reflect-note-update';
import { runPauseReflectNoteUpdate } from './pause-reflect-note-flow';

describe('pause-reflect-note-flow', () => {
  it('re-exports note update use case from leaf module', () => {
    expect(typeof runPauseReflectNoteUpdate).toBe('function');
    expect(runPauseReflectNoteUpdate).toBe(runNoteDirect);
  });
});
