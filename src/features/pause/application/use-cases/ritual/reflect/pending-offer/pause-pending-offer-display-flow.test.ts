import { describe, expect, it } from 'vitest';

import { getPendingPauseOfferDisplay } from './pause-pending-offer-display-flow';

describe('pause-pending-offer-display-flow', () => {
  it('re-exports pending pause offer display projection', () => {
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
  });
});
