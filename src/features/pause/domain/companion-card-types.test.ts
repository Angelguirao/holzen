import { describe, expect, it } from 'vitest';
import { normalizeCompanionData } from './companion-card-types';

describe('normalizeCompanionData', () => {
  it('keeps haiku and drops legacy grounding session fields', () => {
    expect(
      normalizeCompanionData({
        haiku: 'line',
        groundingTitle: 'legacy',
        groundingBody: 'legacy body',
      }),
    ).toEqual({ haiku: 'line' });
  });
});
