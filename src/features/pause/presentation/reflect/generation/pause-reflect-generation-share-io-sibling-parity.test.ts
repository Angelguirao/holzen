import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  supabaseReflectGenerator: { port: 'reflectGenerator' },
}));

import * as generationIo from './pause-reflect-generation-io';
import {
  messageFromReflectGenerationResult,
  pauseReflectGeneration,
  reflectGenerationPrerequisite,
  reflectGenerator,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
  shouldCommitReflectGeneration,
} from './pause-reflect-generation-io';
import * as shareIo from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  pauseReflectionShareImage,
} from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';

/**
 * Presentation sibling parity: generation-io vs share-io (parity with application
 * `pause-reflect-generation-share-flow-sibling-parity.test.ts`; manual-open stays on
 * `pause-home-reflect-io`, not generation-io).
 */
describe('pause-reflect-generation-io ↔ pause-reflect-share-io sibling parity', () => {
  it('generation-io and share-io are distinct presentation I/O surfaces', () => {
    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof pauseReflectGeneration).toBe('function');
    expect(typeof resolveReflectGenerationPrefetch).toBe('function');
    expect(typeof reflectGenerationPrerequisite).toBe('function');
    expect(typeof reflectGenerator).toBe('object');

    expect(typeof buildReflectionShareText).toBe('function');
    expect(typeof buildReflectionShareTweetUrl).toBe('function');
    expect(typeof buildReflectionShareWhatsAppUrl).toBe('function');
    expect(typeof buildReflectionShareTelegramUrl).toBe('function');
    expect(typeof pauseReflectionShareImage).toBe('function');

    expect('buildReflectionShareText' in generationIo).toBe(false);
    expect('pauseReflectionShareImage' in generationIo).toBe(false);
    expect('buildReflectionShareTelegramUrl' in generationIo).toBe(false);

    expect('runReflectGeneration' in shareIo).toBe(false);
    expect('pauseReflectGeneration' in shareIo).toBe(false);
    expect('resolveReflectGenerationPrefetch' in shareIo).toBe(false);
    expect('reflectGenerator' in shareIo).toBe(false);
  });

  it('generation-io exports stay off reflection share builders and PNG orchestration', () => {
    expect(runReflectGeneration).not.toBe(pauseReflectionShareImage);
    expect(pauseReflectGeneration).not.toBe(buildReflectionShareText);
    expect(resolveReflectGenerationPrefetch).not.toBe(buildReflectionShareTelegramUrl);
    expect(reflectGenerationPrerequisite).not.toBe(buildReflectionShareTweetUrl);
    expect(messageFromReflectGenerationResult).not.toBe(buildReflectionShareWhatsAppUrl);
    expect(shouldCommitReflectGeneration).not.toBe(pauseReflectionShareImage);
    expect(reflectGenerator).not.toBe(buildReflectionShareText);
  });

  it('share-io exports stay off holzen-reflect generation port and prefetch helpers', () => {
    expect(pauseReflectionShareImage).not.toBe(runReflectGeneration);
    expect(buildReflectionShareText).not.toBe(pauseReflectGeneration);
    expect(buildReflectionShareTelegramUrl).not.toBe(resolveReflectGenerationPrefetch);
    expect(buildReflectionShareTweetUrl).not.toBe(reflectGenerationPrerequisite);
    expect(buildReflectionShareWhatsAppUrl).not.toBe(messageFromReflectGenerationResult);
    expect(pauseReflectionShareImage).not.toBe(reflectGenerator);
    expect(buildReflectionShareText).not.toBe(shouldCommitReflectGeneration);
  });
});
