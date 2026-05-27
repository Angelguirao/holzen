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
    nudge: null,
    nudgeLoading: false,
    nudgeError: null,
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
});
