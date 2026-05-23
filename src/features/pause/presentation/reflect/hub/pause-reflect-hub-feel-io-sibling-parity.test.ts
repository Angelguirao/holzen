import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import * as hubIo from './pause-reflect-hub-io';
import {
  buildShiftEmotionFrameHubLogBundle,
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  reflectPauseRepository as hubReflectPauseRepository,
  resolveShiftFrameHubDonePresentation,
} from './pause-reflect-hub-io';
import * as moodIo from '../../feel/pause-feel-io';
import {
  buildFeelTilesMoodLogOptions,
  pauseInitialEmotionSelect,
  pauseInitialEmotionSkip,
  pauseInitialEmotionSelectWithRepository,
  pauseInitialEmotionSkipWithRepository,
  reflectPauseRepository as moodReflectPauseRepository,
} from '../../feel/pause-feel-io';

/**
 * Presentation sibling parity: hub-io vs mood-io (hub-anchored; parity with application
 * `application/.../hub/pause-reflect-hub-feel-io-sibling-parity.test.ts`, flow-level
 * `pause-reflect-hub-feel-flow-sibling-parity.test.ts`, and mood-anchored
 * `mood/pause-feel-hub-io-sibling-parity.test.ts`).
 * Reciprocal inline pins: `pause-reflect-hub-io.test.ts` ↔ `pause-feel-io.test.ts`.
 */
describe('pause-reflect-hub-io ↔ pause-feel-io sibling parity', () => {
  it('hub-io and mood-io are distinct presentation I/O surfaces', () => {
    expect(typeof pauseShiftEmotionFrameHubDone).toBe('function');
    expect(typeof pauseShiftEmotionFrameHubDoneWithRepository).toBe('function');
    expect(typeof buildShiftEmotionFrameHubLogBundle).toBe('function');
    expect(typeof resolveShiftFrameHubDonePresentation).toBe('function');
    expect(typeof hubReflectPauseRepository).toBe('object');

    expect(typeof pauseInitialEmotionSelect).toBe('function');
    expect(typeof pauseInitialEmotionSkip).toBe('function');
    expect(typeof pauseInitialEmotionSelectWithRepository).toBe('function');
    expect(typeof pauseInitialEmotionSkipWithRepository).toBe('function');
    expect(typeof buildFeelTilesMoodLogOptions).toBe('function');
    expect(typeof moodReflectPauseRepository).toBe('object');

    expect('pauseInitialEmotionSelect' in hubIo).toBe(false);
    expect('pauseInitialEmotionSkip' in hubIo).toBe(false);
    expect('buildFeelTilesMoodLogOptions' in hubIo).toBe(false);

    expect('pauseShiftEmotionFrameHubDone' in moodIo).toBe(false);
    expect('buildShiftEmotionFrameHubLogBundle' in moodIo).toBe(false);
    expect('resolveShiftFrameHubDonePresentation' in moodIo).toBe(false);
  });

  it('hub-io exports stay off initial-emotion RPC and feel-tile helpers', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseInitialEmotionSelect);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseInitialEmotionSkip);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(pauseInitialEmotionSelectWithRepository);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(pauseInitialEmotionSkipWithRepository);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(buildFeelTilesMoodLogOptions);
    expect(resolveShiftFrameHubDonePresentation).not.toBe(buildFeelTilesMoodLogOptions);
  });

  it('mood-io exports stay off shift-frame hub done RPC and presentation mapping', () => {
    expect(pauseInitialEmotionSelect).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseInitialEmotionSkip).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(buildFeelTilesMoodLogOptions).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(buildFeelTilesMoodLogOptions).not.toBe(resolveShiftFrameHubDonePresentation);
  });
});
