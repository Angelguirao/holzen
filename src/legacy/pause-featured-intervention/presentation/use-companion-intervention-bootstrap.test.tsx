import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCompanionInterventionBootstrap } from './use-companion-intervention-bootstrap';

const {
  useCompanionOrchestrateSessionMock,
  useCompanionInterventionFetchMock,
  loadOrchestrateSessionMock,
  lastInterventionFetchArgs,
  lastOrchestrateSessionArgs,
} = vi.hoisted(() => {
  const loadOrchestrateSessionMock = vi.fn().mockResolvedValue(null);
  const lastInterventionFetchArgs: { current: Record<string, unknown> | null } = { current: null };
  const lastOrchestrateSessionArgs: { current: Record<string, unknown> | null } = { current: null };
  const useCompanionOrchestrateSessionMock = vi.fn((args: Record<string, unknown>) => {
    lastOrchestrateSessionArgs.current = args;
    return loadOrchestrateSessionMock;
  });
  const useCompanionInterventionFetchMock = vi.fn((args: Record<string, unknown>) => {
    lastInterventionFetchArgs.current = args;
  });
  return {
    useCompanionOrchestrateSessionMock,
    useCompanionInterventionFetchMock,
    loadOrchestrateSessionMock,
    lastInterventionFetchArgs,
    lastOrchestrateSessionArgs,
  };
});

vi.mock('./use-companion-orchestrate-session', () => ({
  useCompanionOrchestrateSession: useCompanionOrchestrateSessionMock,
}));

vi.mock('./use-companion-intervention-fetch', () => ({
  useCompanionInterventionFetch: useCompanionInterventionFetchMock,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn() },
}));

const noop = vi.fn();
const fetchedSlotsRef = { current: new Set<string>() };

function baseParams(overrides: { pauseInstanceId?: string | null; retryCount?: number } = {}) {
  return {
    pauseInstanceId: 'pause-1',
    retryCount: 0,
    context: 'btc',
    reflectionMessage: 'reflect',
    mood: 'calm',
    severityNumber: 42,
    language: 'en',
    autoSaveToLibrary: noop,
    slotCommitters: {
      setSignal: noop,
      setNudge: noop,
      setHistoryInsight: noop,
      setZoomOut: noop,
      autoSaveToLibrary: noop,
    },
    fetchedSlotsRef,
    setCacheRelaxations: noop,
    ...overrides,
  };
}

beforeEach(() => {
  useCompanionOrchestrateSessionMock.mockClear();
  useCompanionInterventionFetchMock.mockClear();
  loadOrchestrateSessionMock.mockClear().mockResolvedValue(null);
  lastInterventionFetchArgs.current = null;
  lastOrchestrateSessionArgs.current = null;
  fetchedSlotsRef.current = new Set();
});

describe('useCompanionInterventionBootstrap', () => {
  it('wires orchestrate-session loader into intervention fetch', async () => {
    renderHook(() => useCompanionInterventionBootstrap(baseParams()));

    await waitFor(() => {
      expect(useCompanionOrchestrateSessionMock).toHaveBeenCalled();
      expect(useCompanionInterventionFetchMock).toHaveBeenCalled();
    });

    expect(lastOrchestrateSessionArgs.current).toMatchObject({
      pauseInstanceId: 'pause-1',
      context: 'btc',
      reflectionMessage: 'reflect',
      mood: 'calm',
      severityNumber: 42,
      language: 'en',
    });
    expect(lastInterventionFetchArgs.current?.loadOrchestrateSession).toBe(loadOrchestrateSessionMock);
    expect(lastInterventionFetchArgs.current?.pauseInstanceId).toBe('pause-1');
    expect(lastInterventionFetchArgs.current?.retryCount).toBe(0);
  });

  it('resets intervention state when pauseInstanceId changes', async () => {
    const { result, rerender } = renderHook(
      (props: { pauseInstanceId: string | null }) =>
        useCompanionInterventionBootstrap(baseParams({ pauseInstanceId: props.pauseInstanceId })),
      { initialProps: { pauseInstanceId: 'pause-1' } },
    );

    await waitFor(() => {
      expect(useCompanionInterventionFetchMock).toHaveBeenCalled();
    });

    await act(async () => {
      result.current.setIntervention({ status: 'cached' } as never);
      result.current.setInterventionError(true);
    });

    rerender({ pauseInstanceId: 'pause-2' });

    await waitFor(() => {
      expect(result.current.intervention).toBeNull();
      expect(result.current.interventionError).toBe(false);
    });
  });

  it('exposes clearInterventionFetchDedupe without throwing', () => {
    const { result } = renderHook(() => useCompanionInterventionBootstrap(baseParams()));

    expect(typeof result.current.clearInterventionFetchDedupe).toBe('function');
    expect(() => result.current.clearInterventionFetchDedupe()).not.toThrow();
  });
});
