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
  buildReflectionShareTelegramUrl as buildTelegramFromChannelFlow,
  buildReflectionShareTweetUrl as buildTweetFromChannelFlow,
  buildReflectionShareWhatsAppUrl as buildWhatsAppFromChannelFlow,
} from './pause-reflection-share-channel-urls-flow';
import {
  deliverReflectionShareImage as deliverShareImageFromImageFlow,
  runReflectionShareImage as runShareImageFromImageFlow,
} from './pause-reflection-share-image-flow';
import {
  buildReflectionShareText as buildTextFromTextFlow,
} from './pause-reflection-share-text-flow';
import {
  buildReflectionShareTelegramUrl as buildTelegramFromShareFlow,
  buildReflectionShareText as buildTextFromShareFlow,
  buildReflectionShareTweetUrl as buildTweetFromShareFlow,
  buildReflectionShareWhatsAppUrl as buildWhatsAppFromShareFlow,
  runReflectionShareImage as runShareImageFromShareFlow,
} from './pause-reflect-share-flow';
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

  it('orchestration bindings match share subcluster CI anchors (leaf parity)', () => {
    expect(buildTextFromFlow).toBe(buildTextFromTextFlow);
    expect(buildTelegramFromFlow).toBe(buildTelegramFromChannelFlow);
    expect(buildTweetFromFlow).toBe(buildTweetFromChannelFlow);
    expect(buildWhatsAppFromFlow).toBe(buildWhatsAppFromChannelFlow);
    expect(runReflectionShareImage).toBe(runShareImageFromImageFlow);
    expect(deliverReflectionShareImage).toBe(deliverShareImageFromImageFlow);
  });

  it('orchestration umbrella bindings match share presentation umbrella for shared exports', () => {
    expect(runReflectionShareImage).toBe(runShareImageFromShareFlow);
    expect(buildTextFromFlow).toBe(buildTextFromShareFlow);
    expect(buildTelegramFromFlow).toBe(buildTelegramFromShareFlow);
    expect(buildTweetFromFlow).toBe(buildTweetFromShareFlow);
    expect(buildWhatsAppFromFlow).toBe(buildWhatsAppFromShareFlow);
  });
});
