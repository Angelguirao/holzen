import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
  reflectionStepSessionStorage: { storage: 'reflectionStepSessionStorage' },
}));

import { runPauseFavoriteToggle as runFavoriteToggleDirect } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-favorite-toggle';
import { runPauseReflectNoteUpdate as runNoteUpdateDirect } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-note-update';
import { runPauseReflectTagUpdate as runTagUpdateDirect } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-tag-update';
import { runPauseReflectionStepLogOnce as runReflectionStepLogDirect } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflection-step-log';
import {
  runPauseFavoriteToggle as runFavoriteToggleFromStepsFlow,
  runPauseReflectNoteUpdate as runNoteUpdateFromStepsFlow,
  runPauseReflectTagUpdate as runTagUpdateFromStepsFlow,
  runPauseReflectionStepLogOnce as runReflectionStepLogFromStepsFlow,
  shouldLogPauseReflectionStep as shouldLogFromStepsFlow,
  shouldShowFavoriteProHint as shouldShowFromStepsFlow,
} from '@/features/pause/application/use-cases/ritual/reflect/steps/pause-reflect-steps-flow';
import { shouldShowFavoriteProHint as shouldShowFavoriteProHintDirect } from '@/features/pause/domain/reflect/steps/favorite-toggle';
import { shouldLogPauseReflectionStep as shouldLogPauseReflectionStepDirect } from '@/features/pause/domain/reflect/steps/reflection-step-log';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

import {
  reflectPauseRepository,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from './pause-reflect-steps-io';

describe('pause-reflect-steps-io re-exports', () => {
  it('re-exports reflect step gates from domain steps leaf modules', () => {
    expect(typeof shouldShowFavoriteProHint).toBe('function');
    expect(typeof shouldLogPauseReflectionStep).toBe('function');

    expect(shouldShowFavoriteProHint).toBe(shouldShowFavoriteProHintDirect);
    expect(shouldLogPauseReflectionStep).toBe(shouldLogPauseReflectionStepDirect);
  });

  it('binds default reflectPauseRepository to public-rpc supabasePauseRepository', () => {
    expect(reflectPauseRepository).toBe(supabasePauseRepository);
  });

  it('presentation I/O bindings match pause-reflect-steps-flow CI anchor (leaf parity)', () => {
    expect(shouldShowFavoriteProHint).toBe(shouldShowFromStepsFlow);
    expect(shouldShowFavoriteProHint).toBe(shouldShowFavoriteProHintDirect);
    expect(shouldLogPauseReflectionStep).toBe(shouldLogFromStepsFlow);
    expect(shouldLogPauseReflectionStep).toBe(shouldLogPauseReflectionStepDirect);

    expect(runFavoriteToggleFromStepsFlow).toBe(runFavoriteToggleDirect);
    expect(runNoteUpdateFromStepsFlow).toBe(runNoteUpdateDirect);
    expect(runTagUpdateFromStepsFlow).toBe(runTagUpdateDirect);
    expect(runReflectionStepLogFromStepsFlow).toBe(runReflectionStepLogDirect);
  });
});
