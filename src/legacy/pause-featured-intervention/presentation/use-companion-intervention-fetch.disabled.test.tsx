import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { PAUSE_FEATURED_INTERVENTION_ENABLED } from '@/legacy/pause-featured-intervention/domain/pause-featured-intervention';
import { useCompanionInterventionFetch } from './use-companion-intervention-fetch';

const { runBootstrap } = vi.hoisted(() => ({
  runBootstrap: vi.fn(),
}));

vi.mock('./pause-companion-orchestrate-io', () => ({
  runCompanionInterventionBootstrap: runBootstrap,
  companionOrchestrator: { invokeIntervention: vi.fn() },
}));

describe('useCompanionInterventionFetch (shipped default)', () => {
  it('does not call orchestrate when featured intervention is off', async () => {
    expect(PAUSE_FEATURED_INTERVENTION_ENABLED).toBe(false);

    renderHook(() =>
      useCompanionInterventionFetch({
        pauseInstanceId: 'pause-1',
        retryCount: 0,
        interventionFetchKeyRef: { current: null },
        interventionSkippedRef: { current: false },
        startInterventionTransition: (cb) => {
          void cb();
        },
        setInterventionError: vi.fn(),
        setIntervention: vi.fn(),
        loadOrchestrateSession: vi.fn(),
        slotCommitters: {
          setSignal: vi.fn(),
          setNudge: vi.fn(),
          setHistoryInsight: vi.fn(),
          setZoomOut: vi.fn(),
          autoSaveToLibrary: vi.fn(),
        },
        fetchedSlotsRef: { current: new Set() },
        setCacheRelaxations: vi.fn(),
      }),
    );

    await waitFor(() => {
      expect(runBootstrap).not.toHaveBeenCalled();
    });
  });
});
