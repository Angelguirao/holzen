import { describe, expect, it } from 'vitest';

import { runAdoptPendingPauseOffer as runAdoptDirect } from './run-adopt-pending-pause-offer';
import { runDeclinePendingPauseOffer as runDeclineDirect } from './run-decline-pending-pause-offer';
import {
  getPendingPauseOfferDisplay,
  runAdoptPendingPauseOffer as runAdoptFromPresentationFlow,
  runDeclinePendingPauseOffer as runDeclineFromPresentationFlow,
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from './pause-reflect-pending-offer-flow';
import {
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
} from './pause-reflect-pending-offer-rpc-flow';
import * as pendingOfferRpcFlow from './pause-reflect-pending-offer-rpc-flow';

describe('pause-reflect-pending-offer-rpc-flow', () => {
  it('re-exports adopt and decline pending-offer RPC use cases', () => {
    expect(typeof runAdoptPendingPauseOffer).toBe('function');
    expect(typeof runDeclinePendingPauseOffer).toBe('function');

    expect(runAdoptPendingPauseOffer).toBe(runAdoptDirect);
    expect(runDeclinePendingPauseOffer).toBe(runDeclineDirect);
  });

  it('sibling cluster: rpc-flow exports stay distinct from pending-offer presentation umbrella', () => {
    expect(runAdoptPendingPauseOffer).toBe(runAdoptFromPresentationFlow);
    expect(runDeclinePendingPauseOffer).toBe(runDeclineFromPresentationFlow);
    expect('getPendingPauseOfferDisplay' in pendingOfferRpcFlow).toBe(false);
    expect('trackPausePendingAdopted' in pendingOfferRpcFlow).toBe(false);
    expect('trackPausePendingDeclined' in pendingOfferRpcFlow).toBe(false);
    expect('trackPauseSessionAbandoned' in pendingOfferRpcFlow).toBe(false);
    expect(runAdoptPendingPauseOffer).not.toBe(getPendingPauseOfferDisplay);
    expect(runDeclinePendingPauseOffer).not.toBe(trackPausePendingAdopted);
    expect(runAdoptPendingPauseOffer).not.toBe(trackPauseSessionAbandoned);
  });
});
