import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  supabaseReflectGenerator: { port: 'reflectGenerator' },
}));

import {
  trackPauseReflectPostItOpen as trackPostItDirect,
  trackPauseReflectShareTap as trackShareTapDirect,
  trackPauseReflectWallpaperTap as trackWallpaperDirect,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-session-ui-telemetry';
import {
  trackPauseReflectPostItOpen as trackPostItFromShareFlow,
  trackPauseReflectShareTap as trackShareTapFromShareFlow,
  trackPauseReflectWallpaperTap as trackWallpaperFromShareFlow,
} from '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-flow';
import {
  trackPauseReflectPostItOpen as trackPostItFromTelemetryFlow,
  trackPauseReflectShareTap as trackShareTapFromTelemetryFlow,
  trackPauseReflectWallpaperTap as trackWallpaperFromTelemetryFlow,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-telemetry-flow';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';

/**
 * Application telemetry I/O parity (colocated beside `pause-reflect-telemetry-flow.ts`).
 * Presentation mirror: `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
 * Share-io sibling: `pause-reflect-share-telemetry-io-sibling-parity.test.ts` (application + presentation).
 */
describe('pause-reflect-telemetry-io parity (application)', () => {
  it('presentation I/O session reflect telemetry matches telemetry CI umbrella', () => {
    expect(trackPauseReflectPostItOpen).toBe(trackPostItFromTelemetryFlow);
    expect(trackPauseReflectShareTap).toBe(trackShareTapFromTelemetryFlow);
    expect(trackPauseReflectWallpaperTap).toBe(trackWallpaperFromTelemetryFlow);
  });

  it('telemetry CI umbrella composes the same session UI telemetry leaf as presentation I/O', () => {
    expect(trackPauseReflectPostItOpen).toBe(trackPostItDirect);
    expect(trackPauseReflectShareTap).toBe(trackShareTapDirect);
    expect(trackPauseReflectWallpaperTap).toBe(trackWallpaperDirect);
    expect(trackPostItFromTelemetryFlow).toBe(trackPostItDirect);
    expect(trackShareTapFromTelemetryFlow).toBe(trackShareTapDirect);
    expect(trackWallpaperFromTelemetryFlow).toBe(trackWallpaperDirect);
  });

  it('share-flow and telemetry-flow re-export the same session UI telemetry leaf', () => {
    expect(trackPostItFromShareFlow).toBe(trackPauseReflectPostItOpen);
    expect(trackShareTapFromShareFlow).toBe(trackPauseReflectShareTap);
    expect(trackWallpaperFromShareFlow).toBe(trackPauseReflectWallpaperTap);
    expect(trackPostItFromShareFlow).toBe(trackPostItDirect);
    expect(trackShareTapFromShareFlow).toBe(trackShareTapDirect);
    expect(trackWallpaperFromShareFlow).toBe(trackWallpaperDirect);
  });
});
