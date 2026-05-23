import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import * as moodIo from '@/features/pause/presentation/feel/pause-feel-io';
import {
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry,
  buildFeelTilesMoodLogOptions,
  pauseInitialEmotionSelect,
  pauseInitialEmotionSelectWithRepository,
  pauseInitialEmotionSkip,
  pauseInitialEmotionSkipWithRepository,
  reflectPauseRepository,
  resolvePauseDepthContextLineParams,
  resolvePauseSessionChromeCloseAction,
  runDeepPausePickerEntryIfPro,
  runPauseSessionChromeCloseAction,
} from '@/features/pause/presentation/feel/pause-feel-io';
import * as telemetryIo from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';

/**
 * Application sibling parity: mood-io vs telemetry-io (parity with presentation
 * `pause-feel-telemetry-io-sibling-parity.test.ts` and hub/share telemetry siblings).
 * Reciprocal inline pins: `pause-feel-io-parity.test.ts` ↔
 * `pause-reflect-telemetry-io-parity.test.ts` (application + presentation).
 */
describe('pause-feel-io ↔ pause-reflect-telemetry-io sibling parity (application)', () => {
  it('mood-io and telemetry-io are distinct presentation I/O surfaces', () => {
    expect(typeof pauseInitialEmotionSelect).toBe('function');
    expect(typeof pauseInitialEmotionSelectWithRepository).toBe('function');
    expect(typeof pauseInitialEmotionSkip).toBe('function');
    expect(typeof pauseInitialEmotionSkipWithRepository).toBe('function');
    expect(typeof buildFeelTilesMoodLogOptions).toBe('function');
    expect(typeof resolvePauseSessionChromeCloseAction).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');
    const surface: PauseReflectTelemetrySurface = 'pause_reflect';
    expect(surface).toBe('pause_reflect');

    expect('trackPauseReflectPostItOpen' in moodIo).toBe(false);
    expect('trackPauseReflectShareTap' in moodIo).toBe(false);
    expect('trackPauseReflectWallpaperTap' in moodIo).toBe(false);

    expect('pauseInitialEmotionSelect' in telemetryIo).toBe(false);
    expect('pauseInitialEmotionSkip' in telemetryIo).toBe(false);
    expect('buildFeelTilesMoodLogOptions' in telemetryIo).toBe(false);
    expect('resolvePauseSessionChromeCloseAction' in telemetryIo).toBe(false);
    expect('reflectPauseRepository' in telemetryIo).toBe(false);
  });

  it('mood-io exports stay off session reflect UI PostHog trackers', () => {
    expect(pauseInitialEmotionSelect).not.toBe(trackPauseReflectPostItOpen);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(trackPauseReflectShareTap);
    expect(pauseInitialEmotionSkip).not.toBe(trackPauseReflectWallpaperTap);
    expect(pauseInitialEmotionSkipWithRepository).not.toBe(trackPauseReflectPostItOpen);
    expect(buildFeelTilesMoodLogOptions).not.toBe(trackPauseReflectShareTap);
    expect(resolvePauseSessionChromeCloseAction).not.toBe(trackPauseReflectWallpaperTap);
    expect(applyBriefDepthPickerRitualEntry).not.toBe(trackPauseReflectPostItOpen);
    expect(applyDeepDepthPickerRitualEntry).not.toBe(trackPauseReflectShareTap);
    expect(runDeepPausePickerEntryIfPro).not.toBe(trackPauseReflectWallpaperTap);
    expect(runPauseSessionChromeCloseAction).not.toBe(trackPauseReflectPostItOpen);
    expect(resolvePauseDepthContextLineParams).not.toBe(trackPauseReflectShareTap);
    expect(reflectPauseRepository).not.toBe(trackPauseReflectWallpaperTap);
  });

  it('telemetry-io exports stay off feel-step mood RPC and depth-picker presentation', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseInitialEmotionSelect);
    expect(trackPauseReflectShareTap).not.toBe(pauseInitialEmotionSelectWithRepository);
    expect(trackPauseReflectWallpaperTap).not.toBe(pauseInitialEmotionSkip);
    expect(trackPauseReflectPostItOpen).not.toBe(pauseInitialEmotionSkipWithRepository);
    expect(trackPauseReflectShareTap).not.toBe(buildFeelTilesMoodLogOptions);
    expect(trackPauseReflectWallpaperTap).not.toBe(resolvePauseSessionChromeCloseAction);
    expect(trackPauseReflectPostItOpen).not.toBe(runPauseSessionChromeCloseAction);
    expect(trackPauseReflectShareTap).not.toBe(reflectPauseRepository);
    expect(trackPauseReflectWallpaperTap).not.toBe(pauseInitialEmotionSelect);
  });
});
