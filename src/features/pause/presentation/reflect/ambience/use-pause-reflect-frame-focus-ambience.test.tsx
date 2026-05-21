import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePauseReflectFrameFocusAmbience } from './use-pause-reflect-frame-focus-ambience';

const { startMock, stopMock, lastGate } = vi.hoisted(() => {
  const lastGate = { fn: null as (() => boolean) | null };
  const startMock = vi.fn((gate: () => boolean) => {
    lastGate.fn = gate;
  });
  const stopMock = vi.fn();
  return { startMock, stopMock, lastGate };
});

vi.mock('@/features/pause/application/use-cases/ritual/reflect/ambience/reflect-frame-focus-ambience', () => ({
  startPauseReflectFrameFocusAmbience: startMock,
  stopPauseReflectFrameFocusAmbience: stopMock,
}));

beforeEach(() => {
  startMock.mockReset();
  stopMock.mockReset();
  lastGate.fn = null;
});

describe('usePauseReflectFrameFocusAmbience', () => {
  it('stops ambience when step is inactive', () => {
    renderHook(() =>
      usePauseReflectFrameFocusAmbience({
        active: false,
        muted: false,
        prefersReducedMotion: false,
      }),
    );

    expect(startMock).not.toHaveBeenCalled();
    expect(stopMock).toHaveBeenCalled();
  });

  it('starts ambience with domain gate when reflect/frame step is active', () => {
    renderHook(() =>
      usePauseReflectFrameFocusAmbience({
        active: true,
        muted: false,
        prefersReducedMotion: false,
      }),
    );

    expect(startMock).toHaveBeenCalledOnce();
    expect(lastGate.fn?.()).toBe(true);
  });

  it('gate returns false when ritual sound is muted', () => {
    renderHook(() =>
      usePauseReflectFrameFocusAmbience({
        active: true,
        muted: true,
        prefersReducedMotion: false,
      }),
    );

    expect(lastGate.fn?.()).toBe(false);
  });

  it('gate returns false when prefers-reduced-motion is on', () => {
    renderHook(() =>
      usePauseReflectFrameFocusAmbience({
        active: true,
        muted: false,
        prefersReducedMotion: true,
      }),
    );

    expect(lastGate.fn?.()).toBe(false);
  });

  it('stops ambience on unmount cleanup', () => {
    const { unmount } = renderHook(() =>
      usePauseReflectFrameFocusAmbience({
        active: true,
        muted: false,
        prefersReducedMotion: false,
      }),
    );

    stopMock.mockClear();
    unmount();
    expect(stopMock).toHaveBeenCalled();
  });

  it('stops when active flips off without unmounting', () => {
    const { rerender } = renderHook(
      (props: { active: boolean }) =>
        usePauseReflectFrameFocusAmbience({
          active: props.active,
          muted: false,
          prefersReducedMotion: false,
        }),
      { initialProps: { active: true } },
    );

    startMock.mockClear();
    stopMock.mockClear();
    rerender({ active: false });

    expect(startMock).not.toHaveBeenCalled();
    expect(stopMock).toHaveBeenCalled();
  });
});
