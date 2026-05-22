import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  reflectionStepSessionStorage: { storage: 'reflectionStepSessionStorage' },
}));

import * as stepsIo from './pause-reflect-steps-io';
import {
  pauseReflectFavoriteToggle,
  pauseReflectFavoriteToggleWithRepository,
  pauseReflectNoteUpdate,
  pauseReflectTagUpdate,
  pauseReflectionStepLogOnce,
  pauseReflectionStepLogOnceWithRepository,
  reflectPauseRepository,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from './pause-reflect-steps-io';

/**
 * Presentation sibling parity: favorite toggle vs reflection_step log wrappers on
 * steps-io (parity with application `pause-favorite-toggle-reflection-step-log-flow-sibling-parity.test.ts`
 * and `pause-reflect-steps-favorite-reflection-step-log-flow-sibling-parity.test.ts`;
 * complements `pause-reflect-steps-note-tag-io-sibling-parity.test.ts`).
 */
describe('pause-reflect-steps-io favorite ↔ reflection_step log wrapper sibling parity', () => {
  it('favorite and reflection_step log presentation wrappers are distinct exports on steps-io', () => {
    expect(typeof pauseReflectFavoriteToggle).toBe('function');
    expect(typeof pauseReflectFavoriteToggleWithRepository).toBe('function');
    expect(typeof pauseReflectionStepLogOnce).toBe('function');
    expect(typeof pauseReflectionStepLogOnceWithRepository).toBe('function');

    expect('pauseReflectFavoriteToggle' in stepsIo).toBe(true);
    expect('pauseReflectionStepLogOnce' in stepsIo).toBe(true);
    expect('shouldShowFavoriteProHint' in stepsIo).toBe(true);
    expect('shouldLogPauseReflectionStep' in stepsIo).toBe(true);
    expect(pauseReflectFavoriteToggle).not.toBe(pauseReflectionStepLogOnce);
    expect(pauseReflectFavoriteToggleWithRepository).not.toBe(pauseReflectionStepLogOnceWithRepository);
  });

  it('favorite wrappers stay off reflection_step log wrappers and domain gates', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(pauseReflectionStepLogOnce);
    expect(pauseReflectFavoriteToggle).not.toBe(pauseReflectionStepLogOnceWithRepository);
    expect(pauseReflectFavoriteToggleWithRepository).not.toBe(pauseReflectionStepLogOnce);
    expect(shouldShowFavoriteProHint).not.toBe(shouldLogPauseReflectionStep);
    expect(pauseReflectFavoriteToggle).not.toBe(shouldLogPauseReflectionStep);
    expect(shouldShowFavoriteProHint).not.toBe(pauseReflectionStepLogOnce);
    expect(pauseReflectFavoriteToggle).not.toBe(pauseReflectNoteUpdate);
    expect(pauseReflectFavoriteToggle).not.toBe(pauseReflectTagUpdate);
  });

  it('reflection_step log wrappers stay off favorite wrappers and shared repository binding', () => {
    expect(pauseReflectionStepLogOnce).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseReflectionStepLogOnce).not.toBe(pauseReflectFavoriteToggleWithRepository);
    expect(pauseReflectionStepLogOnceWithRepository).not.toBe(pauseReflectFavoriteToggle);
    expect(shouldLogPauseReflectionStep).not.toBe(shouldShowFavoriteProHint);
    expect(pauseReflectionStepLogOnce).not.toBe(shouldShowFavoriteProHint);
    expect(shouldLogPauseReflectionStep).not.toBe(pauseReflectFavoriteToggle);
    expect(reflectPauseRepository).not.toBe(pauseReflectionStepLogOnce);
    expect(reflectPauseRepository).not.toBe(pauseReflectFavoriteToggle);
  });
});
