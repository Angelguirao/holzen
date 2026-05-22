import { describe, expect, it } from 'vitest';

import { getPendingPauseOfferDisplay as getDisplayDirect } from './pending-pause-offer-display';
import { getPendingPauseOfferDisplay } from './pause-pending-offer-display-flow';
import { getPendingPauseOfferDisplay as getDisplayFromPendingOfferFlow } from './pause-reflect-pending-offer-flow';
import {
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
} from './pause-reflect-pending-offer-rpc-flow';
import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from './pause-pending-offer-telemetry-flow';

describe('pause-pending-offer-display-flow', () => {
  it('re-exports pending pause offer display projection', () => {
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
    expect(getPendingPauseOfferDisplay).toBe(getDisplayDirect);
  });

  it('sibling cluster: display-flow binding matches pending-offer umbrella on display export only', () => {
    expect(getPendingPauseOfferDisplay).toBe(getDisplayFromPendingOfferFlow);
    expect(getPendingPauseOfferDisplay).not.toBe(runAdoptPendingPauseOffer);
    expect(getPendingPauseOfferDisplay).not.toBe(runDeclinePendingPauseOffer);
  });

  it('sibling cluster: display-flow export stays distinct from pending-offer telemetry trackers', () => {
    expect(getPendingPauseOfferDisplay).not.toBe(trackPausePendingAdopted);
    expect(getPendingPauseOfferDisplay).not.toBe(trackPausePendingDeclined);
    expect(getPendingPauseOfferDisplay).not.toBe(trackPauseSessionAbandoned);
    expect(trackPausePendingAdopted).not.toBe(trackPausePendingDeclined);
    expect(trackPausePendingDeclined).not.toBe(trackPauseSessionAbandoned);
  });
});
