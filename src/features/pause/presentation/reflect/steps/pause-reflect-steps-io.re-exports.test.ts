import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
  reflectionStepSessionStorage: { storage: 'reflectionStepSessionStorage' },
}));

import { shouldShowFavoriteProHint as shouldShowFavoriteProHintDirect } from '@/features/pause/domain/reflect/steps/favorite-toggle';
import { shouldLogPauseReflectionStep as shouldLogPauseReflectionStepDirect } from '@/features/pause/domain/reflect/steps/reflection-step-log';
import {
  shouldLogPauseReflectionStep as shouldLogFromStepsFlow,
  shouldShowFavoriteProHint as shouldShowFavoriteFromStepsFlow,
} from '@/features/pause/application/use-cases/ritual/reflect/steps/pause-reflect-steps-flow';
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
    expect(shouldShowFavoriteProHint).toBe(shouldShowFavoriteFromStepsFlow);
    expect(shouldLogPauseReflectionStep).toBe(shouldLogFromStepsFlow);
  });
});
