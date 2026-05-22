import { describe, expect, it } from 'vitest';

import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
} from './pause-reflection-share-channel-urls-flow';

describe('pause-reflection-share-channel-urls-flow', () => {
  it('re-exports social channel URL builders from domain/reflect/share', () => {
    expect(typeof buildReflectionShareTelegramUrl).toBe('function');
    expect(typeof buildReflectionShareTweetUrl).toBe('function');
    expect(typeof buildReflectionShareWhatsAppUrl).toBe('function');
  });
});
