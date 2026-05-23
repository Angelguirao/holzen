import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import * as hubIo from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import {
  buildShiftEmotionFrameHubLogBundle,
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  reflectPauseRepository as hubReflectPauseRepository,
  resolveShiftFrameHubDonePresentation,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import * as moodIo from '@/features/pause/presentation/feel/pause-feel-io';
import {
  buildFeelTilesMoodLogOptions,
  pauseInitialEmotionSelect,
  pauseInitialEmotionSkip,
  pauseInitialEmotionSelectWithRepository,
  pauseInitialEmotionSkipWithRepository,
  reflectPauseRepository as moodReflectPauseRepository,
} from '@/features/pause/presentation/feel/pause-feel-io';

/**
 * Application sibling parity: mood-io vs hub-io (mood-anchored; parity with presentation
 * `pause-feel-hub-io-sibling-parity.test.ts` and flow-level
 * `pause-reflect-hub-feel-flow-sibling-parity.test.ts`; complements hub-anchored
 * `hub/pause-reflect-hub-feel-io-sibling-parity.test.ts`).
 * Reciprocal inline pins: `pause-feel-io-parity.test.ts` ↔ `pause-reflect-hub-io-parity.test.ts` (application).
 */
describe('pause-feel-io ↔ pause-reflect-hub-io sibling parity (application)', () => {
  it('mood-io and hub-io are distinct presentation I/O surfaces', () => {
    expect(typeof pauseInitialEmotionSelect).toBe('function');
    expect(typeof pauseInitialEmotionSkip).toBe('function');
    expect(typeof pauseInitialEmotionSelectWithRepository).toBe('function');
    expect(typeof pauseInitialEmotionSkipWithRepository).toBe('function');
    expect(typeof buildFeelTilesMoodLogOptions).toBe('function');
    expect(typeof moodReflectPauseRepository).toBe('object');

    expect(typeof pauseShiftEmotionFrameHubDone).toBe('function');
    expect(typeof pauseShiftEmotionFrameHubDoneWithRepository).toBe('function');
    expect(typeof buildShiftEmotionFrameHubLogBundle).toBe('function');
    expect(typeof resolveShiftFrameHubDonePresentation).toBe('function');
    expect(typeof hubReflectPauseRepository).toBe('object');

    expect('pauseShiftEmotionFrameHubDone' in moodIo).toBe(false);
    expect('pauseShiftEmotionFrameHubDoneWithRepository' in moodIo).toBe(false);
    expect('buildShiftEmotionFrameHubLogBundle' in moodIo).toBe(false);
    expect('resolveShiftFrameHubDonePresentation' in moodIo).toBe(false);

    expect('pauseInitialEmotionSelect' in hubIo).toBe(false);
    expect('pauseInitialEmotionSkip' in hubIo).toBe(false);
    expect('pauseInitialEmotionSelectWithRepository' in hubIo).toBe(false);
    expect('pauseInitialEmotionSkipWithRepository' in hubIo).toBe(false);
    expect('buildFeelTilesMoodLogOptions' in hubIo).toBe(false);
  });

  it('mood-io exports stay off shift-frame hub done RPC and log bundle', () => {
    expect(pauseInitialEmotionSelect).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseInitialEmotionSkip).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(pauseInitialEmotionSkipWithRepository).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(buildFeelTilesMoodLogOptions).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(buildFeelTilesMoodLogOptions).not.toBe(resolveShiftFrameHubDonePresentation);
  });

  it('hub-io exports stay off initial-emotion RPC and feel-tile helpers', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseInitialEmotionSelect);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseInitialEmotionSkip);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(pauseInitialEmotionSelectWithRepository);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(pauseInitialEmotionSkipWithRepository);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(buildFeelTilesMoodLogOptions);
    expect(resolveShiftFrameHubDonePresentation).not.toBe(buildFeelTilesMoodLogOptions);
  });
});
