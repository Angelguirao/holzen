import { describe, expect, it } from 'vitest';
import { resolveCompanionRegenerateClick } from '@/screens/pause/lib/companion-feedback-regenerate';

describe('resolveCompanionRegenerateClick', () => {
  it('noops when regenerate is unavailable or busy', () => {
    expect(
      resolveCompanionRegenerateClick({
        canRegenerate: false,
        regenBusy: false,
        isPro: true,
        limitReached: false,
      }),
    ).toEqual({ action: 'noop' });
    expect(
      resolveCompanionRegenerateClick({
        canRegenerate: true,
        regenBusy: true,
        isPro: true,
        limitReached: false,
      }),
    ).toEqual({ action: 'noop' });
  });

  it('requires Pro when not subscribed', () => {
    expect(
      resolveCompanionRegenerateClick({
        canRegenerate: true,
        regenBusy: false,
        isPro: false,
        limitReached: false,
      }),
    ).toEqual({ action: 'require_pro' });
  });

  it('blocks at paid limit', () => {
    expect(
      resolveCompanionRegenerateClick({
        canRegenerate: true,
        regenBusy: false,
        isPro: true,
        limitReached: true,
      }),
    ).toEqual({ action: 'limit_reached' });
  });

  it('runs when allowed', () => {
    expect(
      resolveCompanionRegenerateClick({
        canRegenerate: true,
        regenBusy: false,
        isPro: true,
        limitReached: false,
      }),
    ).toEqual({ action: 'run' });
  });
});
