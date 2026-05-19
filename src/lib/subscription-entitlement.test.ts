import { describe, expect, it } from 'vitest';
import {
  canEngagePauseFromEntitlement,
  deriveEntitlement,
} from '@/features/subscription/domain/entitlement';

describe('deriveEntitlement', () => {
  it('maps trialing and active when subscribed', () => {
    expect(deriveEntitlement({ subscribed: true, subscriptionStatus: 'trialing' })).toBe('trialing');
    expect(deriveEntitlement({ subscribed: true, subscriptionStatus: 'active' })).toBe('active');
  });

  it('maps lapsed when not subscribed but status is lapsed', () => {
    expect(deriveEntitlement({ subscribed: false, subscriptionStatus: 'lapsed' })).toBe('lapsed');
  });

  it('maps pre_trial otherwise', () => {
    expect(deriveEntitlement({ subscribed: false, subscriptionStatus: 'free' })).toBe('pre_trial');
    expect(deriveEntitlement({ subscribed: false, subscriptionStatus: null })).toBe('pre_trial');
  });
});

describe('canEngagePauseFromEntitlement', () => {
  it('allows trialing and active only', () => {
    expect(canEngagePauseFromEntitlement('trialing')).toBe(true);
    expect(canEngagePauseFromEntitlement('active')).toBe(true);
    expect(canEngagePauseFromEntitlement('lapsed')).toBe(false);
    expect(canEngagePauseFromEntitlement('pre_trial')).toBe(false);
  });
});
