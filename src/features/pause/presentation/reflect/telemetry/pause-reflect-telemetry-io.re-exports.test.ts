import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

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
  buildPauseScoreImpacts,
  getSessionQuote,
  pauseReflectOutcomeLog,
  resolvePauseSessionReflectAndDecidePreflight,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
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

  it('sibling cluster: flows-io exports stay distinct from telemetry-io re-exports', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(trackPauseReflectShareTap).not.toBe(pauseReflectOutcomeLog);
    expect(trackPauseReflectWallpaperTap).not.toBe(buildPauseScoreImpacts);
    expect(trackPauseReflectPostItOpen).not.toBe(getSessionQuote);
  });
});
