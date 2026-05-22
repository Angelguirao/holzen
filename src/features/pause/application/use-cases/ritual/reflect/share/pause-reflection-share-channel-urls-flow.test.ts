import { describe, expect, it } from 'vitest';

import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
} from '@/features/pause/domain/reflect/share/reflection-share-channel-urls';

import {
  buildReflectionShareTelegramUrl as buildTelegramFromFlow,
  buildReflectionShareTweetUrl as buildTweetFromFlow,
  buildReflectionShareWhatsAppUrl as buildWhatsAppFromFlow,
} from './pause-reflection-share-channel-urls-flow';

describe('pause-reflection-share-channel-urls-flow', () => {
  it('re-exports social channel URL builders from domain/reflect/share', () => {
    expect(typeof buildTelegramFromFlow).toBe('function');
    expect(typeof buildTweetFromFlow).toBe('function');
    expect(typeof buildWhatsAppFromFlow).toBe('function');

    expect(buildTelegramFromFlow).toBe(buildReflectionShareTelegramUrl);
    expect(buildTweetFromFlow).toBe(buildReflectionShareTweetUrl);
    expect(buildWhatsAppFromFlow).toBe(buildReflectionShareWhatsAppUrl);
  });
});
