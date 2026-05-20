import { describe, expect, it, vi } from 'vitest';
import { applyCompanionInterventionInvokeOutcome } from './apply-companion-intervention-invoke-outcome';

vi.mock('@/features/pause/application/use-cases/ritual/frame/companion-intervention-telemetry', () => ({
  logCompanionInterventionInvokeFailed: vi.fn(),
  logCompanionInterventionInvokeOk: vi.fn(),
  logCompanionInterventionSignalHydrated: vi.fn(),
}));

vi.mock('@/features/pause/application/use-cases/companion/orchestrate-slot-apply', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/features/pause/application/use-cases/companion/orchestrate-slot-apply')
    >();
  return {
    ...actual,
    hydrateOrchestrateSlotsFromInterventionResponse: vi.fn(() => null),
  };
});

const pauseInstanceId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

describe('applyCompanionInterventionInvokeOutcome', () => {
  it('returns error when intervention missing from body', async () => {
    const setIntervention = vi.fn();
    const result = await applyCompanionInterventionInvokeOutcome({
      pauseInstanceId,
      data: {},
      fnError: null,
      setIntervention,
      fetchedSlots: new Set(),
      slotCommitters: {} as never,
      setCacheRelaxations: vi.fn(),
    });
    expect(result).toEqual({ status: 'error' });
    expect(setIntervention).not.toHaveBeenCalled();
  });

  it('sets intervention on success body', async () => {
    const setIntervention = vi.fn();
    const intervention = { title: 'Pause', body: 'Breathe' };
    const result = await applyCompanionInterventionInvokeOutcome({
      pauseInstanceId,
      data: { intervention },
      fnError: null,
      setIntervention,
      fetchedSlots: new Set(),
      slotCommitters: {} as never,
      setCacheRelaxations: vi.fn(),
    });
    expect(result).toEqual({ status: 'success' });
    expect(setIntervention).toHaveBeenCalledWith(intervention);
  });
});
