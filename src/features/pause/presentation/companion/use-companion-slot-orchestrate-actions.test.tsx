import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCompanionSlotOrchestrateActions } from './use-companion-slot-orchestrate-actions';

const runSlotOrchestrateMock = vi.fn().mockResolvedValue(undefined);

vi.mock('./use-companion-slot-run-orchestrate', () => ({
  useCompanionSlotRunOrchestrate: () => ({
    runSlotOrchestrate: runSlotOrchestrateMock,
  }),
}));

vi.mock('./use-companion-slot-orchestrate-failure-ports', () => ({
  useCompanionSlotOrchestrateFailurePorts: () => ({
    clearLazyFetchSlot: vi.fn(),
    markLazyFetchSlotComplete: vi.fn(),
    requirePro: vi.fn(),
    showLimitReached: vi.fn(),
    showErrorToast: vi.fn(),
  }),
}));

function baseParams(overrides: Record<string, unknown> = {}) {
  const fetchedSlotsRef = { current: new Set<string>() };
  return {
    pauseInstanceId: 'pause-1',
    context: 'btc',
    reflectionMessage: 'Stay calm.',
    mood: null,
    severityNumber: 50,
    language: 'en',
    canAccessCompanion: () => true,
    applyOptimisticDecrement: vi.fn(),
    refreshSubscription: vi.fn(),
    toast: vi.fn(),
    requirePro: vi.fn(),
    startCheckout: vi.fn(),
    fetchedSlotsRef,
    getSlotPayload: () => null,
    whenArtifactHydrateReady: () => Promise.resolve(),
    setCacheIds: vi.fn(),
    setCacheRelaxations: vi.fn(),
    slotCommitters: {
      setSignal: vi.fn(),
      setGrounding: vi.fn(),
      setHistoryInsight: vi.fn(),
      setZoomOut: vi.fn(),
      autoSaveToLibrary: vi.fn(),
    },
    companionSlotTransitionStarters: {
      signal: (cb: () => void) => {
        void cb();
      },
      grounding: (cb: () => void) => {
        void cb();
      },
      history: (cb: () => void) => {
        void cb();
      },
      zoomOut: (cb: () => void) => {
        void cb();
      },
    },
    companionSlotErrorSetters: {
      setSignalError: vi.fn(),
      setGroundingError: vi.fn(),
      setHistoryError: vi.fn(),
      setZoomOutError: vi.fn(),
    },
    ...overrides,
  };
}

beforeEach(() => {
  runSlotOrchestrateMock.mockClear();
});

describe('useCompanionSlotOrchestrateActions', () => {
  it('invokes orchestrate when fetched marker exists without displayable payload', async () => {
    const fetchedSlotsRef = { current: new Set(['grounding']) };
    const { result } = renderHook(() =>
      useCompanionSlotOrchestrateActions(
        baseParams({
          fetchedSlotsRef,
          getSlotPayload: () => ({ title: '', body: '', citation: '', url: '' }),
        }),
      ),
    );

    await act(async () => {
      await result.current.fetchCompanion('grounding');
    });

    expect(runSlotOrchestrateMock).toHaveBeenCalledWith('grounding', 'lazy_fetch');
    expect(fetchedSlotsRef.current.has('grounding')).toBe(false);
  });

});
