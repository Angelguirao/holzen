import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePauseReflectUiTelemetry } from './use-pause-reflect-ui-telemetry';

const {
  trackPauseReflectPostItOpenMock,
  trackPauseReflectShareTapMock,
  trackPauseReflectWallpaperTapMock,
} = vi.hoisted(() => ({
  trackPauseReflectPostItOpenMock: vi.fn(),
  trackPauseReflectShareTapMock: vi.fn(),
  trackPauseReflectWallpaperTapMock: vi.fn(),
}));

vi.mock('./pause-reflect-telemetry-io', () => ({
  trackPauseReflectPostItOpen: trackPauseReflectPostItOpenMock,
  trackPauseReflectShareTap: trackPauseReflectShareTapMock,
  trackPauseReflectWallpaperTap: trackPauseReflectWallpaperTapMock,
}));

beforeEach(() => {
  trackPauseReflectPostItOpenMock.mockReset();
  trackPauseReflectShareTapMock.mockReset();
  trackPauseReflectWallpaperTapMock.mockReset();
});

describe('usePauseReflectUiTelemetry', () => {
  it('tracks post-it open only on pause_reflect surface', () => {
    const { result } = renderHook(() => usePauseReflectUiTelemetry('inst-1', 'pause_reflect'));

    act(() => {
      result.current.onPostItOpen();
    });

    expect(trackPauseReflectPostItOpenMock).toHaveBeenCalledWith('inst-1');

    trackPauseReflectPostItOpenMock.mockClear();
    const done = renderHook(() => usePauseReflectUiTelemetry('inst-1', 'pause_done'));
    act(() => {
      done.result.current.onPostItOpen();
    });
    expect(trackPauseReflectPostItOpenMock).not.toHaveBeenCalled();
  });

  it('tracks share tap with surface and pause id', () => {
    const { result } = renderHook(() => usePauseReflectUiTelemetry('inst-2', 'pause_done'));

    act(() => {
      result.current.onShareMenuOpen();
    });

    expect(trackPauseReflectShareTapMock).toHaveBeenCalledWith('pause_done', 'inst-2');
  });

  it('tracks wallpaper tap with surface only', () => {
    const { result } = renderHook(() => usePauseReflectUiTelemetry(null, 'pause_reflect'));

    act(() => {
      result.current.onWallpaperTap();
    });

    expect(trackPauseReflectWallpaperTapMock).toHaveBeenCalledWith('pause_reflect');
  });
});
