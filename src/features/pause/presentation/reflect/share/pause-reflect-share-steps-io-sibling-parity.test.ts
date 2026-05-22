import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  reflectionStepSessionStorage: { storage: 'reflectionStepSessionStorage' },
}));

import * as stepsIo from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';
import {
  pauseReflectFavoriteToggle,
  pauseReflectFavoriteToggleWithRepository,
  pauseReflectNoteUpdate,
  pauseReflectTagUpdate,
  pauseReflectionStepLogOnce,
  pauseReflectionStepLogOnceWithRepository,
  reflectPauseRepository,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';
import * as shareIo from './pause-reflect-share-io';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  pauseReflectionShareImage,
} from './pause-reflect-share-io';

/**
 * Presentation sibling parity: share-io vs steps-io (parity with application
 * `pause-reflect-share-steps-io-sibling-parity.test.ts` and flow-level
 * `pause-reflect-steps-share-flow-sibling-parity.test.ts`).
 */
describe('pause-reflect-share-io ↔ pause-reflect-steps-io sibling parity', () => {
  it('share-io and steps-io are distinct presentation I/O surfaces', () => {
    expect(typeof buildReflectionShareText).toBe('function');
    expect(typeof buildReflectionShareTweetUrl).toBe('function');
    expect(typeof buildReflectionShareWhatsAppUrl).toBe('function');
    expect(typeof buildReflectionShareTelegramUrl).toBe('function');
    expect(typeof pauseReflectionShareImage).toBe('function');

    expect(typeof pauseReflectFavoriteToggle).toBe('function');
    expect(typeof pauseReflectNoteUpdate).toBe('function');
    expect(typeof pauseReflectTagUpdate).toBe('function');
    expect(typeof pauseReflectionStepLogOnce).toBe('function');
    expect(typeof pauseReflectFavoriteToggleWithRepository).toBe('function');
    expect(typeof pauseReflectionStepLogOnceWithRepository).toBe('function');
    expect(typeof shouldShowFavoriteProHint).toBe('function');
    expect(typeof shouldLogPauseReflectionStep).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect('pauseReflectFavoriteToggle' in shareIo).toBe(false);
    expect('pauseReflectNoteUpdate' in shareIo).toBe(false);
    expect('pauseReflectTagUpdate' in shareIo).toBe(false);
    expect('pauseReflectionStepLogOnce' in shareIo).toBe(false);
    expect('shouldShowFavoriteProHint' in shareIo).toBe(false);
    expect('shouldLogPauseReflectionStep' in shareIo).toBe(false);
    expect('reflectPauseRepository' in shareIo).toBe(false);

    expect('buildReflectionShareText' in stepsIo).toBe(false);
    expect('pauseReflectionShareImage' in stepsIo).toBe(false);
    expect('buildReflectionShareTelegramUrl' in stepsIo).toBe(false);
  });

  it('share-io exports stay off reflect step RPC wrappers and step gates', () => {
    expect(pauseReflectionShareImage).not.toBe(pauseReflectFavoriteToggle);
    expect(buildReflectionShareText).not.toBe(pauseReflectNoteUpdate);
    expect(buildReflectionShareTelegramUrl).not.toBe(pauseReflectTagUpdate);
    expect(buildReflectionShareTweetUrl).not.toBe(pauseReflectionStepLogOnce);
    expect(buildReflectionShareWhatsAppUrl).not.toBe(shouldShowFavoriteProHint);
    expect(pauseReflectionShareImage).not.toBe(shouldLogPauseReflectionStep);
    expect(buildReflectionShareText).not.toBe(pauseReflectFavoriteToggleWithRepository);
    expect(pauseReflectionShareImage).not.toBe(pauseReflectionStepLogOnceWithRepository);
    expect(buildReflectionShareTelegramUrl).not.toBe(reflectPauseRepository);
  });

  it('steps-io exports stay off reflection share builders and PNG orchestration', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(pauseReflectionShareImage);
    expect(pauseReflectNoteUpdate).not.toBe(buildReflectionShareText);
    expect(pauseReflectTagUpdate).not.toBe(buildReflectionShareTelegramUrl);
    expect(pauseReflectionStepLogOnce).not.toBe(buildReflectionShareTweetUrl);
    expect(shouldShowFavoriteProHint).not.toBe(buildReflectionShareWhatsAppUrl);
    expect(shouldLogPauseReflectionStep).not.toBe(pauseReflectionShareImage);
    expect(pauseReflectFavoriteToggleWithRepository).not.toBe(buildReflectionShareText);
    expect(pauseReflectionStepLogOnceWithRepository).not.toBe(pauseReflectionShareImage);
    expect(reflectPauseRepository).not.toBe(pauseReflectionShareImage);
  });
});
