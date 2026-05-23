import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  reflectionStepSessionStorage: { storage: 'reflectionStepSessionStorage' },
}));

import * as handlersIo from './pause-session-step-handlers-io';
import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from './pause-session-step-handlers-io';
import * as stepsIo from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';
import {
  pauseReflectFavoriteToggle,
  pauseReflectNoteUpdate,
  pauseReflectTagUpdate,
  pauseReflectionStepLogOnce,
  pauseReflectFavoriteToggleWithRepository,
  pauseReflectNoteUpdateWithRepository,
  pauseReflectTagUpdateWithRepository,
  pauseReflectionStepLogOnceWithRepository,
  reflectPauseRepository,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';

/**
 * Cross-surface presentation parity: session step-handlers-io vs reflect steps-io.
 * Session bundle builders must stay distinct from reflect post-it RPC wrappers (parity with
 * step-handlers ↔ step-transition sibling pins; complements reciprocal inline pins on unit tests).
 */
describe('pause-session-step-handlers-io ↔ pause-reflect-steps-io sibling parity', () => {
  it('step-handlers-io and steps-io are distinct presentation I/O surfaces', () => {
    expect(typeof buildPauseSessionStepShellBundle).toBe('function');
    expect(typeof buildPauseSessionStepRitualBundle).toBe('function');

    expect(typeof pauseReflectTagUpdate).toBe('function');
    expect(typeof pauseReflectNoteUpdate).toBe('function');
    expect(typeof pauseReflectFavoriteToggle).toBe('function');
    expect(typeof pauseReflectionStepLogOnce).toBe('function');
    expect(typeof shouldShowFavoriteProHint).toBe('function');
    expect(typeof shouldLogPauseReflectionStep).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect('buildPauseSessionStepShellBundle' in stepsIo).toBe(false);
    expect('buildPauseSessionStepRitualBundle' in stepsIo).toBe(false);
    expect('pauseReflectTagUpdate' in handlersIo).toBe(false);
    expect('pauseReflectNoteUpdate' in handlersIo).toBe(false);
    expect('pauseReflectFavoriteToggle' in handlersIo).toBe(false);
    expect('pauseReflectionStepLogOnce' in handlersIo).toBe(false);
    expect('reflectPauseRepository' in handlersIo).toBe(false);
  });

  it('session step bundle builders stay off reflect step mutation RPC wrappers', () => {
    expect(buildPauseSessionStepShellBundle).not.toBe(pauseReflectTagUpdate);
    expect(buildPauseSessionStepShellBundle).not.toBe(pauseReflectNoteUpdate);
    expect(buildPauseSessionStepShellBundle).not.toBe(pauseReflectFavoriteToggle);
    expect(buildPauseSessionStepShellBundle).not.toBe(pauseReflectionStepLogOnce);
    expect(buildPauseSessionStepRitualBundle).not.toBe(pauseReflectTagUpdate);
    expect(buildPauseSessionStepRitualBundle).not.toBe(pauseReflectNoteUpdate);
    expect(buildPauseSessionStepRitualBundle).not.toBe(pauseReflectFavoriteToggle);
    expect(buildPauseSessionStepRitualBundle).not.toBe(pauseReflectionStepLogOnce);
    expect(buildPauseSessionStepShellBundle).not.toBe(pauseReflectTagUpdateWithRepository);
    expect(buildPauseSessionStepRitualBundle).not.toBe(pauseReflectionStepLogOnceWithRepository);
    expect(buildPauseSessionStepShellBundle).not.toBe(shouldShowFavoriteProHint);
    expect(buildPauseSessionStepRitualBundle).not.toBe(shouldLogPauseReflectionStep);
    expect(buildPauseSessionStepShellBundle).not.toBe(reflectPauseRepository);
    expect(buildPauseSessionStepRitualBundle).not.toBe(reflectPauseRepository);
  });

  it('reflect step mutation I/O stays off session step bundle builders', () => {
    expect(pauseReflectTagUpdate).not.toBe(buildPauseSessionStepShellBundle);
    expect(pauseReflectNoteUpdate).not.toBe(buildPauseSessionStepRitualBundle);
    expect(pauseReflectFavoriteToggle).not.toBe(buildPauseSessionStepShellBundle);
    expect(pauseReflectionStepLogOnce).not.toBe(buildPauseSessionStepRitualBundle);
    expect(pauseReflectTagUpdateWithRepository).not.toBe(buildPauseSessionStepShellBundle);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(buildPauseSessionStepRitualBundle);
    expect(pauseReflectFavoriteToggleWithRepository).not.toBe(buildPauseSessionStepShellBundle);
    expect(pauseReflectionStepLogOnceWithRepository).not.toBe(buildPauseSessionStepRitualBundle);
    expect(shouldShowFavoriteProHint).not.toBe(buildPauseSessionStepShellBundle);
    expect(shouldLogPauseReflectionStep).not.toBe(buildPauseSessionStepRitualBundle);
  });
});
