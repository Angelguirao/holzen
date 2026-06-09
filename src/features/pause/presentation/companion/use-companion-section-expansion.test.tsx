import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCompanionSectionExpansion } from './use-companion-section-expansion';

function baseParams(
  overrides: Partial<Parameters<typeof useCompanionSectionExpansion>[0]> = {},
) {
  return {
    signal: null,
    signalLoading: false,
    signalError: null,
    grounding: null,
    groundingLoading: false,
    groundingError: null,
    zoomOut: null,
    zoomOutLoading: false,
    zoomOutError: null,
    historyInsight: null,
    historyLoading: false,
    historyError: null,
    fetchCompanion: vi.fn(),
    canAccessCompanion: () => true,
    ...overrides,
  };
}

describe('useCompanionSectionExpansion', () => {
  it('exclusiveExpand collapses other slots when opening one', () => {
    const { result } = renderHook(() =>
      useCompanionSectionExpansion({ ...baseParams(), exclusiveExpand: true }),
    );

    act(() => {
      result.current.toggleHaiku();
    });
    expect(result.current.expandedHaiku).toBe(true);

    act(() => {
      result.current.toggleGrounding();
    });
    expect(result.current.expandedHaiku).toBe(false);
    expect(result.current.expandedLearning).toBe(true);
  });

  it('exclusiveExpand collapses lazy slots when opening another', () => {
    const { result } = renderHook(() =>
      useCompanionSectionExpansion({ ...baseParams(), exclusiveExpand: true }),
    );

    act(() => {
      result.current.toggleZoomOut();
    });
    expect(result.current.expandedZoomOut).toBe(true);

    act(() => {
      result.current.toggleHistory();
    });
    expect(result.current.expandedZoomOut).toBe(false);
    expect(result.current.expandedHistory).toBe(true);
  });

  it('toggle again closes the same slot', () => {
    const { result } = renderHook(() =>
      useCompanionSectionExpansion({ ...baseParams(), exclusiveExpand: true }),
    );

    act(() => {
      result.current.toggleZoomOut();
    });
    expect(result.current.expandedZoomOut).toBe(true);

    act(() => {
      result.current.toggleZoomOut();
    });
    expect(result.current.expandedZoomOut).toBe(false);
  });

  it('exclusiveExpand does not collapse others when a gated slot fails to open', () => {
    const { result } = renderHook(() =>
      useCompanionSectionExpansion({
        ...baseParams(),
        exclusiveExpand: true,
        canAccessCompanion: () => false,
      }),
    );

    act(() => {
      result.current.toggleHaiku();
    });
    expect(result.current.expandedHaiku).toBe(true);

    act(() => {
      result.current.toggleSignal();
    });
    expect(result.current.expandedHaiku).toBe(true);
    expect(result.current.expandedSignal).toBe(false);
  });

  it('without exclusiveExpand multiple slots can stay open', () => {
    const { result } = renderHook(() =>
      useCompanionSectionExpansion({ ...baseParams(), exclusiveExpand: false }),
    );

    act(() => {
      result.current.toggleHaiku();
      result.current.toggleSignal();
    });
    expect(result.current.expandedHaiku).toBe(true);
    expect(result.current.expandedSignal).toBe(true);
  });

  it('lazy-fetches when expanding with empty grounding shell', () => {
    const fetchCompanion = vi.fn();
    const { result } = renderHook(() =>
      useCompanionSectionExpansion({
        ...baseParams({
          fetchCompanion,
          grounding: { title: '', body: '', citation: '', url: '' },
        }),
        exclusiveExpand: true,
      }),
    );

    act(() => {
      result.current.toggleGrounding();
    });

    expect(result.current.expandedLearning).toBe(true);
    expect(fetchCompanion).toHaveBeenCalledWith('grounding');
  });
});
