import { describe, expect, it } from 'vitest';

import { getPendingPauseOfferDisplay } from './pause-pending-offer-display-flow';
import * as pendingOfferDisplayFlow from './pause-pending-offer-display-flow';
import {
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
} from './pause-reflect-pending-offer-rpc-flow';
import * as pendingOfferRpcFlow from './pause-reflect-pending-offer-rpc-flow';

/**
 * Application sibling parity: rpc-flow vs display-flow (rpc-anchored; complements
 * `pause-reflect-pending-offer-flow-display-flow-sibling-parity.test.ts` ↔ umbrella).
 */
describe('pause-reflect-pending-offer-rpc-flow ↔ pause-pending-offer-display-flow sibling parity', () => {
  it('rpc-flow and display-flow are distinct sibling CI anchors', () => {
    expect(typeof runAdoptPendingPauseOffer).toBe('function');
    expect(typeof runDeclinePendingPauseOffer).toBe('function');
    expect(typeof getPendingPauseOfferDisplay).toBe('function');

    expect('runAdoptPendingPauseOffer' in pendingOfferDisplayFlow).toBe(false);
    expect('runDeclinePendingPauseOffer' in pendingOfferDisplayFlow).toBe(false);

    expect('getPendingPauseOfferDisplay' in pendingOfferRpcFlow).toBe(false);
  });

  it('rpc-flow adopt/decline exports stay off display projection', () => {
    expect(runAdoptPendingPauseOffer).not.toBe(getPendingPauseOfferDisplay);
    expect(runDeclinePendingPauseOffer).not.toBe(getPendingPauseOfferDisplay);
    expect(runAdoptPendingPauseOffer).not.toBe(runDeclinePendingPauseOffer);
  });

  it('display-flow export stays off adopt/decline RPC use cases', () => {
    expect(getPendingPauseOfferDisplay).not.toBe(runAdoptPendingPauseOffer);
    expect(getPendingPauseOfferDisplay).not.toBe(runDeclinePendingPauseOffer);
  });
});
