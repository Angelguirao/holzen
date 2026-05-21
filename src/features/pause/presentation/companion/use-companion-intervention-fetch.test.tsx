import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type {
  CompanionOrchestrateSessionContext,
  RunCompanionInterventionBootstrapPorts,
} from './pause-companion-orchestrate-io';
import { useCompanionInterventionFetch } from './use-companion-intervention-fetch';

const {
  runCompanionInterventionBootstrapMock,
  mockCompanionOrchestrator,
  invokeInterventionMock,
  loadOrchestrateSessionMock,
  sessionFixture,
} = vi.hoisted(() => {
  const sessionFixture: CompanionOrchestrateSessionContext = {
    pauseInstanceId: 'pause-1',
    context: 'btc',
    language: 'en',
    reflectionMessage: '',
    mood: null,
    severity: 50,
    moodHistory: [],
  };
  const invokeInterventionMock = vi.fn().mockResolvedValue({ data: {}, error: null });
  return {
    sessionFixture,
    runCompanionInterventionBootstrapMock: vi.fn().mockResolvedValue({ status: 'cached' }),
    mockCompanionOrchestrator: {
      port: 'supabaseCompanionOrchestrator',
      invokeIntervention: invokeInterventionMock,
    },
    invokeInterventionMock,
    loadOrchestrateSessionMock: vi.fn().mockResolvedValue(sessionFixture),
  };
});

vi.mock('./pause-companion-orchestrate-io', () => ({
  runCompanionInterventionBootstrap: runCompanionInterventionBootstrapMock,
  companionOrchestrator: mockCompanionOrchestrator,
}));

vi.mock('@/features/pause/public-queries', () => ({
  fetchParsedPauseArtifactCache: vi.fn().mockResolvedValue({}),
}));

const noop = vi.fn();
const fetchedSlotsRef = { current: new Set<string>() };
const interventionFetchKeyRef = { current: null as string | null };
const interventionSkippedRef = { current: false };

function baseParams() {
  return {
    pauseInstanceId: 'pause-1',
    retryCount: 0,
    interventionFetchKeyRef,
    interventionSkippedRef,
    setInterventionLoading: noop,
    setInterventionError: noop,
    setIntervention: noop,
    loadOrchestrateSession: loadOrchestrateSessionMock,
    slotCommitters: {
      setSignal: noop,
      setNudge: noop,
      setHistoryInsight: noop,
      setZoomOut: noop,
      autoSaveToLibrary: noop,
    },
    fetchedSlotsRef,
    setCacheRelaxations: noop,
  };
}

beforeEach(() => {
  runCompanionInterventionBootstrapMock.mockReset().mockResolvedValue({ status: 'cached' });
  interventionFetchKeyRef.current = null;
  interventionSkippedRef.current = false;
});

describe('useCompanionInterventionFetch', () => {
  it('invokes intervention bootstrap with orchestrator port', async () => {
    renderHook(() => useCompanionInterventionFetch(baseParams()));

    await waitFor(() => {
      expect(runCompanionInterventionBootstrapMock).toHaveBeenCalled();
    });

    const ports = runCompanionInterventionBootstrapMock.mock.calls[0]?.[1] as
      | RunCompanionInterventionBootstrapPorts
      | undefined;
    expect(ports?.invokeIntervention).toBeDefined();
    await ports?.invokeIntervention?.(sessionFixture);
    expect(invokeInterventionMock).toHaveBeenCalledWith(sessionFixture);
  });
});
