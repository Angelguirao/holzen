import { describe, expect, it } from 'vitest';

import { buildReflectionShareText } from '@/features/pause/domain/reflect/share/reflection-share-text';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
} from '@/features/pause/domain/reflect/share/reflection-share-channel-urls';

import {
  deliverReflectionShareImage as deliverShareImageDirect,
} from './deliver-reflection-share-image';
import { runReflectionShareImage as runShareImageDirect } from './run-reflection-share-image';

import {
  deliverReflectionShareImage,
  buildReflectionShareTelegramUrl as buildTelegramFromFlow,
  buildReflectionShareText as buildTextFromFlow,
  buildReflectionShareTweetUrl as buildTweetFromFlow,
  buildReflectionShareWhatsAppUrl as buildWhatsAppFromFlow,
  runReflectionShareImage,
} from './pause-reflect-share-orchestration-flow';

describe('pause-reflect-share-orchestration-flow', () => {
  it('re-exports share orchestration leaf modules and domain builders', () => {
    expect(typeof runReflectionShareImage).toBe('function');
    expect(typeof deliverReflectionShareImage).toBe('function');
    expect(typeof buildTextFromFlow).toBe('function');
    expect(typeof buildTelegramFromFlow).toBe('function');
    expect(typeof buildTweetFromFlow).toBe('function');
    expect(typeof buildWhatsAppFromFlow).toBe('function');

    expect(runReflectionShareImage).toBe(runShareImageDirect);
    expect(deliverReflectionShareImage).toBe(deliverShareImageDirect);
    expect(buildTextFromFlow).toBe(buildReflectionShareText);
    expect(buildTelegramFromFlow).toBe(buildReflectionShareTelegramUrl);
    expect(buildTweetFromFlow).toBe(buildReflectionShareTweetUrl);
    expect(buildWhatsAppFromFlow).toBe(buildReflectionShareWhatsAppUrl);
  });
});
