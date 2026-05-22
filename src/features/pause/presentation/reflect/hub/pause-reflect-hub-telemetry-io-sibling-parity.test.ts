import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import * as hubIo from './pause-reflect-hub-io';
import {
  buildShiftEmotionFrameHubLogBundle,
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  reflectPauseRepository,
  resolveShiftFrameHubDonePresentation,
} from './pause-reflect-hub-io';
import * as telemetryIo from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';

/**
 * Presentation sibling parity: hub-io vs telemetry-io (parity with application
 * `application/.../hub/pause-reflect-hub-telemetry-io-sibling-parity.test.ts`;
 * share-hub flow pins for hub vs session UI telemetry; complements
 * `pause-reflect-steps-telemetry-io-sibling-parity.test.ts` and reciprocal inline
 * pins on `pause-reflect-hub-io.test.ts` / `pause-reflect-telemetry-io.test.ts` and
 * `pause-reflect-hub-io-parity.test.ts` ↔ `pause-reflect-telemetry-io-parity.test.ts`).
 */
describe('pause-reflect-hub-io ↔ pause-reflect-telemetry-io sibling parity', () => {
  it('hub-io and telemetry-io are distinct presentation I/O surfaces', () => {
    expect(typeof pauseShiftEmotionFrameHubDone).toBe('function');
    expect(typeof pauseShiftEmotionFrameHubDoneWithRepository).toBe('function');
    expect(typeof buildShiftEmotionFrameHubLogBundle).toBe('function');
    expect(typeof resolveShiftFrameHubDonePresentation).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');
    const surface: PauseReflectTelemetrySurface = 'pause_reflect';
    expect(surface).toBe('pause_reflect');

    expect('trackPauseReflectPostItOpen' in hubIo).toBe(false);
    expect('trackPauseReflectShareTap' in hubIo).toBe(false);
    expect('trackPauseReflectWallpaperTap' in hubIo).toBe(false);

    expect('pauseShiftEmotionFrameHubDone' in telemetryIo).toBe(false);
    expect('buildShiftEmotionFrameHubLogBundle' in telemetryIo).toBe(false);
    expect('resolveShiftFrameHubDonePresentation' in telemetryIo).toBe(false);
    expect('reflectPauseRepository' in telemetryIo).toBe(false);
  });

  it('hub-io exports stay off session reflect UI PostHog trackers', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(trackPauseReflectPostItOpen);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(trackPauseReflectShareTap);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(trackPauseReflectWallpaperTap);
    expect(resolveShiftFrameHubDonePresentation).not.toBe(trackPauseReflectPostItOpen);
    expect(reflectPauseRepository).not.toBe(trackPauseReflectShareTap);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(trackPauseReflectWallpaperTap);
  });

  it('telemetry-io exports stay off shift-frame hub RPC and presentation mapping', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(trackPauseReflectShareTap).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(trackPauseReflectWallpaperTap).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(trackPauseReflectPostItOpen).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(trackPauseReflectShareTap).not.toBe(reflectPauseRepository);
    expect(trackPauseReflectWallpaperTap).not.toBe(pauseShiftEmotionFrameHubDone);
  });
});
