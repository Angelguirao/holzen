import { describe, expect, it } from 'vitest';

import {
  getPendingPauseOfferDisplay,
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from '../pending-offer/pause-reflect-pending-offer-flow';
import {
  buildReflectionShareText,
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  runReflectionShareImage,
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from './pause-reflect-share-flow';
import * as pendingOfferFlow from '../pending-offer/pause-reflect-pending-offer-flow';
import * as shareFlow from './pause-reflect-share-flow';

describe('pause-reflect-share-flow ↔ pause-reflect-pending-offer-flow sibling parity', () => {
  it('share-flow and pending-offer-flow are distinct sibling CI anchors', () => {
    expect(typeof runReflectionShareImage).toBe('function');
    expect(typeof buildReflectionShareText).toBe('function');
    expect(typeof buildReflectionShareTelegramUrl).toBe('function');
    expect(typeof buildReflectionShareTweetUrl).toBe('function');
    expect(typeof buildReflectionShareWhatsAppUrl).toBe('function');
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect(typeof runAdoptPendingPauseOffer).toBe('function');
    expect(typeof runDeclinePendingPauseOffer).toBe('function');
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
    expect(typeof trackPausePendingAdopted).toBe('function');
    expect(typeof trackPausePendingDeclined).toBe('function');
    expect(typeof trackPauseSessionAbandoned).toBe('function');

    expect('runAdoptPendingPauseOffer' in shareFlow).toBe(false);
    expect('runDeclinePendingPauseOffer' in shareFlow).toBe(false);
    expect('getPendingPauseOfferDisplay' in shareFlow).toBe(false);
    expect('trackPausePendingAdopted' in shareFlow).toBe(false);
    expect('trackPausePendingDeclined' in shareFlow).toBe(false);
    expect('trackPauseSessionAbandoned' in shareFlow).toBe(false);
    expect('runReflectionShareImage' in pendingOfferFlow).toBe(false);
    expect('buildReflectionShareText' in pendingOfferFlow).toBe(false);
    expect('trackPauseReflectPostItOpen' in pendingOfferFlow).toBe(false);
  });

  it('share orchestration exports stay off pending-offer RPC, display, and telemetry', () => {
    expect(runReflectionShareImage).not.toBe(runAdoptPendingPauseOffer);
    expect(runReflectionShareImage).not.toBe(runDeclinePendingPauseOffer);
    expect(buildReflectionShareText).not.toBe(getPendingPauseOfferDisplay);
    expect(buildReflectionShareTelegramUrl).not.toBe(trackPausePendingAdopted);
    expect(buildReflectionShareTweetUrl).not.toBe(trackPausePendingDeclined);
    expect(buildReflectionShareWhatsAppUrl).not.toBe(trackPauseSessionAbandoned);
    expect(trackPauseReflectPostItOpen).not.toBe(runAdoptPendingPauseOffer);
    expect(trackPauseReflectShareTap).not.toBe(trackPausePendingAdopted);
  });

  it('pending-offer umbrella exports stay off share image, channel builders, and session UI telemetry', () => {
    expect(runAdoptPendingPauseOffer).not.toBe(runReflectionShareImage);
    expect(runDeclinePendingPauseOffer).not.toBe(runReflectionShareImage);
    expect(getPendingPauseOfferDisplay).not.toBe(buildReflectionShareText);
    expect(trackPausePendingAdopted).not.toBe(buildReflectionShareTelegramUrl);
    expect(trackPausePendingDeclined).not.toBe(buildReflectionShareTweetUrl);
    expect(trackPauseSessionAbandoned).not.toBe(buildReflectionShareWhatsAppUrl);
    expect(runAdoptPendingPauseOffer).not.toBe(trackPauseReflectPostItOpen);
    expect(trackPausePendingAdopted).not.toBe(trackPauseReflectShareTap);
  });
});
