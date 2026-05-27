import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/posthog', () => ({
  trackEvent: vi.fn(),
}));

import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-telemetry-flow';
import * as telemetryFlow from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-telemetry-flow';
import {
  trackPauseReflectPostItOpen as trackPostItFromTelemetryIo,
  trackPauseReflectShareTap as trackShareFromTelemetryIo,
  trackPauseReflectWallpaperTap as trackWallpaperFromTelemetryIo,
} from './pause-reflect-telemetry-io';
import * as telemetryIo from './pause-reflect-telemetry-io';

/**
 * Presentation sibling parity: telemetry-flow CI umbrella vs telemetry-io presentation surface.
 * Mirrors application `pause-reflect-telemetry-flow-io-wrapper-sibling-parity.test.ts`
 * (colocated beside `pause-reflect-telemetry-io.ts`).
 * Delegation parity: colocated `pause-reflect-telemetry-io-parity.test.ts`.
 */
describe('pause-reflect-telemetry-flow ↔ pause-reflect-telemetry-io wrapper sibling parity (presentation)', () => {
  it('telemetry-flow CI umbrella and presentation telemetry-io are distinct anchors', () => {
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect(Object.keys(telemetryFlow).sort()).toEqual([
      'trackPauseReflectPostItOpen',
      'trackPauseReflectShareTap',
      'trackPauseReflectWallpaperTap',
    ]);
    expect(Object.keys(telemetryIo).sort()).toEqual([
      'trackPauseReflectBlockViewed',
      'trackPauseReflectContextStripExpanded',
      'trackPauseReflectInquiryDisplayed',
      'trackPauseReflectPostItOpen',
      'trackPauseReflectShareTap',
      'trackPauseReflectWallpaperTap',
    ]);
  });

  it('telemetry-flow and telemetry-io share session UI tracker re-exports by reference', () => {
    expect(trackPauseReflectPostItOpen).toBe(trackPostItFromTelemetryIo);
    expect(trackPauseReflectShareTap).toBe(trackShareFromTelemetryIo);
    expect(trackPauseReflectWallpaperTap).toBe(trackWallpaperFromTelemetryIo);
  });

  it('telemetry-flow module stays namespace-separated from presentation telemetry-io', () => {
    expect(telemetryFlow).not.toBe(telemetryIo);
  });
});
