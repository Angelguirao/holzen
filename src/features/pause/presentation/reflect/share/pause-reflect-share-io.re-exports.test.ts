import { describe, expect, it } from 'vitest';

import {
  buildReflectionShareTelegramUrl as buildTelegramDirect,
  buildReflectionShareTweetUrl as buildTweetDirect,
  buildReflectionShareWhatsAppUrl as buildWhatsAppDirect,
} from '@/features/pause/domain/reflect/share/reflection-share-channel-urls';
import { buildReflectionShareText as buildTextDirect } from '@/features/pause/domain/reflect/share/reflection-share-text';

import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
} from './pause-reflect-share-io';

describe('pause-reflect-share-io re-exports', () => {
  it('re-exports share builders with identity bindings to domain leaf modules', () => {
    expect(buildReflectionShareText).toBe(buildTextDirect);
    expect(buildReflectionShareTweetUrl).toBe(buildTweetDirect);
    expect(buildReflectionShareTelegramUrl).toBe(buildTelegramDirect);
    expect(buildReflectionShareWhatsAppUrl).toBe(buildWhatsAppDirect);
  });
});
