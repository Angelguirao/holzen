import { describe, expect, it, vi } from 'vitest';
import {
  hydrateOrchestrateSlotsFromInterventionResponse,
  INTERVENTION_RESPONSE_COMPANION_SLOTS,
} from './orchestrate-slot-apply';

describe('INTERVENTION_RESPONSE_COMPANION_SLOTS', () => {
  it('hydrates grounding through signal in a stable order', () => {
    expect([...INTERVENTION_RESPONSE_COMPANION_SLOTS]).toEqual([
      'grounding',
      'history',
      'zoomOut',
      'signal',
    ]);
  });
});

describe('hydrateOrchestrateSlotsFromInterventionResponse', () => {
  it('returns the signal slot body for optional logging', () => {
    const signalSlot = {
      data: { title: 'S', body: 'b', source: 'live', url: 'https://x.test' },
      source: 'live' as const,
      cacheId: null,
      latencyMs: 12,
    };
    const body = { signal: signalSlot };
    const fetched = new Set<string>();
    const setSignal = vi.fn();
    const result = hydrateOrchestrateSlotsFromInterventionResponse(body, fetched, {
      setSignal,
      setNudge: vi.fn(),
      setHistoryInsight: vi.fn(),
      setZoomOut: vi.fn(),
      autoSaveToLibrary: vi.fn(),
    });
    expect(result).toEqual(signalSlot);
    expect(fetched.has('signal')).toBe(true);
    expect(setSignal).toHaveBeenCalled();
  });
});
