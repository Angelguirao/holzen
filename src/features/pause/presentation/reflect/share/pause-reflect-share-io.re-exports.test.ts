import { describe, expect, it } from 'vitest';

import { runReflectionShareImage as runReflectionShareImageDirect } from '@/features/pause/application/use-cases/ritual/reflect/share/run-reflection-share-image';
import {
  buildReflectionShareTelegramUrl as buildTelegramFromShareFlow,
  buildReflectionShareText as buildTextFromShareFlow,
  buildReflectionShareTweetUrl as buildTweetFromShareFlow,
  buildReflectionShareWhatsAppUrl as buildWhatsAppFromShareFlow,
  runReflectionShareImage as runReflectionShareImageFromShareFlow,
} from '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-flow';
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

  it('presentation I/O bindings match pause-reflect-share-flow CI anchor (leaf parity)', () => {
    expect(buildReflectionShareText).toBe(buildTextFromShareFlow);
    expect(buildReflectionShareText).toBe(buildTextDirect);
    expect(buildReflectionShareTweetUrl).toBe(buildTweetFromShareFlow);
    expect(buildReflectionShareTweetUrl).toBe(buildTweetDirect);
    expect(buildReflectionShareTelegramUrl).toBe(buildTelegramFromShareFlow);
    expect(buildReflectionShareTelegramUrl).toBe(buildTelegramDirect);
    expect(buildReflectionShareWhatsAppUrl).toBe(buildWhatsAppFromShareFlow);
    expect(buildReflectionShareWhatsAppUrl).toBe(buildWhatsAppDirect);
    expect(runReflectionShareImageFromShareFlow).toBe(runReflectionShareImageDirect);
  });
});
