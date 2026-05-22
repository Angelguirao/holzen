import { describe, expect, it, vi } from 'vitest';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from './pause-reflect-telemetry-io';

const trackPauseReflectPostItOpenMock = vi.hoisted(() => vi.fn());
const trackPauseReflectShareTapMock = vi.hoisted(() => vi.fn());
const trackPauseReflectWallpaperTapMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-telemetry-flow',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-telemetry-flow')
    >();
    return {
      ...actual,
      trackPauseReflectPostItOpen: trackPauseReflectPostItOpenMock,
      trackPauseReflectShareTap: trackPauseReflectShareTapMock,
      trackPauseReflectWallpaperTap: trackPauseReflectWallpaperTapMock,
    };
  },
);

describe('pause-reflect-telemetry-io', () => {
  it('re-exports session reflect UI telemetry from pause-reflect-telemetry-flow', () => {
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');
    const surface: PauseReflectTelemetrySurface = 'pause_reflect';
    expect(surface).toBe('pause_reflect');
    expect(trackPauseReflectPostItOpen).toBe(trackPauseReflectPostItOpenMock);
    expect(trackPauseReflectShareTap).toBe(trackPauseReflectShareTapMock);
    expect(trackPauseReflectWallpaperTap).toBe(trackPauseReflectWallpaperTapMock);
  });

  it('routes post-it open through the telemetry flow anchor', () => {
    trackPauseReflectPostItOpen('pi-1');
    expect(trackPauseReflectPostItOpenMock).toHaveBeenCalledWith('pi-1');
  });
});
