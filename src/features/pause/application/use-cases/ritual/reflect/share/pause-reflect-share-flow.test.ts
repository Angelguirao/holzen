import { describe, expect, it } from 'vitest';

import { buildReflectionShareText } from '@/features/pause/domain/reflect/share/reflection-share-text';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
} from '@/features/pause/domain/reflect/share/reflection-share-channel-urls';

import {
  buildReflectionShareText as buildTextFromFlow,
  buildReflectionShareTelegramUrl as buildTelegramFromFlow,
  buildReflectionShareTweetUrl as buildTweetFromFlow,
  runReflectionShareImage,
  trackPauseReflectShareTap,
} from './pause-reflect-share-flow';
import { runReflectionShareImage as runShareImageDirect } from './run-reflection-share-image';
import { trackPauseReflectShareTap as trackShareTapDirect } from './pause-reflect-session-ui-telemetry';

describe('pause-reflect-share-flow', () => {
  it('re-exports share orchestration + domain builders + session UI telemetry from leaf modules', () => {
    expect(typeof runReflectionShareImage).toBe('function');
    expect(typeof buildTextFromFlow).toBe('function');
    expect(typeof buildTelegramFromFlow).toBe('function');
    expect(typeof buildTweetFromFlow).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');

    expect(runReflectionShareImage).toBe(runShareImageDirect);
    expect(buildTextFromFlow).toBe(buildReflectionShareText);
    expect(buildTelegramFromFlow).toBe(buildReflectionShareTelegramUrl);
    expect(buildTweetFromFlow).toBe(buildReflectionShareTweetUrl);
    expect(trackPauseReflectShareTap).toBe(trackShareTapDirect);
  });
});
