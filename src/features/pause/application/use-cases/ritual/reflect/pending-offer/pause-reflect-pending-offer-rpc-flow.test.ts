import { describe, expect, it } from 'vitest';

import { runAdoptPendingPauseOffer as runAdoptDirect } from './run-adopt-pending-pause-offer';
import { runDeclinePendingPauseOffer as runDeclineDirect } from './run-decline-pending-pause-offer';
import {
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
} from './pause-reflect-pending-offer-rpc-flow';

describe('pause-reflect-pending-offer-rpc-flow', () => {
  it('re-exports adopt and decline pending-offer RPC use cases', () => {
    expect(typeof runAdoptPendingPauseOffer).toBe('function');
    expect(typeof runDeclinePendingPauseOffer).toBe('function');

    expect(runAdoptPendingPauseOffer).toBe(runAdoptDirect);
    expect(runDeclinePendingPauseOffer).toBe(runDeclineDirect);
  });
});
