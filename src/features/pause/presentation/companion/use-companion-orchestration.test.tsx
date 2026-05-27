import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCompanionOrchestration } from './use-companion-orchestration';

const {
  useCompanionSlotUiStateMock,
  useCompanionSlotOrchestrateActionsMock,
  useCompanionOrchestrateRetryMock,
  slotUiFixture,
  orchestrateActionsFixture,
  lastSlotUiArgs,
  lastOrchestrateActionsArgs,
  lastOrchestrateRetryArgs,
} = vi.hoisted(() => {
  const fetchedSlotsRef = { current: new Set<string>() };
  const slotUiFixture = {
    cacheIds: { grounding: null, signal: null, zoomOut: null, history: null },
    cacheRelaxations: { grounding: false, signal: false, zoomOut: false, history: false },
    slotCommitters: {
      setSignal: vi.fn(),
      setGrounding: vi.fn(),
      setHistoryInsight: vi.fn(),
      setZoomOut: vi.fn(),
      autoSaveToLibrary: vi.fn(),
    },
    fetchedSlotsRef,
    setCacheRelaxations: vi.fn(),
    setCacheIds: vi.fn(),
    companionSlotTransitionStarters: {},
    companionSlotErrorSetters: {},
    grounding: null,
    groundingLoading: false,
    groundingError: false,
    signal: null,
    signalLoading: false,
    signalError: false,
    zoomOut: null,
    zoomOutLoading: false,
    zoomOutError: false,
    historyInsight: null,
    historyLoading: false,
    historyError: false,
    setSignal: vi.fn(),
    setSignalError: vi.fn(),
    setGrounding: vi.fn(),
    setGroundingError: vi.fn(),
    setZoomOut: vi.fn(),
    setZoomOutError: vi.fn(),
    setHistoryInsight: vi.fn(),
    setHistoryError: vi.fn(),
  };
  const orchestrateActionsFixture = {
    fetchCompanion: vi.fn(),
    regenerateCompanion: vi.fn(),
    retryGrounding: vi.fn(),
    retrySignal: vi.fn(),
    retryZoomOut: vi.fn(),
    retryHistory: vi.fn(),
  };
  const lastSlotUiArgs: { current: string | null | undefined } = { current: undefined };
  const lastOrchestrateActionsArgs: { current: Record<string, unknown> | null } = {
    current: null,
  };
  const lastOrchestrateRetryArgs: { current: Record<string, unknown> | null } = { current: null };

  const useCompanionSlotUiStateMock = vi.fn((pauseInstanceId?: string | null) => {
    lastSlotUiArgs.current = pauseInstanceId;
    return slotUiFixture;
  });
  const useCompanionSlotOrchestrateActionsMock = vi.fn((args: Record<string, unknown>) => {
    lastOrchestrateActionsArgs.current = args;
    return orchestrateActionsFixture;
  });
  const useCompanionOrchestrateRetryMock = vi.fn((args: Record<string, unknown>) => {
    lastOrchestrateRetryArgs.current = args;
    return { retryOrchestrate: vi.fn() };
  });

  return {
    useCompanionSlotUiStateMock,
    useCompanionSlotOrchestrateActionsMock,
    useCompanionOrchestrateRetryMock,
    slotUiFixture,
    orchestrateActionsFixture,
    lastSlotUiArgs,
    lastOrchestrateActionsArgs,
    lastOrchestrateRetryArgs,
  };
});

vi.mock('./use-companion-artifact-hydrate', () => ({
  useCompanionArtifactHydrate: vi.fn(() => ({
    whenArtifactHydrateReady: () => Promise.resolve(),
  })),
}));

vi.mock('./use-companion-slot-ui-state', () => ({
  useCompanionSlotUiState: useCompanionSlotUiStateMock,
}));

vi.mock('./use-companion-slot-orchestrate-actions', () => ({
  useCompanionSlotOrchestrateActions: useCompanionSlotOrchestrateActionsMock,
}));

vi.mock('./use-companion-orchestrate-retry', () => ({
  useCompanionOrchestrateRetry: useCompanionOrchestrateRetryMock,
}));

const toast = vi.fn();
const canAccessCompanion = vi.fn().mockReturnValue(true);
const applyOptimisticDecrement = vi.fn();
const refreshSubscription = vi.fn();
const requirePro = vi.fn().mockReturnValue(true);
const startCheckout = vi.fn();

function baseParams(
  overrides: Partial<Parameters<typeof useCompanionOrchestration>[0]> = {},
) {
  return {
    pauseInstanceId: 'pause-1',
    context: 'btc',
    reflectionMessage: 'reflect',
    mood: 'calm',
    severityNumber: 42,
    language: 'en',
    canAccessCompanion,
    applyOptimisticDecrement,
    refreshSubscription,
    toast,
    requirePro,
    startCheckout,
    ...overrides,
  };
}

beforeEach(() => {
  useCompanionSlotUiStateMock.mockClear();
  useCompanionSlotOrchestrateActionsMock.mockClear();
  useCompanionOrchestrateRetryMock.mockClear();
  lastSlotUiArgs.current = undefined;
  lastOrchestrateActionsArgs.current = null;
  lastOrchestrateRetryArgs.current = null;
  slotUiFixture.fetchedSlotsRef.current = new Set();
});

describe('useCompanionOrchestration', () => {
  it('wires slot UI into orchestrate actions', () => {
    renderHook(() => useCompanionOrchestration(baseParams()));

    expect(useCompanionSlotUiStateMock).toHaveBeenCalledWith('pause-1');
    expect(lastOrchestrateActionsArgs.current).toMatchObject({
      pauseInstanceId: 'pause-1',
      context: 'btc',
      reflectionMessage: 'reflect',
      mood: 'calm',
      severityNumber: 42,
      language: 'en',
      canAccessCompanion,
      applyOptimisticDecrement,
      refreshSubscription,
      toast,
      requirePro,
      startCheckout,
      fetchedSlotsRef: slotUiFixture.fetchedSlotsRef,
      whenArtifactHydrateReady: expect.any(Function),
      setCacheIds: slotUiFixture.setCacheIds,
      setCacheRelaxations: slotUiFixture.setCacheRelaxations,
      slotCommitters: slotUiFixture.slotCommitters,
    });
  });

  it('passes slot setters into orchestrate retry', () => {
    renderHook(() => useCompanionOrchestration(baseParams()));

    expect(lastOrchestrateRetryArgs.current).toMatchObject({
      pauseInstanceId: 'pause-1',
      fetchedSlotsRef: slotUiFixture.fetchedSlotsRef,
      setCacheRelaxations: slotUiFixture.setCacheRelaxations,
    });
  });

  it('surfaces slot UI and orchestrate action APIs', () => {
    const { result } = renderHook(() => useCompanionOrchestration(baseParams()));

    expect(result.current.cacheIds).toBe(slotUiFixture.cacheIds);
    expect(result.current.fetchCompanion).toBe(orchestrateActionsFixture.fetchCompanion);
    expect(result.current.regenerateCompanion).toBe(orchestrateActionsFixture.regenerateCompanion);
    expect(typeof result.current.retryOrchestrate).toBe('function');
  });
});
