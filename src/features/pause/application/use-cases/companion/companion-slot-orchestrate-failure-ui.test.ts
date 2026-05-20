import { describe, expect, it, vi } from 'vitest';
import {
  applyCompanionSlotOrchestrateFailureUi,
  resolveCompanionSlotOrchestrateFailureUi,
} from './companion-slot-orchestrate-failure-ui';
import type { CompanionOrchestrateInvokeFailure } from './orchestrate-invoke-error';

const baseFailure = (overrides: Partial<CompanionOrchestrateInvokeFailure>): CompanionOrchestrateInvokeFailure => ({
  kind: 'lazy_fetch',
  code: null,
  userMessage: 'Something went wrong',
  isPaywall: false,
  ...overrides,
});

describe('resolveCompanionSlotOrchestrateFailureUi', () => {
  it('lazy fetch upgrade paywall', () => {
    expect(
      resolveCompanionSlotOrchestrateFailureUi(
        baseFailure({ isPaywall: true, code: 'companions_upgrade_required' }),
        'lazy_fetch',
      ),
    ).toEqual({ action: 'lazy_paywall_upgrade_required' });
  });

  it('lazy fetch quota paywall', () => {
    expect(
      resolveCompanionSlotOrchestrateFailureUi(
        baseFailure({ isPaywall: true, code: 'companions_quota_exceeded' }),
        'lazy_fetch',
      ),
    ).toEqual({ action: 'lazy_paywall_limit_reached' });
  });

  it('regenerate paywall uses companion unavailable toast', () => {
    expect(
      resolveCompanionSlotOrchestrateFailureUi(
        baseFailure({ kind: 'regenerate', isPaywall: true, userMessage: 'Plan limit' }),
        'regenerate',
      ),
    ).toEqual({
      action: 'toast',
      title: 'Companion unavailable',
      description: 'Plan limit',
    });
  });

  it('non-paywall lazy fetch', () => {
    expect(
      resolveCompanionSlotOrchestrateFailureUi(
        baseFailure({ userMessage: 'Edge down' }),
        'lazy_fetch',
      ),
    ).toEqual({
      action: 'toast',
      title: 'Companion unavailable',
      description: 'Edge down',
    });
  });

  it('non-paywall regenerate', () => {
    expect(
      resolveCompanionSlotOrchestrateFailureUi(
        baseFailure({ kind: 'regenerate', userMessage: 'Bad input' }),
        'regenerate',
      ),
    ).toEqual({
      action: 'toast',
      title: 'Regenerate failed',
      description: 'Bad input',
    });
  });
});

describe('applyCompanionSlotOrchestrateFailureUi', () => {
  const ports = () => ({
    clearLazyFetchSlot: vi.fn(),
    requirePro: vi.fn(),
    showLimitReached: vi.fn(),
    showErrorToast: vi.fn(),
  });

  it('lazy upgrade clears slot and opens Pro gate', () => {
    const p = ports();
    applyCompanionSlotOrchestrateFailureUi(
      { action: 'lazy_paywall_upgrade_required' },
      'signal',
      p,
    );
    expect(p.clearLazyFetchSlot).toHaveBeenCalledWith('signal');
    expect(p.requirePro).toHaveBeenCalled();
    expect(p.showLimitReached).not.toHaveBeenCalled();
    expect(p.showErrorToast).not.toHaveBeenCalled();
  });

  it('lazy limit shows limit toast', () => {
    const p = ports();
    applyCompanionSlotOrchestrateFailureUi({ action: 'lazy_paywall_limit_reached' }, 'grounding', p);
    expect(p.clearLazyFetchSlot).toHaveBeenCalledWith('grounding');
    expect(p.showLimitReached).toHaveBeenCalled();
  });

  it('error toast only', () => {
    const p = ports();
    applyCompanionSlotOrchestrateFailureUi(
      { action: 'toast', title: 'Regenerate failed', description: 'Nope' },
      'history',
      p,
    );
    expect(p.clearLazyFetchSlot).not.toHaveBeenCalled();
    expect(p.showErrorToast).toHaveBeenCalledWith('Regenerate failed', 'Nope');
  });
});
