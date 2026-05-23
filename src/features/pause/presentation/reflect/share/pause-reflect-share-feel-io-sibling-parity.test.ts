import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  pauseReflectionShareImage,
} from './pause-reflect-share-io';
import * as shareIo from './pause-reflect-share-io';
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
 * Presentation sibling parity: share-io vs mood-io (parity with application
 * `pause-reflect-share-feel-io-sibling-parity.test.ts` and flow-level
 * `pause-reflect-share-feel-flow-sibling-parity.test.ts`).
 */
describe('pause-reflect-share-io ↔ pause-feel-io sibling parity', () => {
  it('share-io and mood-io are distinct presentation I/O surfaces', () => {
    expect(typeof buildReflectionShareText).toBe('function');
    expect(typeof buildReflectionShareTweetUrl).toBe('function');
    expect(typeof buildReflectionShareWhatsAppUrl).toBe('function');
    expect(typeof buildReflectionShareTelegramUrl).toBe('function');
    expect(typeof pauseReflectionShareImage).toBe('function');

    expect(typeof pauseInitialEmotionSelect).toBe('function');
    expect(typeof pauseInitialEmotionSkip).toBe('function');
    expect(typeof pauseInitialEmotionSelectWithRepository).toBe('function');
    expect(typeof pauseInitialEmotionSkipWithRepository).toBe('function');
    expect(typeof buildFeelTilesMoodLogOptions).toBe('function');
    expect(typeof moodReflectPauseRepository).toBe('object');

    expect('pauseInitialEmotionSelect' in shareIo).toBe(false);
    expect('pauseInitialEmotionSkip' in shareIo).toBe(false);
    expect('pauseInitialEmotionSelectWithRepository' in shareIo).toBe(false);
    expect('pauseInitialEmotionSkipWithRepository' in shareIo).toBe(false);
    expect('buildFeelTilesMoodLogOptions' in shareIo).toBe(false);
    expect('reflectPauseRepository' in shareIo).toBe(false);

    expect('buildReflectionShareText' in moodIo).toBe(false);
    expect('pauseReflectionShareImage' in moodIo).toBe(false);
    expect('buildReflectionShareTelegramUrl' in moodIo).toBe(false);
    expect('buildReflectionShareTweetUrl' in moodIo).toBe(false);
    expect('buildReflectionShareWhatsAppUrl' in moodIo).toBe(false);
  });

  it('share-io exports stay off initial-emotion RPC and feel-tile mood helpers', () => {
    expect(pauseReflectionShareImage).not.toBe(pauseInitialEmotionSelect);
    expect(pauseReflectionShareImage).not.toBe(pauseInitialEmotionSkip);
    expect(buildReflectionShareText).not.toBe(pauseInitialEmotionSelectWithRepository);
    expect(buildReflectionShareTelegramUrl).not.toBe(pauseInitialEmotionSkipWithRepository);
    expect(buildReflectionShareTweetUrl).not.toBe(buildFeelTilesMoodLogOptions);
    expect(buildReflectionShareWhatsAppUrl).not.toBe(moodReflectPauseRepository);
    expect(pauseReflectionShareImage).not.toBe(moodReflectPauseRepository);
  });

  it('mood-io exports stay off reflection share builders and PNG orchestration', () => {
    expect(pauseInitialEmotionSelect).not.toBe(pauseReflectionShareImage);
    expect(pauseInitialEmotionSkip).not.toBe(buildReflectionShareText);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(buildReflectionShareTelegramUrl);
    expect(pauseInitialEmotionSkipWithRepository).not.toBe(buildReflectionShareTweetUrl);
    expect(buildFeelTilesMoodLogOptions).not.toBe(buildReflectionShareWhatsAppUrl);
    expect(moodReflectPauseRepository).not.toBe(pauseReflectionShareImage);
    expect(pauseInitialEmotionSelect).not.toBe(buildReflectionShareText);
    expect(pauseInitialEmotionSkip).not.toBe(buildReflectionShareTweetUrl);
  });
});
