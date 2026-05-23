import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  reflectionStepSessionStorage: { storage: 'reflectionStepSessionStorage' },
}));

import * as moodIo from '@/features/pause/presentation/feel/pause-feel-io';
import {
  buildFeelTilesMoodLogOptions,
  pauseInitialEmotionSelect,
  pauseInitialEmotionSkip,
  pauseInitialEmotionSelectWithRepository,
  pauseInitialEmotionSkipWithRepository,
  reflectPauseRepository as moodReflectPauseRepository,
} from '@/features/pause/presentation/feel/pause-feel-io';
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
  reflectPauseRepository as stepsReflectPauseRepository,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';

/**
 * Application-layer sibling parity: presentation steps-io vs mood-io (parity with
 * `pause-reflect-steps-feel-flow-sibling-parity.test.ts` and presentation
 * `pause-reflect-steps-feel-io-sibling-parity.test.ts`; complements reciprocal inline pins on
 * `pause-reflect-steps-io-parity.test.ts` (application) / `presentation/feel/pause-feel-io-parity.test.ts`).
 */
describe('pause-reflect-steps-io ↔ pause-feel-io sibling parity (application)', () => {
  it('steps-io and mood-io are distinct presentation I/O surfaces', () => {
    expect(typeof pauseReflectTagUpdate).toBe('function');
    expect(typeof pauseReflectNoteUpdate).toBe('function');
    expect(typeof pauseReflectFavoriteToggle).toBe('function');
    expect(typeof pauseReflectionStepLogOnce).toBe('function');
    expect(typeof shouldShowFavoriteProHint).toBe('function');
    expect(typeof shouldLogPauseReflectionStep).toBe('function');
    expect(typeof stepsReflectPauseRepository).toBe('object');

    expect(typeof pauseInitialEmotionSelect).toBe('function');
    expect(typeof pauseInitialEmotionSkip).toBe('function');
    expect(typeof pauseInitialEmotionSelectWithRepository).toBe('function');
    expect(typeof pauseInitialEmotionSkipWithRepository).toBe('function');
    expect(typeof buildFeelTilesMoodLogOptions).toBe('function');
    expect(typeof moodReflectPauseRepository).toBe('object');

    expect('pauseInitialEmotionSelect' in stepsIo).toBe(false);
    expect('pauseInitialEmotionSkip' in stepsIo).toBe(false);
    expect('buildFeelTilesMoodLogOptions' in stepsIo).toBe(false);
    expect('pauseReflectTagUpdate' in moodIo).toBe(false);
    expect('pauseReflectNoteUpdate' in moodIo).toBe(false);
    expect('pauseReflectFavoriteToggle' in moodIo).toBe(false);
    expect('pauseReflectionStepLogOnce' in moodIo).toBe(false);
    expect('shouldShowFavoriteProHint' in moodIo).toBe(false);
    expect('shouldLogPauseReflectionStep' in moodIo).toBe(false);
  });

  it('shared reflectPauseRepository binding does not merge step vs mood RPC wrappers', () => {
    expect(stepsReflectPauseRepository).toBe(moodReflectPauseRepository);
    expect(pauseReflectTagUpdate).not.toBe(pauseInitialEmotionSelect);
    expect(pauseReflectNoteUpdate).not.toBe(pauseInitialEmotionSkip);
    expect(pauseReflectFavoriteToggle).not.toBe(buildFeelTilesMoodLogOptions);
    expect(pauseReflectionStepLogOnce).not.toBe(pauseInitialEmotionSelect);
    expect(pauseReflectTagUpdateWithRepository).not.toBe(pauseInitialEmotionSelectWithRepository);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(pauseInitialEmotionSkipWithRepository);
    expect(pauseReflectionStepLogOnceWithRepository).not.toBe(pauseInitialEmotionSkip);
    expect(shouldShowFavoriteProHint).not.toBe(buildFeelTilesMoodLogOptions);
    expect(shouldLogPauseReflectionStep).not.toBe(pauseInitialEmotionSkip);
  });

  it('mood I/O keeps feel-step RPC off step mutations and domain step gates', () => {
    expect(pauseInitialEmotionSelect).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseInitialEmotionSkip).not.toBe(pauseReflectNoteUpdate);
    expect(buildFeelTilesMoodLogOptions).not.toBe(pauseReflectTagUpdate);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(pauseReflectFavoriteToggleWithRepository);
    expect(pauseInitialEmotionSkipWithRepository).not.toBe(pauseReflectNoteUpdateWithRepository);
    expect(pauseInitialEmotionSelect).not.toBe(shouldShowFavoriteProHint);
    expect(buildFeelTilesMoodLogOptions).not.toBe(shouldLogPauseReflectionStep);
  });
});
