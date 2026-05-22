import { describe, expect, it } from 'vitest';

import {
  buildReflectionShareText,
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  runReflectionShareImage,
  trackPauseReflectShareTap,
} from './pause-reflect-share-flow';

describe('pause-reflect-share-flow', () => {
  it('re-exports share orchestration + domain builders + session UI telemetry', () => {
    expect(typeof runReflectionShareImage).toBe('function');
    expect(typeof buildReflectionShareText).toBe('function');
    expect(typeof buildReflectionShareTelegramUrl).toBe('function');
    expect(typeof buildReflectionShareTweetUrl).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
  });
});
