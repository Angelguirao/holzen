import { describe, expect, it } from 'vitest';
import { classifyCompanionAccessDenied } from './companion-access-gate';

describe('classifyCompanionAccessDenied', () => {
  it('requires upgrade when not Pro', () => {
    expect(
      classifyCompanionAccessDenied({
        isPro: false,
        companionRemaining: 5,
        flexCreditsBalance: 10,
      }),
    ).toBe('upgrade_required');
  });

  it('blocks when monthly bucket and flex credits are empty', () => {
    expect(
      classifyCompanionAccessDenied({
        isPro: true,
        companionRemaining: 0,
        flexCreditsBalance: 0,
      }),
    ).toBe('limit_reached');
  });

  it('allows when Pro and credits remain', () => {
    expect(
      classifyCompanionAccessDenied({
        isPro: true,
        companionRemaining: 1,
        flexCreditsBalance: 0,
      }),
    ).toBeNull();
  });
});
