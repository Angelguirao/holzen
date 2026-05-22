import { describe, expect, it } from 'vitest';

import {
  getPendingPauseOfferDisplay,
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
  trackPausePendingAdopted,
  trackPauseSessionAbandoned,
} from './pause-reflect-pending-offer-flow';

describe('pause-reflect-pending-offer-flow', () => {
  it('re-exports pending-offer RPC use cases, display projection, and telemetry trackers', () => {
    expect(typeof runAdoptPendingPauseOffer).toBe('function');
    expect(typeof runDeclinePendingPauseOffer).toBe('function');
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
    expect(typeof trackPausePendingAdopted).toBe('function');
    expect(typeof trackPauseSessionAbandoned).toBe('function');
  });
});
