import { describe, expect, it } from 'vitest';

import {
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
} from './pause-reflect-pending-offer-rpc-flow';

describe('pause-reflect-pending-offer-rpc-flow', () => {
  it('re-exports adopt and decline pending-offer RPC use cases', () => {
    expect(typeof runAdoptPendingPauseOffer).toBe('function');
    expect(typeof runDeclinePendingPauseOffer).toBe('function');
  });
});
