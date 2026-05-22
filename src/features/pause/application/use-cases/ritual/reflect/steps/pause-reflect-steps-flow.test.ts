import { describe, expect, it } from 'vitest';

import {
  runPauseFavoriteToggle,
  runPauseReflectNoteUpdate,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from './pause-reflect-steps-flow';

describe('pause-reflect-steps-flow', () => {
  it('re-exports step mutations and domain gates from leaf modules', () => {
    expect(typeof runPauseFavoriteToggle).toBe('function');
    expect(typeof runPauseReflectNoteUpdate).toBe('function');
    expect(typeof shouldShowFavoriteProHint).toBe('function');
    expect(typeof shouldLogPauseReflectionStep).toBe('function');
  });
});
