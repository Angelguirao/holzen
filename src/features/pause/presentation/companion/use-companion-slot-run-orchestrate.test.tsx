import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ApplyCompanionSlotOrchestrateFailureUiPorts } from './pause-companion-orchestrate-io';
import { useCompanionSlotRunOrchestrate } from './use-companion-slot-run-orchestrate';

const {
  runCompanionSlotOrchestrateMock,
  applyCompanionSlotOrchestrateOutcomeMock,
  mockCompanionOrchestrator,
  buildOrchestrateSessionMock,
  orchestrateSessionFixture,
} = vi.hoisted(() => {
  const orchestrateSessionFixture = {
    pauseInstanceId: 'pause-1',
    context: 'btc',
    language: 'en',
    reflectionMessage: 'reflect',
    mood: null,
    severity: 50,
    moodHistory: [] as { mood: string; outcome?: string | null }[],
  };
  return {
    orchestrateSessionFixture,
    runCompanionSlotOrchestrateMock: vi.fn().mockResolvedValue({
      status: 'success' as const,
      body: {},
      hasFilledSlot: false,
    }),
    applyCompanionSlotOrchestrateOutcomeMock: vi.fn(),
    mockCompanionOrchestrator: { port: 'supabaseCompanionOrchestrator' },
    buildOrchestrateSessionMock: vi.fn().mockResolvedValue(orchestrateSessionFixture),
  };
});

vi.mock('./use-companion-orchestrate-session', () => ({
  useCompanionOrchestrateSession: () => buildOrchestrateSessionMock,
}));

vi.mock('./pause-companion-orchestrate-io', () => ({
  runCompanionSlotOrchestrate: runCompanionSlotOrchestrateMock,
  applyCompanionSlotOrchestrateOutcome: applyCompanionSlotOrchestrateOutcomeMock,
  companionOrchestrator: mockCompanionOrchestrator,
  logCompanionSlotOrchestrateInvoke: vi.fn(),
  trackCompanionGenerationInitiated: vi.fn(),
  setCompanionSlotLoading: vi.fn(),
  setCompanionSlotError: vi.fn(),
}));

const noop = vi.fn();

function baseParams() {
  return {
    pauseInstanceId: 'pause-1',
    context: 'btc',
    reflectionMessage: 'reflect',
    mood: null,
    severityNumber: 50,
    language: 'en',
    failureUiPorts: {} as ApplyCompanionSlotOrchestrateFailureUiPorts,
    toast: vi.fn(),
    refreshSubscription: vi.fn(),
    setCacheIds: noop,
    setCacheRelaxations: noop,
    slotCommitters: {
      setSignal: noop,
      setNudge: noop,
      setHistoryInsight: noop,
      setZoomOut: noop,
      autoSaveToLibrary: noop,
    },
    companionSlotLoadingSetters: {
      setSignalLoading: noop,
      setNudgeLoading: noop,
      setHistoryLoading: noop,
      setZoomOutLoading: noop,
    },
    companionSlotErrorSetters: {
      setSignalError: noop,
      setNudgeError: noop,
      setHistoryError: noop,
      setZoomOutError: noop,
    },
  };
}

beforeEach(() => {
  runCompanionSlotOrchestrateMock.mockReset().mockResolvedValue({
    status: 'success',
    body: {},
    hasFilledSlot: false,
  });
  applyCompanionSlotOrchestrateOutcomeMock.mockReset();
  buildOrchestrateSessionMock.mockReset().mockResolvedValue(orchestrateSessionFixture);
});

describe('useCompanionSlotRunOrchestrate', () => {
  it('no-ops when pauseInstanceId is missing', async () => {
    const { result } = renderHook(() =>
      useCompanionSlotRunOrchestrate({ ...baseParams(), pauseInstanceId: null }),
    );

    await act(async () => {
      await result.current.runSlotOrchestrate('signal', 'lazy_fetch');
    });

    expect(runCompanionSlotOrchestrateMock).not.toHaveBeenCalled();
  });

  it('routes slot orchestrate through runCompanionSlotOrchestrate + CompanionOrchestrator port', async () => {
    const { result } = renderHook(() => useCompanionSlotRunOrchestrate(baseParams()));

    await act(async () => {
      await result.current.runSlotOrchestrate('signal', 'lazy_fetch');
    });

    expect(buildOrchestrateSessionMock).toHaveBeenCalled();
    expect(runCompanionSlotOrchestrateMock).toHaveBeenCalledWith(
      'lazy_fetch',
      'signal',
      orchestrateSessionFixture,
      mockCompanionOrchestrator,
    );
    expect(mockCompanionOrchestrator.port).toBe('supabaseCompanionOrchestrator');
    expect(applyCompanionSlotOrchestrateOutcomeMock).toHaveBeenCalled();
  });
});
