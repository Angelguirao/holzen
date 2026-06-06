import { describe, expect, it } from 'vitest';

import {
  buildReflectionShareText,
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  runReflectionShareImage,
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap
} from '../share/pause-reflect-share-flow';
import {
  buildPauseScoreImpacts,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  runPauseOutcomeLog,
  showPauseOutcomeNotCompletedToast
} from './pause-reflect-flows-flow';
import * as flowsFlow from './pause-reflect-flows-flow';
import * as shareFlow from '../share/pause-reflect-share-flow';

describe('pause-reflect-flows-flow ↔ pause-reflect-share-flow sibling parity', () => {
  it('flows-flow and share-flow are distinct sibling CI anchors', () => {
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
    expect(typeof resolvePauseDecideOutcomeFlow).toBe('function');
    expect(typeof runPauseOutcomeLog).toBe('function');
    expect(typeof showPauseOutcomeNotCompletedToast).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');

    expect(typeof runReflectionShareImage).toBe('function');
    expect(typeof buildReflectionShareText).toBe('function');
    expect(typeof buildReflectionShareTelegramUrl).toBe('function');
    expect(typeof buildReflectionShareTweetUrl).toBe('function');
    expect(typeof buildReflectionShareWhatsAppUrl).toBe('function');
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect('runReflectionShareImage' in flowsFlow).toBe(false);
    expect('buildReflectionShareText' in flowsFlow).toBe(false);
    expect('trackPauseReflectShareTap' in flowsFlow).toBe(false);
    expect('resolvePauseSessionReflectAndDecidePreflight' in shareFlow).toBe(false);
    expect('resolvePauseSessionReflectAndDecideAfterGeneration' in shareFlow).toBe(false);
    expect('runPauseOutcomeLog' in shareFlow).toBe(false);
    expect('buildPauseScoreImpacts' in shareFlow).toBe(false);
  });

  it('flows umbrella exports stay off reflection share image/text/channel helpers', () => {
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(runReflectionShareImage);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(buildReflectionShareText);
    expect(runPauseOutcomeLog).not.toBe(buildReflectionShareTelegramUrl);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(buildReflectionShareWhatsAppUrl);
    expect(buildPauseScoreImpacts).not.toBe(trackPauseReflectShareTap);
    expect(showPauseOutcomeNotCompletedToast).not.toBe(trackPauseReflectWallpaperTap);
  });

  it('share umbrella exports stay off reflect+decide preflight and decide outcome helpers', () => {
    expect(runReflectionShareImage).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(buildReflectionShareText).not.toBe(runPauseOutcomeLog);
    expect(trackPauseReflectShareTap).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(trackPauseReflectWallpaperTap).not.toBe(buildPauseScoreImpacts);
    expect(trackPauseReflectPostItOpen).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(runReflectionShareImage).not.toBe(showPauseOutcomeNotCompletedToast);
  });
});
