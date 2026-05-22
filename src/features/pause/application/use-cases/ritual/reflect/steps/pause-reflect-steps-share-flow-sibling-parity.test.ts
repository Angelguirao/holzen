import { describe, expect, it } from 'vitest';

import {
  buildReflectionShareText,
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  runReflectionShareImage,
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '../share/pause-reflect-share-flow';
import {
  runPauseFavoriteToggle,
  runPauseReflectNoteUpdate,
  runPauseReflectTagUpdate,
  runPauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from './pause-reflect-steps-flow';
import * as shareFlow from '../share/pause-reflect-share-flow';
import * as stepsFlow from './pause-reflect-steps-flow';

describe('pause-reflect-steps-flow ↔ pause-reflect-share-flow sibling parity', () => {
  it('steps-flow and share-flow are distinct sibling CI anchors', () => {
    expect(typeof runPauseFavoriteToggle).toBe('function');
    expect(typeof runPauseReflectNoteUpdate).toBe('function');
    expect(typeof runPauseReflectTagUpdate).toBe('function');
    expect(typeof runPauseReflectionStepLogOnce).toBe('function');
    expect(typeof shouldShowFavoriteProHint).toBe('function');
    expect(typeof shouldLogPauseReflectionStep).toBe('function');

    expect(typeof runReflectionShareImage).toBe('function');
    expect(typeof buildReflectionShareText).toBe('function');
    expect(typeof buildReflectionShareTelegramUrl).toBe('function');
    expect(typeof buildReflectionShareTweetUrl).toBe('function');
    expect(typeof buildReflectionShareWhatsAppUrl).toBe('function');
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect('runReflectionShareImage' in stepsFlow).toBe(false);
    expect('buildReflectionShareText' in stepsFlow).toBe(false);
    expect('buildReflectionShareTelegramUrl' in stepsFlow).toBe(false);
    expect('trackPauseReflectPostItOpen' in stepsFlow).toBe(false);
    expect('trackPauseReflectShareTap' in stepsFlow).toBe(false);
    expect('trackPauseReflectWallpaperTap' in stepsFlow).toBe(false);
    expect('runPauseFavoriteToggle' in shareFlow).toBe(false);
    expect('runPauseReflectNoteUpdate' in shareFlow).toBe(false);
    expect('runPauseReflectTagUpdate' in shareFlow).toBe(false);
    expect('runPauseReflectionStepLogOnce' in shareFlow).toBe(false);
    expect('shouldShowFavoriteProHint' in shareFlow).toBe(false);
    expect('shouldLogPauseReflectionStep' in shareFlow).toBe(false);
    expect('runReflectionShareImage' in shareFlow).toBe(true);
    expect('buildReflectionShareText' in shareFlow).toBe(true);
  });

  it('steps umbrella exports stay off share image, channel builders, and session UI telemetry', () => {
    expect(runPauseFavoriteToggle).not.toBe(runReflectionShareImage);
    expect(runPauseReflectNoteUpdate).not.toBe(buildReflectionShareText);
    expect(runPauseReflectTagUpdate).not.toBe(buildReflectionShareTelegramUrl);
    expect(runPauseReflectionStepLogOnce).not.toBe(buildReflectionShareTweetUrl);
    expect(shouldShowFavoriteProHint).not.toBe(buildReflectionShareWhatsAppUrl);
    expect(shouldLogPauseReflectionStep).not.toBe(trackPauseReflectPostItOpen);
    expect(runPauseFavoriteToggle).not.toBe(trackPauseReflectShareTap);
    expect(runPauseReflectNoteUpdate).not.toBe(trackPauseReflectWallpaperTap);
    expect(runPauseReflectTagUpdate).not.toBe(runReflectionShareImage);
  });

  it('share umbrella exports stay off reflect step mutations and step gates', () => {
    expect(runReflectionShareImage).not.toBe(runPauseFavoriteToggle);
    expect(buildReflectionShareText).not.toBe(runPauseReflectNoteUpdate);
    expect(buildReflectionShareTelegramUrl).not.toBe(runPauseReflectTagUpdate);
    expect(buildReflectionShareTweetUrl).not.toBe(runPauseReflectionStepLogOnce);
    expect(buildReflectionShareWhatsAppUrl).not.toBe(shouldShowFavoriteProHint);
    expect(trackPauseReflectPostItOpen).not.toBe(shouldLogPauseReflectionStep);
    expect(trackPauseReflectShareTap).not.toBe(runPauseFavoriteToggle);
    expect(trackPauseReflectWallpaperTap).not.toBe(runPauseReflectNoteUpdate);
    expect(runReflectionShareImage).not.toBe(runPauseReflectTagUpdate);
  });
});
