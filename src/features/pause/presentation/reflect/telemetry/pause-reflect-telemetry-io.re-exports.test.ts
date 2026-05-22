import { describe, expect, it } from 'vitest';

import {
  trackPauseReflectPostItOpen as trackPostItDirect,
  trackPauseReflectShareTap as trackShareTapDirect,
  trackPauseReflectWallpaperTap as trackWallpaperDirect,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-session-ui-telemetry';
import {
  trackPauseReflectPostItOpen as trackPostItFromTelemetryFlow,
  trackPauseReflectShareTap as trackShareTapFromTelemetryFlow,
  trackPauseReflectWallpaperTap as trackWallpaperFromTelemetryFlow,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-telemetry-flow';

import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from './pause-reflect-telemetry-io';

describe('pause-reflect-telemetry-io re-exports', () => {
  it('re-exports session reflect UI telemetry from ritual/reflect/telemetry leaf', () => {
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect(trackPauseReflectPostItOpen).toBe(trackPostItDirect);
    expect(trackPauseReflectShareTap).toBe(trackShareTapDirect);
    expect(trackPauseReflectWallpaperTap).toBe(trackWallpaperDirect);
  });

  it('presentation I/O bindings match pause-reflect-telemetry-flow CI anchor (leaf parity)', () => {
    expect(trackPauseReflectPostItOpen).toBe(trackPostItFromTelemetryFlow);
    expect(trackPauseReflectShareTap).toBe(trackShareTapFromTelemetryFlow);
    expect(trackPauseReflectWallpaperTap).toBe(trackWallpaperFromTelemetryFlow);
  });
});
