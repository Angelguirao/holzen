import { describe, expect, it } from 'vitest';

import { shouldLogPauseReflectionStep } from '@/features/pause/domain/reflect/steps/reflection-step-log';
import { shouldShowFavoriteProHint } from '@/features/pause/domain/reflect/steps/favorite-toggle';

import {
  runPauseFavoriteToggle,
  runPauseReflectNoteUpdate,
  runPauseReflectTagUpdate,
  runPauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep as shouldLogFromFlow,
  shouldShowFavoriteProHint as shouldShowFavoriteFromFlow,
} from './pause-reflect-steps-flow';
import { runPauseFavoriteToggle as runFavoriteDirect } from './run-pause-favorite-toggle';
import { runPauseReflectNoteUpdate as runNoteDirect } from './run-pause-reflect-note-update';
import { runPauseReflectTagUpdate as runTagDirect } from './run-pause-reflect-tag-update';
import { runPauseReflectionStepLogOnce as runReflectionStepDirect } from './run-pause-reflection-step-log';

describe('pause-reflect-steps-flow', () => {
  it('re-exports step mutations and domain gates from leaf modules', () => {
    expect(typeof runPauseFavoriteToggle).toBe('function');
    expect(typeof runPauseReflectNoteUpdate).toBe('function');
    expect(typeof runPauseReflectTagUpdate).toBe('function');
    expect(typeof runPauseReflectionStepLogOnce).toBe('function');
    expect(typeof shouldShowFavoriteFromFlow).toBe('function');
    expect(typeof shouldLogFromFlow).toBe('function');

    expect(runPauseFavoriteToggle).toBe(runFavoriteDirect);
    expect(runPauseReflectNoteUpdate).toBe(runNoteDirect);
    expect(runPauseReflectTagUpdate).toBe(runTagDirect);
    expect(runPauseReflectionStepLogOnce).toBe(runReflectionStepDirect);
    expect(shouldShowFavoriteFromFlow).toBe(shouldShowFavoriteProHint);
    expect(shouldLogFromFlow).toBe(shouldLogPauseReflectionStep);
  });
});
