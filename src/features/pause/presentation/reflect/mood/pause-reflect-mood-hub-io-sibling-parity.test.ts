import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import {
  buildShiftEmotionFrameHubLogBundle,
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  reflectPauseRepository as hubReflectPauseRepository,
  resolveShiftFrameHubDonePresentation,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import * as hubIo from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import {
  buildFeelTilesMoodLogOptions,
  pauseInitialEmotionSelect,
  pauseInitialEmotionSkip,
  pauseInitialEmotionSelectWithRepository,
  pauseInitialEmotionSkipWithRepository,
  reflectPauseRepository as moodReflectPauseRepository,
} from './pause-reflect-mood-io';
import * as moodIo from './pause-reflect-mood-io';

/**
 * Presentation sibling parity: mood-io vs hub-io (parity with application
 * `pause-reflect-hub-mood-flow-sibling-parity.test.ts`, mood-anchored
 * `application/.../mood/pause-reflect-mood-hub-io-sibling-parity.test.ts`, and hub-anchored
 * `application/.../hub/pause-reflect-hub-mood-io-sibling-parity.test.ts`; complements
 * `pause-reflect-steps-mood-io-sibling-parity.test.ts`).
 */
describe('pause-reflect-mood-io ↔ pause-reflect-hub-io sibling parity', () => {
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
