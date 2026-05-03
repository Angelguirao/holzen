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
    expect(getHomeSubscriptionReady(true, false, undefined)).toBe(false);
  });

  it('is true when subscribed even if remaining is undefined', () => {
    expect(getHomeSubscriptionReady(false, true, undefined)).toBe(true);
  });

  it('is true when not subscribed but monthly remaining is known', () => {
    expect(getHomeSubscriptionReady(false, false, 3)).toBe(true);
  });
});

describe('getHomeHasAccess', () => {
  it('is true when subscribed', () => {
    expect(getHomeHasAccess(true, 0)).toBe(true);
  });

  it('is true when free tier has remaining', () => {
    expect(getHomeHasAccess(false, 2)).toBe(true);
  });

  it('is false when not subscribed and no remaining', () => {
    expect(getHomeHasAccess(false, 0)).toBe(false);
    expect(getHomeHasAccess(false, undefined)).toBe(false);
  });
});

describe('getHomeShowLimitUpsell', () => {
  it('is true only when ready, not subscribed, and remaining is exactly zero', () => {
    expect(getHomeShowLimitUpsell(true, false, 0)).toBe(true);
    expect(getHomeShowLimitUpsell(true, false, undefined)).toBe(false);
    expect(getHomeShowLimitUpsell(true, true, 0)).toBe(false);
    expect(getHomeShowLimitUpsell(false, false, 0)).toBe(false);
  });
});

describe('getHomeShowPauseScheduling', () => {
  it('requires ready, access, no message, and not loading', () => {
    expect(getHomeShowPauseScheduling(true, true, null, false)).toBe(true);
    expect(getHomeShowPauseScheduling(true, true, 'hi', false)).toBe(false);
    expect(getHomeShowPauseScheduling(true, true, null, true)).toBe(false);
    expect(getHomeShowPauseScheduling(true, false, null, false)).toBe(false);
  });
});

describe('getHomeSubscriptionGate', () => {
  it('bundles flags consistently', () => {
    const g = getHomeSubscriptionGate({
      subLoading: false,
      subscribed: false,
      monthlyRemaining: 0,
      message: null,
      loading: false,
    });
    expect(g.subscriptionReady).toBe(true);
    expect(g.hasAccess).toBe(false);
    expect(g.showLimitUpsell).toBe(true);
    expect(g.showPauseScheduling).toBe(false);
  });
});
