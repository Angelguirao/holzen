import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  supabaseReflectGenerator: { port: 'reflectGenerator' },
  reflectionStepSessionStorage: { storage: 'reflectionStepSessionStorage' },
}));

import * as stepsIo from './pause-reflect-steps-io';
import {
  pauseReflectFavoriteToggle,
  pauseReflectNoteUpdate,
  pauseReflectTagUpdate,
  pauseReflectionStepLogOnce,
  pauseReflectFavoriteToggleWithRepository,
  pauseReflectNoteUpdateWithRepository,
  pauseReflectTagUpdateWithRepository,
  pauseReflectionStepLogOnceWithRepository,
  reflectPauseRepository as stepsReflectPauseRepository,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from './pause-reflect-steps-io';
import * as generationIo from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
import {
  messageFromReflectGenerationResult,
  pauseReflectGeneration,
  reflectGenerationPrerequisite,
  reflectGenerator,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
  shouldCommitReflectGeneration,
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';

/**
 * Presentation sibling parity: steps-io vs generation-io (parity with application
 * `pause-reflect-steps-generation-flow-sibling-parity.test.ts` and
 * `pause-reflect-steps-generation-io-sibling-parity.test.ts`). Manual-open stays on
 * `pause-home-reflect-io`, not generation-io.
 */
describe('pause-reflect-steps-io ↔ pause-reflect-generation-io sibling parity', () => {
  it('steps-io and generation-io are distinct presentation I/O surfaces', () => {
    expect(typeof pauseReflectTagUpdate).toBe('function');
    expect(typeof pauseReflectNoteUpdate).toBe('function');
    expect(typeof pauseReflectFavoriteToggle).toBe('function');
    expect(typeof pauseReflectionStepLogOnce).toBe('function');
    expect(typeof shouldShowFavoriteProHint).toBe('function');
    expect(typeof shouldLogPauseReflectionStep).toBe('function');
    expect(typeof stepsReflectPauseRepository).toBe('object');

    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof pauseReflectGeneration).toBe('function');
    expect(typeof reflectGenerationPrerequisite).toBe('function');
    expect(typeof resolveReflectGenerationPrefetch).toBe('function');
    expect(typeof shouldCommitReflectGeneration).toBe('function');
    expect(typeof messageFromReflectGenerationResult).toBe('function');
    expect(typeof reflectGenerator).toBe('object');

    expect('runReflectGeneration' in stepsIo).toBe(false);
    expect('pauseReflectGeneration' in stepsIo).toBe(false);
    expect('reflectGenerator' in stepsIo).toBe(false);
    expect('reflectGenerationPrerequisite' in stepsIo).toBe(false);

    expect('pauseReflectTagUpdate' in generationIo).toBe(false);
    expect('pauseReflectNoteUpdate' in generationIo).toBe(false);
    expect('pauseReflectFavoriteToggle' in generationIo).toBe(false);
    expect('pauseReflectionStepLogOnce' in generationIo).toBe(false);
    expect('shouldShowFavoriteProHint' in generationIo).toBe(false);
    expect('shouldLogPauseReflectionStep' in generationIo).toBe(false);
  });

  it('step mutation I/O keeps post-it RPC wrappers off holzen-reflect generation', () => {
    expect(pauseReflectTagUpdate).not.toBe(runReflectGeneration);
    expect(pauseReflectNoteUpdate).not.toBe(runReflectGeneration);
    expect(pauseReflectFavoriteToggle).not.toBe(pauseReflectGeneration);
    expect(pauseReflectionStepLogOnce).not.toBe(reflectGenerationPrerequisite);
    expect(pauseReflectTagUpdateWithRepository).not.toBe(pauseReflectGeneration);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(runReflectGeneration);
    expect(pauseReflectFavoriteToggleWithRepository).not.toBe(resolveReflectGenerationPrefetch);
    expect(pauseReflectionStepLogOnceWithRepository).not.toBe(shouldCommitReflectGeneration);
    expect(shouldShowFavoriteProHint).not.toBe(messageFromReflectGenerationResult);
    expect(shouldLogPauseReflectionStep).not.toBe(reflectGenerationPrerequisite);
    expect(stepsReflectPauseRepository).not.toBe(reflectGenerator);
  });

  it('generation I/O keeps holzen-reflect port off step mutations and domain step gates', () => {
    expect(runReflectGeneration).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseReflectGeneration).not.toBe(pauseReflectNoteUpdate);
    expect(reflectGenerationPrerequisite).not.toBe(pauseReflectTagUpdate);
    expect(resolveReflectGenerationPrefetch).not.toBe(pauseReflectionStepLogOnce);
    expect(shouldCommitReflectGeneration).not.toBe(shouldShowFavoriteProHint);
    expect(messageFromReflectGenerationResult).not.toBe(shouldLogPauseReflectionStep);
    expect(reflectGenerator).not.toBe(stepsReflectPauseRepository);
    expect(runReflectGeneration).not.toBe(pauseReflectionStepLogOnceWithRepository);
  });
});
