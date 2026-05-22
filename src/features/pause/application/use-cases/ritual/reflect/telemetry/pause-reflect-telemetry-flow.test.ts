import { describe, expect, it } from 'vitest';

import {
  trackPauseReflectPostItOpen as trackPostItDirect,
  trackPauseReflectShareTap as trackShareTapDirect,
  trackPauseReflectWallpaperTap as trackWallpaperDirect,
} from './pause-reflect-session-ui-telemetry';

import {
  trackPauseReflectPostItOpen as trackPostItFromShareFlow,
  trackPauseReflectShareTap as trackShareTapFromShareFlow,
  trackPauseReflectWallpaperTap as trackWallpaperFromShareFlow,
} from '../share/pause-reflect-share-flow';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from './pause-reflect-telemetry-flow';

describe('pause-reflect-telemetry-flow', () => {
  it('re-exports session reflect UI telemetry trackers from pause-reflect-session-ui-telemetry', () => {
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect(trackPauseReflectPostItOpen).toBe(trackPostItDirect);
    expect(trackPauseReflectShareTap).toBe(trackShareTapDirect);
    expect(trackPauseReflectWallpaperTap).toBe(trackWallpaperDirect);
  });

  it('telemetry subcluster bindings match share presentation umbrella (cross-umbrella parity)', () => {
    expect(trackPauseReflectPostItOpen).toBe(trackPostItFromShareFlow);
    expect(trackPauseReflectShareTap).toBe(trackShareTapFromShareFlow);
    expect(trackPauseReflectWallpaperTap).toBe(trackWallpaperFromShareFlow);
  });
});
