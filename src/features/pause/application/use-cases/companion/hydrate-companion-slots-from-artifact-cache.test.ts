import { describe, expect, it, vi } from 'vitest';
import { hydrateCompanionSlotsFromArtifactCache } from './hydrate-companion-slots-from-artifact-cache';

vi.mock('@/features/pause/application/use-cases/companion/companion-generation-telemetry', () => ({
  trackCompanionServed: vi.fn(),
}));

describe('hydrateCompanionSlotsFromArtifactCache', () => {
  it('hydrates slots and marks intervention cached when present', () => {
    const fetched = new Set<string>();
    const setSignal = vi.fn();
    const setNudge = vi.fn();
    const setHistoryInsight = vi.fn();
    const setZoomOut = vi.fn();
    const setIntervention = vi.fn();
    const autoSaveToLibrary = vi.fn();

    const result = hydrateCompanionSlotsFromArtifactCache({
      cached: {
        signal: { title: 'S', body: 'b', source: 'live', url: 'https://x.test' },
        intervention: { primary: 'trap', secondary: null },
      },
      fetchedSlots: fetched,
      committers: {
        setSignal,
        setNudge,
        setHistoryInsight,
        setZoomOut,
        autoSaveToLibrary,
      },
      setIntervention,
    });

    expect(result.hasCachedIntervention).toBe(true);
    expect(setSignal).toHaveBeenCalled();
    expect(fetched.has('signal')).toBe(true);
    expect(setIntervention).toHaveBeenCalledWith({ primary: 'trap', secondary: null });
  });

  it('returns false when intervention is missing', () => {
    const result = hydrateCompanionSlotsFromArtifactCache({
      cached: {},
      fetchedSlots: new Set(),
      committers: {
        setSignal: vi.fn(),
        setNudge: vi.fn(),
        setHistoryInsight: vi.fn(),
        setZoomOut: vi.fn(),
        autoSaveToLibrary: vi.fn(),
      },
    });
    expect(result.hasCachedIntervention).toBe(false);
  });
});
