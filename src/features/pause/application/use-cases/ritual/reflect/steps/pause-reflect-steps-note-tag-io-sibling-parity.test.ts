import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  reflectionStepSessionStorage: { storage: 'reflectionStepSessionStorage' },
}));

import * as stepsIo from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';
import {
  pauseReflectFavoriteToggle,
  pauseReflectNoteUpdate,
  pauseReflectNoteUpdateWithRepository,
  pauseReflectTagUpdate,
  pauseReflectTagUpdateWithRepository,
  pauseReflectionStepLogOnce,
  reflectPauseRepository,
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';

/**
 * Application-layer sibling parity: presentation note vs tag wrappers on steps-io (parity with
 * `pause-reflect-note-tag-flow-sibling-parity.test.ts` and presentation
 * `pause-reflect-steps-note-tag-io-sibling-parity.test.ts`; complements
 * `pause-reflect-steps-favorite-reflection-step-log-io-sibling-parity.test.ts` and
 * `pause-reflect-steps-flow-io-wrapper-sibling-parity.test.ts`).
 */
describe('pause-reflect-steps-io note ↔ tag wrapper sibling parity (application)', () => {
  it('note and tag presentation wrappers are distinct exports on steps-io', () => {
    expect(typeof pauseReflectNoteUpdate).toBe('function');
    expect(typeof pauseReflectTagUpdate).toBe('function');
    expect(typeof pauseReflectNoteUpdateWithRepository).toBe('function');
    expect(typeof pauseReflectTagUpdateWithRepository).toBe('function');

    expect('pauseReflectNoteUpdate' in stepsIo).toBe(true);
    expect('pauseReflectTagUpdate' in stepsIo).toBe(true);
    expect(pauseReflectNoteUpdate).not.toBe(pauseReflectTagUpdate);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(pauseReflectTagUpdateWithRepository);
  });

  it('note/tag wrappers stay off favorite toggle and reflection_step log wrappers', () => {
    expect(pauseReflectNoteUpdate).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseReflectTagUpdate).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseReflectNoteUpdate).not.toBe(pauseReflectionStepLogOnce);
    expect(pauseReflectTagUpdate).not.toBe(pauseReflectionStepLogOnce);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseReflectTagUpdateWithRepository).not.toBe(pauseReflectionStepLogOnce);
    expect(reflectPauseRepository).not.toBe(pauseReflectNoteUpdate);
    expect(reflectPauseRepository).not.toBe(pauseReflectTagUpdate);
  });
});
