import { describe, expect, it } from 'vitest';

import {
  getPendingPauseOfferDisplay,
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from './pause-reflect-pending-offer-flow';
import * as pendingOfferFlow from './pause-reflect-pending-offer-flow';
import { getPendingPauseOfferDisplay as getDisplayFromDisplayFlow } from './pause-pending-offer-display-flow';
import * as pendingOfferDisplayFlow from './pause-pending-offer-display-flow';
import {
  runAdoptPendingPauseOffer as runAdoptFromRpcFlow,
  runDeclinePendingPauseOffer as runDeclineFromRpcFlow,
} from './pause-reflect-pending-offer-rpc-flow';

/**
 * Application sibling parity: presentation umbrella vs display-only subcluster anchor.
 */
describe('pause-reflect-pending-offer-flow ↔ pause-pending-offer-display-flow sibling parity', () => {
  it('pending-offer-flow and pending-offer-display-flow are distinct sibling CI anchors', () => {
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
    expect(typeof runAdoptPendingPauseOffer).toBe('function');
    expect(typeof runDeclinePendingPauseOffer).toBe('function');
    expect(typeof trackPausePendingAdopted).toBe('function');
    expect(typeof trackPausePendingDeclined).toBe('function');
    expect(typeof trackPauseSessionAbandoned).toBe('function');

    expect('getPendingPauseOfferDisplay' in pendingOfferDisplayFlow).toBe(true);
    expect('runAdoptPendingPauseOffer' in pendingOfferDisplayFlow).toBe(false);
    expect('runDeclinePendingPauseOffer' in pendingOfferDisplayFlow).toBe(false);
    expect('trackPausePendingAdopted' in pendingOfferDisplayFlow).toBe(false);
    expect('trackPausePendingDeclined' in pendingOfferDisplayFlow).toBe(false);
    expect('trackPauseSessionAbandoned' in pendingOfferDisplayFlow).toBe(false);

    expect('runAdoptPendingPauseOffer' in pendingOfferFlow).toBe(true);
    expect('runDeclinePendingPauseOffer' in pendingOfferFlow).toBe(true);
    expect('getPendingPauseOfferDisplay' in pendingOfferFlow).toBe(true);
    expect('trackPausePendingAdopted' in pendingOfferFlow).toBe(true);
    expect('trackPausePendingDeclined' in pendingOfferFlow).toBe(true);
    expect('trackPauseSessionAbandoned' in pendingOfferFlow).toBe(true);
  });

  it('pending-offer-flow shares display projection with display-flow subcluster', () => {
    expect(getPendingPauseOfferDisplay).toBe(getDisplayFromDisplayFlow);
    expect(getDisplayFromDisplayFlow).not.toBe(runAdoptFromRpcFlow);
    expect(getDisplayFromDisplayFlow).not.toBe(runDeclineFromRpcFlow);
  });

  it('pending-offer-flow umbrella re-exports RPC + telemetry, not display-flow-only surface', () => {
    expect(runAdoptPendingPauseOffer).not.toBe(getDisplayFromDisplayFlow);
    expect(runDeclinePendingPauseOffer).not.toBe(getDisplayFromDisplayFlow);
    expect(trackPausePendingAdopted).not.toBe(getDisplayFromDisplayFlow);
    expect(trackPausePendingDeclined).not.toBe(getDisplayFromDisplayFlow);
    expect(trackPauseSessionAbandoned).not.toBe(getDisplayFromDisplayFlow);
  });

  it('display-flow subcluster stays off adopt/decline RPC and PostHog trackers', () => {
    expect(getDisplayFromDisplayFlow).not.toBe(runAdoptFromRpcFlow);
    expect(getDisplayFromDisplayFlow).not.toBe(runDeclineFromRpcFlow);
    expect(getDisplayFromDisplayFlow).not.toBe(trackPausePendingAdopted);
    expect(getDisplayFromDisplayFlow).not.toBe(trackPausePendingDeclined);
    expect(getDisplayFromDisplayFlow).not.toBe(trackPauseSessionAbandoned);
  });
});
