import { describe, expect, it, vi } from 'vitest';
import { applyCompanionOrchestrateRetryReset } from './apply-companion-orchestrate-retry-reset';

describe('applyCompanionOrchestrateRetryReset', () => {
  const ports = () => ({
    resetFetchedSlots: vi.fn(),
    clearSlotContent: vi.fn(),
    resetRelaxations: vi.fn(),
  });

  it('resets slots when instance present', () => {
    const p = ports();
    applyCompanionOrchestrateRetryReset({ pauseInstanceId: 'pi-1' }, p);
    expect(p.resetFetchedSlots).toHaveBeenCalled();
    expect(p.clearSlotContent).toHaveBeenCalled();
    expect(p.resetRelaxations).toHaveBeenCalled();
  });

  it('still clears slot state when no instance id', () => {
    const p = ports();
    applyCompanionOrchestrateRetryReset({ pauseInstanceId: null }, p);
    expect(p.resetFetchedSlots).toHaveBeenCalled();
    expect(p.clearSlotContent).toHaveBeenCalled();
    expect(p.resetRelaxations).toHaveBeenCalled();
  });
});
