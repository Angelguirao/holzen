import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { CompanionOrchestrateSessionContext } from '@/features/pause/application/use-cases/ritual/frame/build-companion-orchestrate-body';
import type { RunCompanionInterventionBootstrapPorts } from '@/features/pause/application/use-cases/ritual/frame/run-companion-intervention-bootstrap';
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

vi.mock(
  '@/features/pause/application/use-cases/ritual/frame/run-companion-intervention-bootstrap',
  () => ({
    runCompanionInterventionBootstrap: runCompanionInterventionBootstrapMock,
  }),
);

vi.mock('@/features/pause/infrastructure/supabase-companion-orchestrator', () => ({
  supabaseCompanionOrchestrator: mockCompanionOrchestrator,
}));

vi.mock('@/features/pause/infrastructure/queries/artifact-cache-query', () => ({
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
  invokeInterventionMock.mockReset().mockResolvedValue({ data: {}, error: null });
  loadOrchestrateSessionMock.mockReset().mockResolvedValue(sessionFixture);
  interventionFetchKeyRef.current = null;
  interventionSkippedRef.current = false;
  fetchedSlotsRef.current = new Set();
});

describe('useCompanionInterventionFetch', () => {
  it('bootstraps intervention via runCompanionInterventionBootstrap with orchestrator invoke port', async () => {
    let capturedPorts: RunCompanionInterventionBootstrapPorts | undefined;
    runCompanionInterventionBootstrapMock.mockImplementation(async (_input, ports) => {
      capturedPorts = ports;
      return { status: 'cached' };
    });

    renderHook(() => useCompanionInterventionFetch(baseParams()));

    await waitFor(() => {
      expect(runCompanionInterventionBootstrapMock).toHaveBeenCalledTimes(1);
    });

    expect(capturedPorts?.loadOrchestrateSession).toBe(loadOrchestrateSessionMock);

    await capturedPorts!.invokeIntervention(sessionFixture);
    expect(invokeInterventionMock).toHaveBeenCalledWith(sessionFixture);
    expect(mockCompanionOrchestrator.port).toBe('supabaseCompanionOrchestrator');
  });

  it('does not re-fetch for the same pause instance and retry generation', async () => {
    renderHook(() => useCompanionInterventionFetch(baseParams()));

    await waitFor(() => {
      expect(runCompanionInterventionBootstrapMock).toHaveBeenCalledTimes(1);
    });

    interventionFetchKeyRef.current = 'pause-1:0';
    runCompanionInterventionBootstrapMock.mockClear();

    renderHook(() => useCompanionInterventionFetch(baseParams()));

    await waitFor(() => {
      expect(interventionFetchKeyRef.current).toBe('pause-1:0');
    });
    expect(runCompanionInterventionBootstrapMock).not.toHaveBeenCalled();
  });
});
