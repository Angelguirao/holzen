import { describe, expect, it } from 'vitest';

import * as shareIo from './pause-reflect-share-io';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  pauseReflectionShareImage,
} from './pause-reflect-share-io';
import * as ambienceIo from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';

/**
 * Share-anchored presentation sibling parity; ambience-anchored mirror:
 * `ambience/pause-reflect-ambience-share-io-sibling-parity.test.ts`.
 */
describe('pause-reflect-share-io ↔ pause-reflect-ambience-io sibling parity', () => {
  it('share-io and ambience-io are distinct presentation I/O surfaces', () => {
    expect(typeof buildReflectionShareText).toBe('function');
    expect(typeof buildReflectionShareTweetUrl).toBe('function');
    expect(typeof buildReflectionShareWhatsAppUrl).toBe('function');
    expect(typeof buildReflectionShareTelegramUrl).toBe('function');
    expect(typeof pauseReflectionShareImage).toBe('function');

    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');

    expect('startPauseReflectFrameFocusAmbience' in shareIo).toBe(false);
    expect('stopPauseReflectFrameFocusAmbience' in shareIo).toBe(false);

    expect('pauseReflectionShareImage' in ambienceIo).toBe(false);
    expect('buildReflectionShareText' in ambienceIo).toBe(false);
    expect('buildReflectionShareTweetUrl' in ambienceIo).toBe(false);
  });

  it('share-io exports stay off frame-focus ambience bed start/stop', () => {
    expect(pauseReflectionShareImage).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(buildReflectionShareText).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(buildReflectionShareTweetUrl).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(buildReflectionShareTelegramUrl).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(buildReflectionShareWhatsAppUrl).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseReflectionShareImage).not.toBe(buildReflectionShareTweetUrl);
  });

  it('ambience-io exports stay off reflection share builders and PNG orchestration', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(pauseReflectionShareImage);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(buildReflectionShareText);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(buildReflectionShareTweetUrl);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(buildReflectionShareWhatsAppUrl);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(buildReflectionShareTelegramUrl);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(stopPauseReflectFrameFocusAmbience);
  });
});
