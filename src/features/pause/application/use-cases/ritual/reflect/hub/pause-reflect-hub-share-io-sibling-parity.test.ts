import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import * as hubIo from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import {
  buildShiftEmotionFrameHubLogBundle,
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  reflectPauseRepository,
  resolveShiftFrameHubDonePresentation,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import * as shareIo from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  pauseReflectionShareImage,
} from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';

/**
 * Application sibling parity: hub-io vs share-io (parity with presentation
 * `pause-reflect-hub-share-io-sibling-parity.test.ts` and hub-anchored flow
 * `pause-reflect-hub-share-flow-sibling-parity.test.ts`; complements share-anchored
 * `share/pause-reflect-share-hub-flow-sibling-parity.test.ts`).
 * Reciprocal inline pins: `pause-reflect-hub-io.test.ts` ↔ `pause-reflect-share-io.test.ts`.
 */
describe('pause-reflect-hub-io ↔ pause-reflect-share-io sibling parity (application)', () => {
  it('hub-io and share-io are distinct presentation I/O surfaces', () => {
    expect(typeof pauseShiftEmotionFrameHubDone).toBe('function');
    expect(typeof pauseShiftEmotionFrameHubDoneWithRepository).toBe('function');
    expect(typeof buildShiftEmotionFrameHubLogBundle).toBe('function');
    expect(typeof resolveShiftFrameHubDonePresentation).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect(typeof buildReflectionShareText).toBe('function');
    expect(typeof buildReflectionShareTweetUrl).toBe('function');
    expect(typeof buildReflectionShareWhatsAppUrl).toBe('function');
    expect(typeof buildReflectionShareTelegramUrl).toBe('function');
    expect(typeof pauseReflectionShareImage).toBe('function');

    expect('pauseReflectionShareImage' in hubIo).toBe(false);
    expect('buildReflectionShareText' in hubIo).toBe(false);
    expect('buildReflectionShareTweetUrl' in hubIo).toBe(false);

    expect('pauseShiftEmotionFrameHubDone' in shareIo).toBe(false);
    expect('buildShiftEmotionFrameHubLogBundle' in shareIo).toBe(false);
    expect('resolveShiftFrameHubDonePresentation' in shareIo).toBe(false);
    expect('reflectPauseRepository' in shareIo).toBe(false);
  });

  it('hub-io exports stay off reflection share builders and PNG orchestration', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseReflectionShareImage);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(buildReflectionShareText);
    expect(resolveShiftFrameHubDonePresentation).not.toBe(buildReflectionShareTweetUrl);
    expect(reflectPauseRepository).not.toBe(buildReflectionShareWhatsAppUrl);
  });

  it('share-io exports stay off shift-frame hub RPC and presentation mapping', () => {
    expect(pauseReflectionShareImage).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(buildReflectionShareText).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(buildReflectionShareTweetUrl).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(buildReflectionShareTelegramUrl).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
  });
});
