import { describe, expect, it } from 'vitest';
import {
  getHomeHasAccess,
  getHomeShowLimitUpsell,
  getHomeShowPauseScheduling,
  getHomeSubscriptionGate,
  getHomeSubscriptionReady,
} from '@/lib/home-subscription-gate';

describe('getHomeSubscriptionReady', () => {
  it('is false while subscription is loading', () => {
    expect(getHomeSubscriptionReady(true)).toBe(false);
  });

  it('is true when subscription finished loading', () => {
    expect(getHomeSubscriptionReady(false)).toBe(true);
  });
});

describe('getHomeHasAccess', () => {
  it('is true when subscribed (including trialing)', () => {
    expect(getHomeHasAccess(true)).toBe(true);
  });

  it('is false when not subscribed', () => {
    expect(getHomeHasAccess(false)).toBe(false);
  });
});

describe('getHomeShowLimitUpsell', () => {
  it('is true when ready and not subscribed', () => {
    expect(getHomeShowLimitUpsell(true, false)).toBe(true);
    expect(getHomeShowLimitUpsell(true, true)).toBe(false);
    expect(getHomeShowLimitUpsell(false, false)).toBe(false);
  });
});

describe('getHomeShowPauseScheduling', () => {
  it('requires ready, access, no open pause, and not loading', () => {
    expect(getHomeShowPauseScheduling(true, true, false, false)).toBe(true);
    expect(getHomeShowPauseScheduling(true, true, true, false)).toBe(false);
    expect(getHomeShowPauseScheduling(true, true, false, true)).toBe(false);
    expect(getHomeShowPauseScheduling(true, false, false, false)).toBe(false);
  });
});

describe('getHomeSubscriptionGate', () => {
  it('bundles flags consistently', () => {
    const g = getHomeSubscriptionGate({
      subLoading: false,
      subscribed: false,
      hasOpenPause: false,
      loading: false,
    });
    expect(g.subscriptionReady).toBe(true);
    expect(g.hasAccess).toBe(false);
    expect(g.showLimitUpsell).toBe(true);
    expect(g.showPauseScheduling).toBe(false);
  });
});
