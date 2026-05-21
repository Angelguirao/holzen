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
  '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-session-ui-telemetry',
  () => ({
    trackPauseReflectPostItOpen: trackPauseReflectPostItOpenMock,
    trackPauseReflectShareTap: trackPauseReflectShareTapMock,
    trackPauseReflectWallpaperTap: trackPauseReflectWallpaperTapMock,
  }),
);

describe('pause-reflect-telemetry-io', () => {
  it('re-exports session reflect UI telemetry from the session-ui module', () => {
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');
    const surface: PauseReflectTelemetrySurface = 'pause_reflect';
    expect(surface).toBe('pause_reflect');
    expect(trackPauseReflectPostItOpen).toBe(trackPauseReflectPostItOpenMock);
    expect(trackPauseReflectShareTap).toBe(trackPauseReflectShareTapMock);
    expect(trackPauseReflectWallpaperTap).toBe(trackPauseReflectWallpaperTapMock);
  });

  it('routes post-it open through the session-ui telemetry module', () => {
    trackPauseReflectPostItOpen('pi-1');
    expect(trackPauseReflectPostItOpenMock).toHaveBeenCalledWith('pi-1');
  });
});
