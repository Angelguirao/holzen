import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  supabaseReflectGenerator: { port: 'reflectGenerator' },
}));

import {
  buildManualPauseCreateOrReuseParams,
  buildManualPauseMarketContext,
  buildManualPauseOpenParams,
  dismissOpenPauseHome,
  openManualPauseFromHome,
  pauseDismissOpenPauseHomePreview,
  pauseDismissOpenPauseHomePreviewWithRepository,
  pauseHomeManualOpenPorts,
  runOpenManualPauseSilentModeAfterCreate,
  runPersistSilentReflectionStub,
} from '@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-io';
import * as homeReflectIo from '@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-io';
import {
  markPauseManualStartedHomeOnce,
  trackHomePendingPauseBannerPauseOpened,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
} from '@/features/pause/presentation/reflect/telemetry/pause-home-reflect-telemetry-io';
import * as homeReflectTelemetryIo from '@/features/pause/presentation/reflect/telemetry/pause-home-reflect-telemetry-io';

/**
 * Presentation mirror: `presentation/reflect/telemetry/pause-home-reflect-telemetry-home-reflect-io-sibling-parity.test.ts`.
 * Reciprocal inline pins: `pause-home-reflect-telemetry-io-parity.test.ts` (application + presentation).
 */
describe('pause-home-reflect-telemetry-io ↔ pause-home-reflect-io sibling parity (application)', () => {
  it('home-reflect-telemetry-io and home-reflect-io are distinct presentation I/O surfaces', () => {
    expect(typeof trackHomePendingPauseBannerPauseOpened).toBe('function');
    expect(typeof trackPauseOpenDismissed).toBe('function');
    expect(typeof markPauseManualStartedHomeOnce).toBe('function');
    expect(typeof trackManualPauseInstanceCreated).toBe('function');
    expect(typeof trackPauseManualCompleted).toBe('function');

    expect(typeof openManualPauseFromHome).toBe('function');
    expect(typeof dismissOpenPauseHome).toBe('function');
    expect(typeof runOpenManualPauseSilentModeAfterCreate).toBe('function');
    expect(typeof runPersistSilentReflectionStub).toBe('function');
    expect(typeof buildManualPauseOpenParams).toBe('function');
    expect(typeof buildManualPauseCreateOrReuseParams).toBe('function');
    expect(typeof buildManualPauseMarketContext).toBe('function');
    expect(typeof pauseDismissOpenPauseHomePreview).toBe('function');
    expect(typeof pauseDismissOpenPauseHomePreviewWithRepository).toBe('function');
    expect(typeof pauseHomeManualOpenPorts).toBe('object');

    expect('trackHomePendingPauseBannerPauseOpened' in homeReflectIo).toBe(false);
    expect('trackPauseOpenDismissed' in homeReflectIo).toBe(false);
    expect('markPauseManualStartedHomeOnce' in homeReflectIo).toBe(false);
    expect('trackManualPauseInstanceCreated' in homeReflectIo).toBe(false);
    expect('trackPauseManualCompleted' in homeReflectIo).toBe(false);

    expect('openManualPauseFromHome' in homeReflectTelemetryIo).toBe(false);
    expect('dismissOpenPauseHome' in homeReflectTelemetryIo).toBe(false);
    expect('runOpenManualPauseSilentModeAfterCreate' in homeReflectTelemetryIo).toBe(false);
    expect('runPersistSilentReflectionStub' in homeReflectTelemetryIo).toBe(false);
    expect('buildManualPauseOpenParams' in homeReflectTelemetryIo).toBe(false);
    expect('pauseDismissOpenPauseHomePreview' in homeReflectTelemetryIo).toBe(false);
    expect('pauseHomeManualOpenPorts' in homeReflectTelemetryIo).toBe(false);
  });

  it('Home manual-open PostHog I/O stays off RPC/use-case manual-open wrappers', () => {
    expect(trackHomePendingPauseBannerPauseOpened).not.toBe(openManualPauseFromHome);
    expect(trackPauseOpenDismissed).not.toBe(dismissOpenPauseHome);
    expect(markPauseManualStartedHomeOnce).not.toBe(runOpenManualPauseSilentModeAfterCreate);
    expect(trackManualPauseInstanceCreated).not.toBe(runPersistSilentReflectionStub);
    expect(trackPauseManualCompleted).not.toBe(buildManualPauseOpenParams);
    expect(trackHomePendingPauseBannerPauseOpened).not.toBe(pauseDismissOpenPauseHomePreview);
    expect(trackPauseOpenDismissed).not.toBe(pauseDismissOpenPauseHomePreviewWithRepository);
    expect(markPauseManualStartedHomeOnce).not.toBe(pauseHomeManualOpenPorts);
  });

  it('Home manual-open I/O stays off PostHog tracker exports', () => {
    expect(openManualPauseFromHome).not.toBe(trackHomePendingPauseBannerPauseOpened);
    expect(dismissOpenPauseHome).not.toBe(trackPauseOpenDismissed);
    expect(runOpenManualPauseSilentModeAfterCreate).not.toBe(markPauseManualStartedHomeOnce);
    expect(runPersistSilentReflectionStub).not.toBe(trackManualPauseInstanceCreated);
    expect(buildManualPauseCreateOrReuseParams).not.toBe(trackPauseManualCompleted);
    expect(buildManualPauseMarketContext).not.toBe(trackHomePendingPauseBannerPauseOpened);
    expect(pauseDismissOpenPauseHomePreview).not.toBe(trackPauseOpenDismissed);
    expect(pauseHomeManualOpenPorts).not.toBe(trackManualPauseInstanceCreated);
  });
});
