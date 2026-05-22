import { describe, expect, it } from 'vitest';

import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  runReflectionShareImage,
} from './pause-reflect-share-orchestration-flow';

describe('pause-reflect-share-orchestration-flow', () => {
  it('re-exports share orchestration leaf modules and domain builders', () => {
    expect(typeof runReflectionShareImage).toBe('function');
    expect(typeof buildReflectionShareText).toBe('function');
    expect(typeof buildReflectionShareTelegramUrl).toBe('function');
    expect(typeof buildReflectionShareTweetUrl).toBe('function');
  });
});
