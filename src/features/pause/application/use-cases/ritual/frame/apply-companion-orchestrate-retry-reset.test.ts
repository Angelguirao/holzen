import { describe, expect, it, vi } from 'vitest';
import { applyCompanionOrchestrateRetryReset } from './apply-companion-orchestrate-retry-reset';

describe('applyCompanionOrchestrateRetryReset', () => {
  const ports = () => ({
    resetInterventionIdempotency: vi.fn(),
    queuePendingRetryConfirm: vi.fn(),
    resetFetchedSlots: vi.fn(),
    clearSlotContent: vi.fn(),
    clearInterventionFetchDedupe: vi.fn(),
    resetRelaxations: vi.fn(),
  });

  it('resets idempotency and slots when instance present', () => {
    const p = ports();
    applyCompanionOrchestrateRetryReset(
      { pauseInstanceId: 'pi-1', interventionSkipped: false },
      p,
    );
    expect(p.resetInterventionIdempotency).toHaveBeenCalledWith('pi-1');
    expect(p.queuePendingRetryConfirm).not.toHaveBeenCalled();
    expect(p.resetFetchedSlots).toHaveBeenCalled();
    expect(p.clearSlotContent).toHaveBeenCalled();
    expect(p.clearInterventionFetchDedupe).toHaveBeenCalled();
    expect(p.resetRelaxations).toHaveBeenCalled();
  });

  it('queues retry confirm when intervention was skipped', () => {
    const p = ports();
    applyCompanionOrchestrateRetryReset(
      { pauseInstanceId: 'pi-1', interventionSkipped: true },
      p,
    );
    expect(p.queuePendingRetryConfirm).toHaveBeenCalledWith('pi-1');
  });

  it('skips idempotency when no instance id', () => {
    const p = ports();
    applyCompanionOrchestrateRetryReset(
      { pauseInstanceId: null, interventionSkipped: true },
      p,
    );
    expect(p.resetInterventionIdempotency).not.toHaveBeenCalled();
    expect(p.queuePendingRetryConfirm).not.toHaveBeenCalled();
    expect(p.resetFetchedSlots).toHaveBeenCalled();
  });
});
