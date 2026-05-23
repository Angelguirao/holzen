import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCompanionOrchestration } from './use-companion-orchestration';

const {
  useCompanionSlotUiStateMock,
  useCompanionInterventionBootstrapMock,
  useCompanionSlotOrchestrateActionsMock,
  useCompanionOrchestrateRetryMock,
  slotUiFixture,
  interventionBootstrapFixture,
  orchestrateActionsFixture,
  lastSlotUiArgs,
  lastInterventionBootstrapArgs,
  lastOrchestrateActionsArgs,
  lastOrchestrateRetryArgs,
} = vi.hoisted(() => {
  const fetchedSlotsRef = { current: new Set<string>() };
  const slotUiFixture = {
    cacheIds: { nudge: null, signal: null, zoomOut: null, history: null },
    cacheRelaxations: { nudge: false, signal: false, zoomOut: false, history: false },
    autoSaveToLibrary: vi.fn(),
    slotCommitters: {
      setSignal: vi.fn(),
      setNudge: vi.fn(),
      setHistoryInsight: vi.fn(),
      setZoomOut: vi.fn(),
      autoSaveToLibrary: vi.fn(),
    },
    fetchedSlotsRef,
    setCacheRelaxations: vi.fn(),
    setCacheIds: vi.fn(),
    companionSlotLoadingSetters: {},
    companionSlotErrorSetters: {},
    nudge: null,
    nudgeLoading: false,
    nudgeError: false,
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
    setNudge: vi.fn(),
    setNudgeError: vi.fn(),
    setZoomOut: vi.fn(),
    setZoomOutError: vi.fn(),
    setHistoryInsight: vi.fn(),
    setHistoryError: vi.fn(),
  };
  const interventionBootstrapFixture = {
    intervention: null,
    interventionLoading: false,
    interventionError: false,
    setIntervention: vi.fn(),
    setInterventionError: vi.fn(),
    clearInterventionFetchDedupe: vi.fn(),
    interventionSkippedRef: { current: false },
    pendingRetryConfirmRef: { current: null },
  };
  const orchestrateActionsFixture = {
    fetchCompanion: vi.fn(),
    regenerateCompanion: vi.fn(),
    retryNudge: vi.fn(),
    retrySignal: vi.fn(),
    retryZoomOut: vi.fn(),
    retryHistory: vi.fn(),
  };
  const lastSlotUiArgs: { current: string | null | undefined } = { current: undefined };
  const lastInterventionBootstrapArgs: { current: Record<string, unknown> | null } = {
    current: null,
  };
  const lastOrchestrateActionsArgs: { current: Record<string, unknown> | null } = {
    current: null,
  };
  const lastOrchestrateRetryArgs: { current: Record<string, unknown> | null } = { current: null };

  const useCompanionSlotUiStateMock = vi.fn((pauseInstanceId?: string | null) => {
    lastSlotUiArgs.current = pauseInstanceId;
    return slotUiFixture;
  });
  const useCompanionInterventionBootstrapMock = vi.fn((args: Record<string, unknown>) => {
    lastInterventionBootstrapArgs.current = args;
    return interventionBootstrapFixture;
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
    useCompanionInterventionBootstrapMock,
    useCompanionSlotOrchestrateActionsMock,
    useCompanionOrchestrateRetryMock,
    slotUiFixture,
    interventionBootstrapFixture,
    orchestrateActionsFixture,
    lastSlotUiArgs,
    lastInterventionBootstrapArgs,
    lastOrchestrateActionsArgs,
    lastOrchestrateRetryArgs,
  };
});

vi.mock('./use-companion-slot-ui-state', () => ({
  useCompanionSlotUiState: useCompanionSlotUiStateMock,
}));

vi.mock('./use-companion-intervention-bootstrap', () => ({
  useCompanionInterventionBootstrap: useCompanionInterventionBootstrapMock,
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
  useCompanionInterventionBootstrapMock.mockClear();
  useCompanionSlotOrchestrateActionsMock.mockClear();
  useCompanionOrchestrateRetryMock.mockClear();
  lastSlotUiArgs.current = undefined;
  lastInterventionBootstrapArgs.current = null;
  lastOrchestrateActionsArgs.current = null;
  lastOrchestrateRetryArgs.current = null;
  slotUiFixture.fetchedSlotsRef.current = new Set();
});

describe('useCompanionOrchestration', () => {
  it('wires slot UI into intervention bootstrap and orchestrate actions', () => {
    renderHook(() => useCompanionOrchestration(baseParams()));

    expect(useCompanionSlotUiStateMock).toHaveBeenCalledWith('pause-1');
    expect(lastInterventionBootstrapArgs.current).toMatchObject({
      pauseInstanceId: 'pause-1',
      retryCount: 0,
      context: 'btc',
      reflectionMessage: 'reflect',
      mood: 'calm',
      severityNumber: 42,
      language: 'en',
      autoSaveToLibrary: slotUiFixture.autoSaveToLibrary,
      slotCommitters: slotUiFixture.slotCommitters,
      fetchedSlotsRef: slotUiFixture.fetchedSlotsRef,
      setCacheRelaxations: slotUiFixture.setCacheRelaxations,
    });
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
      setCacheIds: slotUiFixture.setCacheIds,
      setCacheRelaxations: slotUiFixture.setCacheRelaxations,
      slotCommitters: slotUiFixture.slotCommitters,
    });
  });

  it('passes intervention bootstrap refs into orchestrate retry', () => {
    renderHook(() => useCompanionOrchestration(baseParams()));

    expect(lastOrchestrateRetryArgs.current).toMatchObject({
      pauseInstanceId: 'pause-1',
      fetchedSlotsRef: slotUiFixture.fetchedSlotsRef,
      setIntervention: interventionBootstrapFixture.setIntervention,
      setInterventionError: interventionBootstrapFixture.setInterventionError,
      clearInterventionFetchDedupe: interventionBootstrapFixture.clearInterventionFetchDedupe,
      interventionSkippedRef: interventionBootstrapFixture.interventionSkippedRef,
      pendingRetryConfirmRef: interventionBootstrapFixture.pendingRetryConfirmRef,
      setCacheRelaxations: slotUiFixture.setCacheRelaxations,
    });
  });

  it('surfaces slot UI, intervention, and orchestrate action APIs', () => {
    const { result } = renderHook(() => useCompanionOrchestration(baseParams()));

    expect(result.current.cacheIds).toBe(slotUiFixture.cacheIds);
    expect(result.current.intervention).toBe(interventionBootstrapFixture.intervention);
    expect(result.current.fetchCompanion).toBe(orchestrateActionsFixture.fetchCompanion);
    expect(result.current.regenerateCompanion).toBe(orchestrateActionsFixture.regenerateCompanion);
    expect(typeof result.current.retryOrchestrate).toBe('function');
  });
});
