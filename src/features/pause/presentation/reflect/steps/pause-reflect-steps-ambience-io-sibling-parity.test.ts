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
import * as ambienceIo from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';

/**
 * Presentation sibling parity: steps-io vs ambience-io (parity with application
 * `pause-reflect-steps-ambience-flow-sibling-parity.test.ts` and
 * `application/.../steps/pause-reflect-steps-ambience-io-sibling-parity.test.ts`).
 * Reciprocal inline pins: `pause-reflect-steps-io-parity.test.ts` ↔
 * `pause-reflect-ambience-io-parity.test.ts`.
 */
describe('pause-reflect-steps-io ↔ pause-reflect-ambience-io sibling parity', () => {
  it('steps-io and ambience-io are distinct presentation I/O surfaces', () => {
    expect(typeof pauseReflectTagUpdate).toBe('function');
    expect(typeof pauseReflectNoteUpdate).toBe('function');
    expect(typeof pauseReflectFavoriteToggle).toBe('function');
    expect(typeof pauseReflectionStepLogOnce).toBe('function');
    expect(typeof shouldShowFavoriteProHint).toBe('function');
    expect(typeof shouldLogPauseReflectionStep).toBe('function');
    expect(typeof stepsReflectPauseRepository).toBe('object');

    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');

    expect('startPauseReflectFrameFocusAmbience' in stepsIo).toBe(false);
    expect('stopPauseReflectFrameFocusAmbience' in stepsIo).toBe(false);

    expect('pauseReflectTagUpdate' in ambienceIo).toBe(false);
    expect('pauseReflectNoteUpdate' in ambienceIo).toBe(false);
    expect('pauseReflectFavoriteToggle' in ambienceIo).toBe(false);
    expect('pauseReflectionStepLogOnce' in ambienceIo).toBe(false);
    expect('shouldShowFavoriteProHint' in ambienceIo).toBe(false);
    expect('shouldLogPauseReflectionStep' in ambienceIo).toBe(false);
    expect('reflectPauseRepository' in ambienceIo).toBe(false);
  });

  it('step mutation I/O keeps frame-focus ambience off post-it RPC wrappers', () => {
    expect(pauseReflectTagUpdate).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseReflectNoteUpdate).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseReflectFavoriteToggle).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseReflectionStepLogOnce).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseReflectTagUpdateWithRepository).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseReflectFavoriteToggleWithRepository).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseReflectionStepLogOnceWithRepository).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(shouldShowFavoriteProHint).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(shouldLogPauseReflectionStep).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(stepsReflectPauseRepository).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(stepsReflectPauseRepository).not.toBe(stopPauseReflectFrameFocusAmbience);
  });

  it('ambience-io keeps Web Audio bed off step mutations and domain step gates', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(pauseReflectFavoriteToggle);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(pauseReflectNoteUpdate);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(pauseReflectTagUpdate);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(pauseReflectionStepLogOnce);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(shouldShowFavoriteProHint);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(shouldLogPauseReflectionStep);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(pauseReflectionStepLogOnceWithRepository);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(pauseReflectNoteUpdateWithRepository);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(stopPauseReflectFrameFocusAmbience);
  });
});
