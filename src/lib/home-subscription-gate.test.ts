import { describe, expect, it } from 'vitest';
import {
  getHomeHasAccess,
  getHomeShowLimitUpsell,
  getHomeShowPauseScheduling,
  getHomeSubscriptionGate,
  getHomeSubscriptionReady,
} from '@/features/subscription/application/home-gate';

describe('getHomeSubscriptionReady', () => {
  it('is false while subscription is loading', () => {
    expect(getHomeSubscriptionReady(true)).toBe(false);
  });

  it('is true when subscription finished loading', () => {
    expect(getHomeSubscriptionReady(false)).toBe(true);
  });
});

describe('getHomeHasAccess', () => {
  it('is true when trialing or active', () => {
    expect(getHomeHasAccess('trialing')).toBe(true);
    expect(getHomeHasAccess('active')).toBe(true);
  });

  it('is false when lapsed or pre_trial', () => {
    expect(getHomeHasAccess('lapsed')).toBe(false);
    expect(getHomeHasAccess('pre_trial')).toBe(false);
  });
});

describe('getHomeShowLimitUpsell', () => {
  it('is true when ready and cannot engage pause', () => {
    expect(getHomeShowLimitUpsell(true, 'lapsed')).toBe(true);
    expect(getHomeShowLimitUpsell(true, 'trialing')).toBe(false);
    expect(getHomeShowLimitUpsell(false, 'lapsed')).toBe(false);
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
  it('bundles flags consistently for lapsed', () => {
    const g = getHomeSubscriptionGate({
      subLoading: false,
      entitlement: 'lapsed',
      hasOpenPause: false,
      loading: false,
    });
    expect(g.subscriptionReady).toBe(true);
    expect(g.hasAccess).toBe(false);
    expect(g.showLimitUpsell).toBe(true);
    expect(g.showPauseScheduling).toBe(false);
  });
});
