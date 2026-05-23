import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import * as ambienceIo from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import {
  buildShiftEmotionFrameHubLogBundle,
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  reflectPauseRepository,
  resolveShiftFrameHubDonePresentation,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import * as hubIo from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';

/**
 * Application sibling parity: ambience-io vs hub-io (parity with presentation
 * `pause-reflect-ambience-hub-io-sibling-parity.test.ts` and
 * `pause-feel-hub-io-sibling-parity.test.ts`).
 * Reciprocal inline pins: `pause-reflect-ambience-io-parity.test.ts` ↔
 * `pause-reflect-hub-io-parity.test.ts`.
 */
describe('pause-reflect-ambience-io ↔ pause-reflect-hub-io sibling parity (application)', () => {
  it('ambience-io and hub-io are distinct presentation I/O surfaces', () => {
    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');

    expect(typeof pauseShiftEmotionFrameHubDone).toBe('function');
    expect(typeof pauseShiftEmotionFrameHubDoneWithRepository).toBe('function');
    expect(typeof buildShiftEmotionFrameHubLogBundle).toBe('function');
    expect(typeof resolveShiftFrameHubDonePresentation).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect('pauseShiftEmotionFrameHubDone' in ambienceIo).toBe(false);
    expect('pauseShiftEmotionFrameHubDoneWithRepository' in ambienceIo).toBe(false);
    expect('buildShiftEmotionFrameHubLogBundle' in ambienceIo).toBe(false);
    expect('resolveShiftFrameHubDonePresentation' in ambienceIo).toBe(false);
    expect('reflectPauseRepository' in ambienceIo).toBe(false);

    expect('startPauseReflectFrameFocusAmbience' in hubIo).toBe(false);
    expect('stopPauseReflectFrameFocusAmbience' in hubIo).toBe(false);
  });

  it('frame-focus ambience I/O keeps Web Audio bed off shift-frame hub RPC and mapping', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(reflectPauseRepository);
  });

  it('shift-frame hub I/O keeps RPC wrappers and presentation mapping off frame-focus ambience bed', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(resolveShiftFrameHubDonePresentation).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(reflectPauseRepository).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(pauseShiftEmotionFrameHubDone);
  });
});
