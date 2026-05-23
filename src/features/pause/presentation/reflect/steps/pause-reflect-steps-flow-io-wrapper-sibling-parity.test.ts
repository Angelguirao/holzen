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
import * as stepsFlow from '@/features/pause/application/use-cases/ritual/reflect/steps/pause-reflect-steps-flow';
import {
  pauseReflectFavoriteToggle,
  pauseReflectFavoriteToggleWithRepository,
  pauseReflectNoteUpdate,
  pauseReflectNoteUpdateWithRepository,
  pauseReflectTagUpdate,
  pauseReflectTagUpdateWithRepository,
  pauseReflectionStepLogOnce,
  pauseReflectionStepLogOnceWithRepository,
  reflectPauseRepository,
  shouldLogPauseReflectionStep as shouldLogFromStepsIo,
  shouldShowFavoriteProHint as shouldShowFromStepsIo,
} from './pause-reflect-steps-io';
import * as stepsIo from './pause-reflect-steps-io';

/**
 * Presentation sibling parity: steps-flow CI umbrella vs steps-io port-bound wrappers.
 * Mirrors application `pause-reflect-steps-flow-io-wrapper-sibling-parity.test.ts`
 * (colocated beside `pause-reflect-steps-flow.ts`).
 * Delegation parity: colocated `pause-reflect-steps-io-parity.test.ts`.
 */
describe('pause-reflect-steps-flow ↔ pause-reflect-steps-io wrapper sibling parity (presentation)', () => {
  it('steps-flow CI umbrella and presentation steps-io are distinct anchors', () => {
    expect(typeof runPauseFavoriteToggle).toBe('function');
    expect(typeof runPauseReflectNoteUpdate).toBe('function');
    expect(typeof runPauseReflectTagUpdate).toBe('function');
    expect(typeof runPauseReflectionStepLogOnce).toBe('function');
    expect(typeof shouldShowFavoriteProHint).toBe('function');
    expect(typeof shouldLogPauseReflectionStep).toBe('function');
    expect(typeof pauseReflectTagUpdate).toBe('function');
    expect(typeof pauseReflectNoteUpdate).toBe('function');
    expect(typeof pauseReflectFavoriteToggle).toBe('function');
    expect(typeof pauseReflectionStepLogOnce).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect('pauseReflectTagUpdate' in stepsFlow).toBe(false);
    expect('pauseReflectNoteUpdate' in stepsFlow).toBe(false);
    expect('pauseReflectFavoriteToggle' in stepsFlow).toBe(false);
    expect('pauseReflectionStepLogOnce' in stepsFlow).toBe(false);
    expect('pauseReflectTagUpdateWithRepository' in stepsFlow).toBe(false);
    expect('pauseReflectNoteUpdateWithRepository' in stepsFlow).toBe(false);
    expect('pauseReflectFavoriteToggleWithRepository' in stepsFlow).toBe(false);
    expect('pauseReflectionStepLogOnceWithRepository' in stepsFlow).toBe(false);
    expect('reflectPauseRepository' in stepsFlow).toBe(false);

    expect('runPauseFavoriteToggle' in stepsIo).toBe(false);
    expect('runPauseReflectNoteUpdate' in stepsIo).toBe(false);
    expect('runPauseReflectTagUpdate' in stepsIo).toBe(false);
    expect('runPauseReflectionStepLogOnce' in stepsIo).toBe(false);
  });

  it('steps-flow and steps-io share domain step gate re-exports', () => {
    expect(shouldShowFavoriteProHint).toBe(shouldShowFromStepsIo);
    expect(shouldLogPauseReflectionStep).toBe(shouldLogFromStepsIo);
  });

  it('steps-flow leaf exports stay off presentation port-bound wrappers', () => {
    expect(runPauseFavoriteToggle).not.toBe(pauseReflectFavoriteToggle);
    expect(runPauseReflectNoteUpdate).not.toBe(pauseReflectNoteUpdate);
    expect(runPauseReflectTagUpdate).not.toBe(pauseReflectTagUpdate);
    expect(runPauseReflectionStepLogOnce).not.toBe(pauseReflectionStepLogOnce);
    expect(runPauseFavoriteToggle).not.toBe(pauseReflectFavoriteToggleWithRepository);
    expect(runPauseReflectNoteUpdate).not.toBe(pauseReflectNoteUpdateWithRepository);
    expect(runPauseReflectTagUpdate).not.toBe(pauseReflectTagUpdateWithRepository);
    expect(runPauseReflectionStepLogOnce).not.toBe(pauseReflectionStepLogOnceWithRepository);
    expect(shouldShowFavoriteProHint).not.toBe(reflectPauseRepository);
  });

  it('presentation steps-io wrappers stay off steps-flow leaf re-exports', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(runPauseFavoriteToggle);
    expect(pauseReflectNoteUpdate).not.toBe(runPauseReflectNoteUpdate);
    expect(pauseReflectTagUpdate).not.toBe(runPauseReflectTagUpdate);
    expect(pauseReflectionStepLogOnce).not.toBe(runPauseReflectionStepLogOnce);
    expect(pauseReflectFavoriteToggle).not.toBe(runPauseReflectTagUpdate);
    expect(pauseReflectNoteUpdate).not.toBe(runPauseReflectionStepLogOnce);
    expect(reflectPauseRepository).not.toBe(runPauseFavoriteToggle);
  });
});
