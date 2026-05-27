import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { CompanionOrchestrateSessionContext } from '@/features/pause/application/use-cases/ritual/frame/build-companion-orchestrate-body';
import type { RunCompanionInterventionBootstrapPorts } from '@/legacy/pause-featured-intervention/application/run-companion-intervention-bootstrap';
import { useCompanionInterventionFetch } from './use-companion-intervention-fetch';

const {
  runCompanionInterventionBootstrapMock,
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
    invokeInterventionMock,
    loadOrchestrateSessionMock: vi.fn().mockResolvedValue(sessionFixture),
  };
});

vi.mock('@/legacy/pause-featured-intervention/domain/pause-featured-intervention', () => ({
  PAUSE_FEATURED_INTERVENTION_ENABLED: true,
}));

vi.mock('@/legacy/pause-featured-intervention/application/run-companion-intervention-bootstrap', () => ({
  runCompanionInterventionBootstrap: runCompanionInterventionBootstrapMock,
}));

vi.mock('@/legacy/pause-featured-intervention/infrastructure/invoke-featured-intervention', () => ({
  invokeFeaturedInterventionOrchestrate: invokeInterventionMock,
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
    startInterventionTransition: (cb: () => void) => {
      void cb();
    },
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
    expect(ports?.invokeIntervention).toBe(invokeInterventionMock);
    await ports?.invokeIntervention?.(sessionFixture);
    expect(invokeInterventionMock).toHaveBeenCalledWith(sessionFixture);
  });
});
