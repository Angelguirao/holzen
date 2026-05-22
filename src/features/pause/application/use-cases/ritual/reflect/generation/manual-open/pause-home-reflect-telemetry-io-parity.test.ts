/**
 * Application-layer I/O parity for Home manual-open PostHog telemetry (colocated beside
 * `pause-home-reflect-telemetry-flow.ts`; presentation pins stay colocated beside
 * `presentation/reflect/telemetry/pause-home-reflect-telemetry-io.ts`).
 * Imports `pause-home-reflect-telemetry-flow` CI umbrella for `.toBe` identity pins only —
 * production Home telemetry I/O keeps leaf tracker modules under `manual-open/`.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
  supabaseReflectGenerator: { port: 'reflectGenerator' },
}));

import {
  trackHomePendingPauseBannerPauseOpened as trackBannerOpenedDirect,
  trackPauseOpenDismissed as trackOpenDismissedDirect,
} from './home-pause-actions-telemetry';
import {
  markPauseManualStartedHomeOnce as markManualStartedDirect,
  trackManualPauseInstanceCreated as trackInstanceCreatedDirect,
  trackPauseManualCompleted as trackManualCompletedDirect,
} from './manual-pause-trigger-telemetry';
import {
  markPauseManualStartedHomeOnce,
  trackHomePendingPauseBannerPauseOpened,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
} from './pause-home-reflect-telemetry-flow';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-telemetry-flow';
import {
  dismissOpenPauseHome,
  openManualPauseFromHome,
} from './pause-reflect-generation-manual-open-flow';
import {
  markPauseManualStartedHomeOnce as markManualStartedFromHomeTelemetryIo,
  trackHomePendingPauseBannerPauseOpened as trackBannerOpenedFromHomeTelemetryIo,
  trackManualPauseInstanceCreated as trackInstanceCreatedFromHomeTelemetryIo,
  trackPauseManualCompleted as trackManualCompletedFromHomeTelemetryIo,
  trackPauseOpenDismissed as trackOpenDismissedFromHomeTelemetryIo,
} from '@/features/pause/presentation/reflect/telemetry/pause-home-reflect-telemetry-io';
import {
  dismissOpenPauseHome as dismissFromHomeReflectIo,
  openManualPauseFromHome as openFromHomeReflectIo,
  pauseDismissOpenPauseHomePreview,
  pauseHomeManualOpenPorts,
} from '@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-io';

/**
 * Application mirror: `presentation/reflect/telemetry/pause-home-reflect-telemetry-io-parity.test.ts`.
 */
