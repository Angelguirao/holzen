import { describe, expect, it } from 'vitest';

import { getPendingPauseOfferDisplay } from './pending-pause-offer-display';
import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
} from '../telemetry/pending-pause-offer-telemetry';
import { trackPauseSessionAbandoned } from '../telemetry/pause-session-abandoned-telemetry';
import {
  getPendingPauseOfferDisplay as getDisplayFromFlow,
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
  trackPausePendingAdopted as trackAdoptedFromFlow,
  trackPausePendingDeclined as trackDeclinedFromFlow,
  trackPauseSessionAbandoned as trackAbandonedFromFlow,
} from './pause-reflect-pending-offer-flow';
import { runAdoptPendingPauseOffer as runAdoptDirect } from './run-adopt-pending-pause-offer';
import { runDeclinePendingPauseOffer as runDeclineDirect } from './run-decline-pending-pause-offer';

describe('pause-reflect-pending-offer-flow', () => {
  it('re-exports pending-offer RPC use cases, display projection, and telemetry trackers from leaf modules', () => {
    expect(typeof runAdoptPendingPauseOffer).toBe('function');
    expect(typeof runDeclinePendingPauseOffer).toBe('function');
    expect(typeof getDisplayFromFlow).toBe('function');
    expect(typeof trackAdoptedFromFlow).toBe('function');
    expect(typeof trackDeclinedFromFlow).toBe('function');
    expect(typeof trackAbandonedFromFlow).toBe('function');

    expect(runAdoptPendingPauseOffer).toBe(runAdoptDirect);
    expect(runDeclinePendingPauseOffer).toBe(runDeclineDirect);
    expect(getDisplayFromFlow).toBe(getPendingPauseOfferDisplay);
    expect(trackAdoptedFromFlow).toBe(trackPausePendingAdopted);
    expect(trackDeclinedFromFlow).toBe(trackPausePendingDeclined);
    expect(trackAbandonedFromFlow).toBe(trackPauseSessionAbandoned);
  });
});
