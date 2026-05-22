import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
  reflectionStepSessionStorage: { storage: 'reflectionStepSessionStorage' },
}));

import {
  runPauseFavoriteToggle,
  runPauseReflectNoteUpdate,
  runPauseReflectTagUpdate,
  runPauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from '@/features/pause/application/use-cases/ritual/reflect/steps/pause-reflect-steps-flow';
import { runPauseFavoriteToggle as runFavoriteToggleDirect } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-favorite-toggle';
import { runPauseReflectNoteUpdate as runNoteUpdateDirect } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-note-update';
import { runPauseReflectTagUpdate as runTagUpdateDirect } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-tag-update';
import { runPauseReflectionStepLogOnce as runReflectionStepLogDirect } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflection-step-log';
import {
  reflectPauseRepository,
  shouldLogPauseReflectionStep as shouldLogFromStepsIo,
  shouldShowFavoriteProHint as shouldShowFromStepsIo,
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

describe('pause-reflect-steps-io parity', () => {
  it('presentation I/O step gate re-exports match steps CI umbrella', () => {
    expect(shouldShowFavoriteProHint).toBe(shouldShowFromStepsIo);
    expect(shouldLogPauseReflectionStep).toBe(shouldLogFromStepsIo);
  });

  it('presentation I/O binds reflectPauseRepository to public-rpc supabasePauseRepository', () => {
    expect(reflectPauseRepository).toBe(supabasePauseRepository);
  });

  it('steps CI umbrella composes the same run-* leaf use cases as presentation I/O', () => {
    expect(runPauseFavoriteToggle).toBe(runFavoriteToggleDirect);
    expect(runPauseReflectNoteUpdate).toBe(runNoteUpdateDirect);
    expect(runPauseReflectTagUpdate).toBe(runTagUpdateDirect);
    expect(runPauseReflectionStepLogOnce).toBe(runReflectionStepLogDirect);
  });
});
