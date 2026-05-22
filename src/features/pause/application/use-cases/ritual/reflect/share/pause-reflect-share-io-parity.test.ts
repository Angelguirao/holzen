import { describe, expect, it } from 'vitest';

import {
  deliverReflectionShareImage as deliverReflectionShareImageDirect,
} from '@/features/pause/application/use-cases/ritual/reflect/share/deliver-reflection-share-image';
import {
  deliverReflectionShareImage,
  runReflectionShareImage as runReflectionShareImageFromOrchestration,
} from '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-orchestration-flow';
import { runReflectionShareImage as runReflectionShareImageDirect } from '@/features/pause/application/use-cases/ritual/reflect/share/run-reflection-share-image';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  runReflectionShareImage,
} from '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-flow';
import {
  buildReflectionShareTelegramUrl as buildTelegramFromShareIo,
  buildReflectionShareText as buildTextFromShareIo,
  buildReflectionShareTweetUrl as buildTweetFromShareIo,
  buildReflectionShareWhatsAppUrl as buildWhatsAppFromShareIo,
  pauseReflectionShareImage,
} from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';

describe('pause-reflect-share-io parity', () => {
  it('presentation I/O share builder exports match share CI umbrella', () => {
    expect(buildReflectionShareText).toBe(buildTextFromShareIo);
    expect(buildReflectionShareTweetUrl).toBe(buildTweetFromShareIo);
    expect(buildReflectionShareTelegramUrl).toBe(buildTelegramFromShareIo);
    expect(buildReflectionShareWhatsAppUrl).toBe(buildWhatsAppFromShareIo);
    expect(runReflectionShareImage).toBe(runReflectionShareImageDirect);
  });

  it('share-flow and orchestration-flow re-export the same runReflectionShareImage leaf as presentation I/O', () => {
    expect(runReflectionShareImage).toBe(runReflectionShareImageFromOrchestration);
    expect(runReflectionShareImageFromOrchestration).toBe(runReflectionShareImageDirect);
    expect(typeof pauseReflectionShareImage).toBe('function');
  });

  it('share orchestration CI umbrella composes deliver + run leaf modules', () => {
    expect(deliverReflectionShareImage).toBe(deliverReflectionShareImageDirect);
    expect(runReflectionShareImageFromOrchestration).toBe(runReflectionShareImageDirect);
  });
});
