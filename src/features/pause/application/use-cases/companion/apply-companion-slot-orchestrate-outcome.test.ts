import { describe, expect, it, vi } from 'vitest';
import { applyCompanionSlotOrchestrateOutcome } from './apply-companion-slot-orchestrate-outcome';

vi.mock('./companion-slot-orchestrate-telemetry', () => ({
  logCompanionSlotOrchestrateFailed: vi.fn(),
  logCompanionSlotOrchestrateFilled: vi.fn(),
  logCompanionSlotOrchestrateEmpty: vi.fn(),
}));

vi.mock('./orchestrate-slot-apply', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./orchestrate-slot-apply')>();
  return {
    ...actual,
    tryApplyOrchestrateSlotFromBody: vi.fn(),
  };
});

import { tryApplyOrchestrateSlotFromBody } from './orchestrate-slot-apply';

const failureUiPorts = {
  clearLazyFetchSlot: vi.fn(),
  requirePro: vi.fn(),
  showLimitReached: vi.fn(),
  showErrorToast: vi.fn(),
};

describe('applyCompanionSlotOrchestrateOutcome', () => {
  it('sets error and applies failure UI on orchestrate failure', () => {
    const setSlotError = vi.fn();
    applyCompanionSlotOrchestrateOutcome({
      mode: 'lazy_fetch',
      slot: 'signal',
      pauseInstanceId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      result: {
        status: 'failure',
        failure: {
          kind: 'lazy_fetch',
          code: null,
          userMessage: 'Unavailable',
          isPaywall: false,
        },
      },
      setCacheIds: vi.fn(),
      slotCommitters: {} as never,
      setCacheRelaxations: vi.fn(),
      failureUiPorts,
      setSlotError,
    });
    expect(setSlotError).toHaveBeenCalledWith(true);
    expect(failureUiPorts.showErrorToast).toHaveBeenCalledWith(
      'Companion unavailable',
      'Unavailable',
    );
  });

  it('logs filled path when slot body applies', () => {
    vi.mocked(tryApplyOrchestrateSlotFromBody).mockReturnValueOnce(true);
    const setSlotError = vi.fn();
    applyCompanionSlotOrchestrateOutcome({
      mode: 'regenerate',
      slot: 'grounding',
      pauseInstanceId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      result: { status: 'success', body: { ok: true }, hasFilledSlot: true },
      setCacheIds: vi.fn(),
      slotCommitters: {} as never,
      setCacheRelaxations: vi.fn(),
      failureUiPorts,
      setSlotError,
    });
    expect(setSlotError).not.toHaveBeenCalled();
    expect(tryApplyOrchestrateSlotFromBody).toHaveBeenCalled();
  });

  it('sets error when success body does not fill slot', () => {
    vi.mocked(tryApplyOrchestrateSlotFromBody).mockReturnValueOnce(false);
    const setSlotError = vi.fn();
    applyCompanionSlotOrchestrateOutcome({
      mode: 'lazy_fetch',
      slot: 'history',
      pauseInstanceId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      result: { status: 'success', body: {}, hasFilledSlot: false },
      setCacheIds: vi.fn(),
      slotCommitters: {} as never,
      setCacheRelaxations: vi.fn(),
      failureUiPorts,
      setSlotError,
    });
    expect(setSlotError).toHaveBeenCalledWith(true);
  });
});
