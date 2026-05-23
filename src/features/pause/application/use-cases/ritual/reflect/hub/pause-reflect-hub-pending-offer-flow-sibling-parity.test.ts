import { describe, expect, it } from 'vitest';

import {
  buildShiftEmotionFrameHubLogBundle,
  resolveShiftFrameHubDonePresentation,
  runShiftEmotionFrameHubDone,
} from './pause-reflect-hub-flow';
import {
  getPendingPauseOfferDisplay,
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from '../pending-offer/pause-reflect-pending-offer-flow';
import * as hubFlow from './pause-reflect-hub-flow';
import * as pendingOfferFlow from '../pending-offer/pause-reflect-pending-offer-flow';

describe('pause-reflect-hub-flow ↔ pause-reflect-pending-offer-flow sibling parity', () => {
  it('hub-flow and pending-offer-flow are distinct sibling CI anchors', () => {
    expect(typeof runShiftEmotionFrameHubDone).toBe('function');
    expect(typeof buildShiftEmotionFrameHubLogBundle).toBe('function');
    expect(typeof resolveShiftFrameHubDonePresentation).toBe('function');
    expect(typeof runAdoptPendingPauseOffer).toBe('function');
    expect(typeof runDeclinePendingPauseOffer).toBe('function');
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
    expect(typeof trackPausePendingAdopted).toBe('function');
    expect(typeof trackPausePendingDeclined).toBe('function');
    expect(typeof trackPauseSessionAbandoned).toBe('function');

    expect('runAdoptPendingPauseOffer' in hubFlow).toBe(false);
    expect('runDeclinePendingPauseOffer' in hubFlow).toBe(false);
    expect('getPendingPauseOfferDisplay' in hubFlow).toBe(false);
    expect('trackPausePendingAdopted' in hubFlow).toBe(false);
    expect('trackPausePendingDeclined' in hubFlow).toBe(false);
    expect('trackPauseSessionAbandoned' in hubFlow).toBe(false);
    expect('runShiftEmotionFrameHubDone' in pendingOfferFlow).toBe(false);
    expect('buildShiftEmotionFrameHubLogBundle' in pendingOfferFlow).toBe(false);
    expect('resolveShiftFrameHubDonePresentation' in pendingOfferFlow).toBe(false);
  });

  it('hub umbrella exports stay off pending-offer RPC, display, and telemetry', () => {
    expect(runShiftEmotionFrameHubDone).not.toBe(runAdoptPendingPauseOffer);
    expect(runShiftEmotionFrameHubDone).not.toBe(runDeclinePendingPauseOffer);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(getPendingPauseOfferDisplay);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(trackPausePendingAdopted);
    expect(resolveShiftFrameHubDonePresentation).not.toBe(trackPausePendingDeclined);
    expect(resolveShiftFrameHubDonePresentation).not.toBe(trackPauseSessionAbandoned);
  });

  it('pending-offer umbrella exports stay off shift-frame hub done RPC and log bundle', () => {
    expect(runAdoptPendingPauseOffer).not.toBe(runShiftEmotionFrameHubDone);
    expect(runDeclinePendingPauseOffer).not.toBe(runShiftEmotionFrameHubDone);
    expect(getPendingPauseOfferDisplay).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(trackPausePendingAdopted).not.toBe(runShiftEmotionFrameHubDone);
    expect(trackPausePendingDeclined).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(trackPauseSessionAbandoned).not.toBe(resolveShiftFrameHubDonePresentation);
  });
});
