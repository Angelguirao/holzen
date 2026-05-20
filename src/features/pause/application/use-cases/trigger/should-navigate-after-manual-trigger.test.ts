import { describe, expect, it } from 'vitest';
import { shouldNavigateAfterManualTrigger } from './should-navigate-after-manual-trigger';

describe('shouldNavigateAfterManualTrigger', () => {
  it('returns true when opened with instance and no pending offer', () => {
    expect(
      shouldNavigateAfterManualTrigger({
        opened: true,
        instanceId: 'id-1',
        context: 'manual',
        pendingOffer: false,
      }),
    ).toBe(true);
  });

  it('returns false for pending offer or missing instance', () => {
    expect(
      shouldNavigateAfterManualTrigger({
        opened: true,
        instanceId: 'id-1',
        context: null,
        pendingOffer: true,
      }),
    ).toBe(false);
    expect(
      shouldNavigateAfterManualTrigger({
        opened: true,
        instanceId: null,
        context: null,
      }),
    ).toBe(false);
    expect(
      shouldNavigateAfterManualTrigger({
        opened: false,
        instanceId: 'id-1',
        context: null,
      }),
    ).toBe(false);
  });
});
