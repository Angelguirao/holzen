import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
  reflectionStepSessionStorage: { storage: 'reflectionStepSessionStorage' },
}));

import {
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from '@/features/pause/application/use-cases/ritual/reflect/steps/pause-reflect-steps-flow';
import {
  shouldLogPauseReflectionStep as shouldLogFromStepsIo,
  shouldShowFavoriteProHint as shouldShowFromStepsIo,
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';

describe('pause-reflect-steps-io parity', () => {
  it('presentation I/O step gate re-exports match steps CI umbrella', () => {
    expect(shouldShowFavoriteProHint).toBe(shouldShowFromStepsIo);
    expect(shouldLogPauseReflectionStep).toBe(shouldLogFromStepsIo);
  });
});
