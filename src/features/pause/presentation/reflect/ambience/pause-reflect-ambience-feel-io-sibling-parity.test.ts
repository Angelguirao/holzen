import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from './pause-reflect-ambience-io';
import * as ambienceIo from './pause-reflect-ambience-io';
import {
  buildFeelTilesMoodLogOptions,
  pauseInitialEmotionSelect,
  pauseInitialEmotionSkip,
  pauseInitialEmotionSelectWithRepository,
  pauseInitialEmotionSkipWithRepository,
  reflectPauseRepository as moodReflectPauseRepository,
} from '@/features/pause/presentation/feel/pause-feel-io';
import * as moodIo from '@/features/pause/presentation/feel/pause-feel-io';

/**
 * Presentation sibling parity: ambience-io vs mood-io (parity with
 * `pause-reflect-ambience-hub-io-sibling-parity.test.ts` and
 * `pause-feel-hub-io-sibling-parity.test.ts`; application mirror:
 * `application/.../ambience/pause-reflect-ambience-feel-io-sibling-parity.test.ts`;
 * reciprocal inline pins: `pause-reflect-ambience-io-parity.test.ts` ↔
 * `pause-feel-io-parity.test.ts`).
 */
describe('pause-reflect-ambience-io ↔ pause-feel-io sibling parity', () => {
  it('ambience-io and mood-io are distinct presentation I/O surfaces', () => {
    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');

    expect(typeof pauseInitialEmotionSelect).toBe('function');
    expect(typeof pauseInitialEmotionSkip).toBe('function');
    expect(typeof pauseInitialEmotionSelectWithRepository).toBe('function');
    expect(typeof pauseInitialEmotionSkipWithRepository).toBe('function');
    expect(typeof buildFeelTilesMoodLogOptions).toBe('function');
    expect(typeof moodReflectPauseRepository).toBe('object');

    expect('pauseInitialEmotionSelect' in ambienceIo).toBe(false);
    expect('pauseInitialEmotionSkip' in ambienceIo).toBe(false);
    expect('pauseInitialEmotionSelectWithRepository' in ambienceIo).toBe(false);
    expect('pauseInitialEmotionSkipWithRepository' in ambienceIo).toBe(false);
    expect('buildFeelTilesMoodLogOptions' in ambienceIo).toBe(false);
    expect('reflectPauseRepository' in ambienceIo).toBe(false);

    expect('startPauseReflectFrameFocusAmbience' in moodIo).toBe(false);
    expect('stopPauseReflectFrameFocusAmbience' in moodIo).toBe(false);
  });

  it('frame-focus ambience I/O keeps Web Audio bed off initial-emotion RPC and feel-tile helpers', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(pauseInitialEmotionSelect);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(pauseInitialEmotionSkip);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(pauseInitialEmotionSelectWithRepository);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(pauseInitialEmotionSkipWithRepository);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(buildFeelTilesMoodLogOptions);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(buildFeelTilesMoodLogOptions);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(moodReflectPauseRepository);
  });

  it('mood-io exports stay off frame-focus ambience bed start/stop', () => {
    expect(pauseInitialEmotionSelect).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseInitialEmotionSkip).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseInitialEmotionSkipWithRepository).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(buildFeelTilesMoodLogOptions).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(buildFeelTilesMoodLogOptions).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(moodReflectPauseRepository).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(pauseInitialEmotionSkipWithRepository);
  });
});