describe('pause-home-reflect-telemetry-io parity (application)', () => {
  it('presentation I/O Home reflect telemetry matches home-reflect-telemetry-flow CI umbrella', () => {
    expect(trackPauseOpenDismissed).toBe(trackOpenDismissedFromHomeTelemetryIo);
    expect(trackHomePendingPauseBannerPauseOpened).toBe(trackBannerOpenedFromHomeTelemetryIo);
    expect(markPauseManualStartedHomeOnce).toBe(markManualStartedFromHomeTelemetryIo);
    expect(trackManualPauseInstanceCreated).toBe(trackInstanceCreatedFromHomeTelemetryIo);
    expect(trackPauseManualCompleted).toBe(trackManualCompletedFromHomeTelemetryIo);
  });

  it('home-reflect-telemetry-flow CI umbrella composes the same leaf trackers as presentation I/O', () => {
    expect(trackPauseOpenDismissed).toBe(trackOpenDismissedDirect);
    expect(trackHomePendingPauseBannerPauseOpened).toBe(trackBannerOpenedDirect);
    expect(markPauseManualStartedHomeOnce).toBe(markManualStartedDirect);
    expect(trackManualPauseInstanceCreated).toBe(trackInstanceCreatedDirect);
    expect(trackPauseManualCompleted).toBe(trackManualCompletedDirect);
    expect(trackOpenDismissedFromHomeTelemetryIo).toBe(trackOpenDismissedDirect);
    expect(trackBannerOpenedFromHomeTelemetryIo).toBe(trackBannerOpenedDirect);
    expect(markManualStartedFromHomeTelemetryIo).toBe(markManualStartedDirect);
    expect(trackInstanceCreatedFromHomeTelemetryIo).toBe(trackInstanceCreatedDirect);
    expect(trackManualCompletedFromHomeTelemetryIo).toBe(trackManualCompletedDirect);
  });

  it('home-reflect-telemetry-io trackers stay distinct from home-reflect-io manual-open RPC wrappers', () => {
    expect(trackPauseOpenDismissed).not.toBe(openFromHomeReflectIo);
    expect(trackHomePendingPauseBannerPauseOpened).not.toBe(pauseDismissOpenPauseHomePreview);
    expect(markPauseManualStartedHomeOnce).not.toBe(pauseHomeManualOpenPorts);
    expect(trackManualPauseInstanceCreated).not.toBe(openFromHomeReflectIo);
    expect(trackPauseManualCompleted).not.toBe(pauseDismissOpenPauseHomePreview);
    expect(trackOpenDismissedFromHomeTelemetryIo).not.toBe(pauseHomeManualOpenPorts);
    expect(trackBannerOpenedFromHomeTelemetryIo).not.toBe(dismissFromHomeReflectIo);
    // Reciprocal inline pins: `presentation/reflect/telemetry/pause-home-reflect-telemetry-io-parity.test.ts`.
    // Dedicated siblings: `pause-home-reflect-telemetry-flow-reflect-telemetry-flow-sibling-parity.test.ts`;
    // `pause-home-reflect-telemetry-home-reflect-io-sibling-parity.test.ts` (application + presentation).
<<<<<<< HEAD
    // Presentation + application IO sibling: `pause-reflect-telemetry-home-reflect-telemetry-io-sibling-parity.test.ts`.
=======
>>>>>>> aa722d801 (test(pause): extend home-reflect-telemetry-io parity leaf and I/O pins)
  });

  it('home-reflect-telemetry-io trackers stay distinct from manual-open-flow and session reflect UI telemetry-flow', () => {
    expect(trackPauseOpenDismissed).not.toBe(openManualPauseFromHome);
    expect(trackHomePendingPauseBannerPauseOpened).not.toBe(dismissOpenPauseHome);
    expect(markPauseManualStartedHomeOnce).not.toBe(openManualPauseFromHome);
    expect(trackManualPauseInstanceCreated).not.toBe(dismissOpenPauseHome);
    expect(trackPauseManualCompleted).not.toBe(openManualPauseFromHome);
    expect(trackOpenDismissedFromHomeTelemetryIo).not.toBe(dismissOpenPauseHome);
    expect(trackPauseOpenDismissed).not.toBe(trackPauseReflectPostItOpen);
    expect(trackHomePendingPauseBannerPauseOpened).not.toBe(trackPauseReflectShareTap);
    expect(markPauseManualStartedHomeOnce).not.toBe(trackPauseReflectWallpaperTap);
    expect(trackManualPauseInstanceCreated).not.toBe(trackPauseReflectPostItOpen);
    expect(trackPauseManualCompleted).not.toBe(trackPauseReflectShareTap);
    expect(trackOpenDismissedFromHomeTelemetryIo).not.toBe(trackPauseReflectWallpaperTap);
    // Reciprocal inline pins: `pause-home-reflect-telemetry-flow-reflect-telemetry-flow-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `application/.../telemetry/pause-reflect-telemetry-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-telemetry-home-reflect-telemetry-io-sibling-parity.test.ts`
   * (application + presentation).
   */
  it('sibling cluster: session reflect telemetry-io exports stay distinct from Home manual-open telemetry-io', () => {
    expect(trackPauseOpenDismissed).not.toBe(trackPauseReflectPostItOpen);
    expect(trackHomePendingPauseBannerPauseOpened).not.toBe(trackPauseReflectShareTap);
    expect(markPauseManualStartedHomeOnce).not.toBe(trackPauseReflectWallpaperTap);
    expect(trackManualPauseInstanceCreated).not.toBe(trackPauseReflectPostItOpen);
    expect(trackPauseManualCompleted).not.toBe(trackPauseReflectShareTap);
    expect(trackOpenDismissedFromHomeTelemetryIo).not.toBe(trackPauseReflectPostItOpen);
    expect(trackBannerOpenedFromHomeTelemetryIo).not.toBe(trackPauseReflectShareTap);
    expect(markManualStartedFromHomeTelemetryIo).not.toBe(trackPauseReflectWallpaperTap);
  });
});
