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
import {
  runAdoptPendingPauseOffer as runAdoptFromRpcFlow,
  runDeclinePendingPauseOffer as runDeclineFromRpcFlow,
} from './pause-reflect-pending-offer-rpc-flow';
import * as pendingOfferRpcFlow from './pause-reflect-pending-offer-rpc-flow';

/**
 * Application sibling parity: presentation umbrella vs RPC-only subcluster anchor.
 */
describe('pause-reflect-pending-offer-flow ↔ pause-reflect-pending-offer-rpc-flow sibling parity', () => {
  it('pending-offer-flow and pending-offer-rpc-flow are distinct sibling CI anchors', () => {
    expect(typeof runAdoptPendingPauseOffer).toBe('function');
    expect(typeof runDeclinePendingPauseOffer).toBe('function');
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
    expect(typeof trackPausePendingAdopted).toBe('function');
    expect(typeof trackPausePendingDeclined).toBe('function');
    expect(typeof trackPauseSessionAbandoned).toBe('function');

    expect('runAdoptPendingPauseOffer' in pendingOfferFlow).toBe(true);
    expect('runDeclinePendingPauseOffer' in pendingOfferFlow).toBe(true);
    expect('getPendingPauseOfferDisplay' in pendingOfferFlow).toBe(true);
    expect('trackPausePendingAdopted' in pendingOfferFlow).toBe(true);
    expect('trackPausePendingDeclined' in pendingOfferFlow).toBe(true);
    expect('trackPauseSessionAbandoned' in pendingOfferFlow).toBe(true);

    expect('runAdoptPendingPauseOffer' in pendingOfferRpcFlow).toBe(true);
    expect('runDeclinePendingPauseOffer' in pendingOfferRpcFlow).toBe(true);
    expect('getPendingPauseOfferDisplay' in pendingOfferRpcFlow).toBe(false);
    expect('trackPausePendingAdopted' in pendingOfferRpcFlow).toBe(false);
    expect('trackPausePendingDeclined' in pendingOfferRpcFlow).toBe(false);
    expect('trackPauseSessionAbandoned' in pendingOfferRpcFlow).toBe(false);
  });

  it('pending-offer-flow shares adopt/decline RPC bindings with rpc-flow subcluster', () => {
    expect(runAdoptPendingPauseOffer).toBe(runAdoptFromRpcFlow);
    expect(runDeclinePendingPauseOffer).toBe(runDeclineFromRpcFlow);
    expect(runAdoptPendingPauseOffer).not.toBe(runDeclineFromRpcFlow);
    expect(runDeclinePendingPauseOffer).not.toBe(runAdoptFromRpcFlow);
  });

  it('pending-offer-flow umbrella re-exports display + telemetry, not rpc-flow-only surface', () => {
    expect(getPendingPauseOfferDisplay).not.toBe(runAdoptFromRpcFlow);
    expect(getPendingPauseOfferDisplay).not.toBe(runDeclineFromRpcFlow);
    expect(trackPausePendingAdopted).not.toBe(runAdoptFromRpcFlow);
    expect(trackPausePendingDeclined).not.toBe(runDeclineFromRpcFlow);
    expect(trackPauseSessionAbandoned).not.toBe(runAdoptFromRpcFlow);
    expect(trackPauseSessionAbandoned).not.toBe(runDeclineFromRpcFlow);
  });

  it('rpc-flow subcluster stays off display projection and PostHog trackers', () => {
    expect(runAdoptFromRpcFlow).not.toBe(getPendingPauseOfferDisplay);
    expect(runDeclineFromRpcFlow).not.toBe(getPendingPauseOfferDisplay);
    expect(runAdoptFromRpcFlow).not.toBe(trackPausePendingAdopted);
    expect(runDeclineFromRpcFlow).not.toBe(trackPausePendingDeclined);
    expect(runAdoptFromRpcFlow).not.toBe(trackPauseSessionAbandoned);
    expect(runDeclineFromRpcFlow).not.toBe(trackPauseSessionAbandoned);
  });
});
