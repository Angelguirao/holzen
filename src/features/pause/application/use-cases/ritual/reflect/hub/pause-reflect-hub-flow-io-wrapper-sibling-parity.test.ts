import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
}));

/**
 * Application sibling parity: hub-flow CI umbrella vs presentation hub-io wrappers.
 * Presentation mirror: `presentation/reflect/hub/pause-reflect-hub-flow-io-wrapper-sibling-parity.test.ts`.
 */
import {
  buildShiftEmotionFrameHubLogBundle,
  resolveShiftFrameHubDonePresentation,
  runShiftEmotionFrameHubDone,
} from './pause-reflect-hub-flow';
import * as hubFlow from './pause-reflect-hub-flow';
import {
  buildShiftEmotionFrameHubLogBundle as buildLogBundleFromHubIo,
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  reflectPauseRepository,
  resolveShiftFrameHubDonePresentation as resolvePresentationFromHubIo,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import * as hubIo from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';

describe('pause-reflect-hub-flow ↔ pause-reflect-hub-io wrapper sibling parity (application)', () => {
  it('hub-flow CI umbrella and presentation hub-io are distinct anchors', () => {
    expect(typeof runShiftEmotionFrameHubDone).toBe('function');
    expect(typeof buildShiftEmotionFrameHubLogBundle).toBe('function');
    expect(typeof resolveShiftFrameHubDonePresentation).toBe('function');
    expect(typeof pauseShiftEmotionFrameHubDone).toBe('function');
    expect(typeof pauseShiftEmotionFrameHubDoneWithRepository).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect('pauseShiftEmotionFrameHubDone' in hubFlow).toBe(false);
    expect('pauseShiftEmotionFrameHubDoneWithRepository' in hubFlow).toBe(false);
    expect('reflectPauseRepository' in hubFlow).toBe(false);

    expect('runShiftEmotionFrameHubDone' in hubIo).toBe(false);
    expect('pauseShiftEmotionFrameHubDone' in hubIo).toBe(true);
    expect('pauseShiftEmotionFrameHubDoneWithRepository' in hubIo).toBe(true);
    expect('reflectPauseRepository' in hubIo).toBe(true);
  });

  it('hub-flow and hub-io share domain hub re-exports', () => {
    expect(buildShiftEmotionFrameHubLogBundle).toBe(buildLogBundleFromHubIo);
    expect(resolveShiftFrameHubDonePresentation).toBe(resolvePresentationFromHubIo);
  });

  it('hub-flow leaf exports stay off presentation port-bound wrappers', () => {
    expect(runShiftEmotionFrameHubDone).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(runShiftEmotionFrameHubDone).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(runShiftEmotionFrameHubDone).not.toBe(reflectPauseRepository);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(resolveShiftFrameHubDonePresentation).not.toBe(reflectPauseRepository);
  });

  it('presentation hub-io wrappers stay off hub-flow leaf re-exports', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(runShiftEmotionFrameHubDone);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(runShiftEmotionFrameHubDone);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(reflectPauseRepository).not.toBe(runShiftEmotionFrameHubDone);
    expect(buildLogBundleFromHubIo).not.toBe(pauseShiftEmotionFrameHubDone);
  });
});
