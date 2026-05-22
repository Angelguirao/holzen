import { describe, expect, it } from 'vitest';

import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from './pause-reflect-ambience-io';
import * as ambienceIo from './pause-reflect-ambience-io';
import * as shareIo from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  pauseReflectionShareImage,
} from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';

/**
 * Presentation sibling parity: ambience-io vs share-io (parity with
 * `pause-reflect-ambience-mood-io-sibling-parity.test.ts` and
 * `pause-reflect-share-hub-io-sibling-parity.test.ts`).
 */
describe('pause-reflect-ambience-io ↔ pause-reflect-share-io sibling parity', () => {
  it('ambience-io and share-io are distinct presentation I/O surfaces', () => {
    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');

    expect(typeof buildReflectionShareText).toBe('function');
    expect(typeof buildReflectionShareTweetUrl).toBe('function');
    expect(typeof buildReflectionShareWhatsAppUrl).toBe('function');
    expect(typeof buildReflectionShareTelegramUrl).toBe('function');
    expect(typeof pauseReflectionShareImage).toBe('function');

    expect('pauseReflectionShareImage' in ambienceIo).toBe(false);
    expect('buildReflectionShareText' in ambienceIo).toBe(false);
    expect('buildReflectionShareTweetUrl' in ambienceIo).toBe(false);

    expect('startPauseReflectFrameFocusAmbience' in shareIo).toBe(false);
    expect('stopPauseReflectFrameFocusAmbience' in shareIo).toBe(false);
  });

  it('frame-focus ambience I/O keeps Web Audio bed off reflection share builders and PNG orchestration', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(pauseReflectionShareImage);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(buildReflectionShareText);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(buildReflectionShareTweetUrl);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(buildReflectionShareWhatsAppUrl);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(buildReflectionShareTelegramUrl);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(stopPauseReflectFrameFocusAmbience);
  });

  it('share-io exports stay off frame-focus ambience bed start/stop', () => {
    expect(pauseReflectionShareImage).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(buildReflectionShareText).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(buildReflectionShareTweetUrl).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(buildReflectionShareTelegramUrl).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(buildReflectionShareWhatsAppUrl).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseReflectionShareImage).not.toBe(buildReflectionShareText);
  });
});
