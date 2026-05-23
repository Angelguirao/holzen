/**
 * Presentation I/O parity for Home manual-open PostHog trackers (colocated beside
 * `pause-home-reflect-telemetry-io.ts`; application `pause-home-reflect-telemetry-flow` stays CI umbrella).
 * Application mirror: `application/use-cases/ritual/reflect/telemetry/pause-home-reflect-telemetry-io-parity.test.ts`.
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
} from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/home-pause-actions-telemetry';
import {
  markPauseManualStartedHomeOnce as markManualStartedDirect,
  trackManualPauseInstanceCreated as trackInstanceCreatedDirect,
  trackPauseManualCompleted as trackManualCompletedDirect,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/manual-pause-trigger-telemetry';
import {
  markPauseManualStartedHomeOnce,
  trackHomePendingPauseBannerPauseOpened,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/pause-home-reflect-telemetry-flow';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-telemetry-flow';
import {
  dismissOpenPauseHome,
  openManualPauseFromHome,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/pause-reflect-generation-manual-open-flow';
import {
  dismissOpenPauseHome as dismissFromHomeReflectIo,
  openManualPauseFromHome as openFromHomeReflectIo,
  pauseDismissOpenPauseHomePreview,
  pauseHomeManualOpenPorts,
} from '@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-io';
import * as homeReflectIo from '@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-io';
import * as sessionReflectTelemetryIo from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import {
  markPauseManualStartedHomeOnce as markManualStartedFromHomeTelemetryIo,
  trackHomePendingPauseBannerPauseOpened as trackBannerOpenedFromHomeTelemetryIo,
  trackManualPauseInstanceCreated as trackInstanceCreatedFromHomeTelemetryIo,
  trackPauseManualCompleted as trackManualCompletedFromHomeTelemetryIo,
  trackPauseOpenDismissed as trackOpenDismissedFromHomeTelemetryIo,
} from './pause-home-reflect-telemetry-io';
import * as homeReflectTelemetryIo from './pause-home-reflect-telemetry-io';

describe('pause-home-reflect-telemetry-io parity', () => {
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

  it('home-pause-actions and manual-pause-trigger leaf trackers stay namespace-separated', () => {
    expect(trackOpenDismissedDirect).not.toBe(markManualStartedDirect);
    expect(trackBannerOpenedDirect).not.toBe(trackInstanceCreatedDirect);
    expect(trackPauseOpenDismissed).not.toBe(trackManualPauseInstanceCreated);
    expect(trackHomePendingPauseBannerPauseOpened).not.toBe(trackPauseManualCompleted);
  });

  it('presentation home-reflect-telemetry-io stays off home-reflect-io manual-open exports', () => {
    expect('openManualPauseFromHome' in homeReflectTelemetryIo).toBe(false);
    expect('dismissOpenPauseHome' in homeReflectTelemetryIo).toBe(false);
    expect('pauseHomeManualOpenPorts' in homeReflectTelemetryIo).toBe(false);
    expect('buildManualPauseOpenParams' in homeReflectTelemetryIo).toBe(false);
    expect('trackPauseOpenDismissed' in homeReflectIo).toBe(false);
    expect('trackHomePendingPauseBannerPauseOpened' in homeReflectIo).toBe(false);
    expect('markPauseManualStartedHomeOnce' in homeReflectIo).toBe(false);
    expect('trackManualPauseInstanceCreated' in homeReflectIo).toBe(false);
    expect('trackPauseManualCompleted' in homeReflectIo).toBe(false);
    // Reciprocal inline pins: `application/.../telemetry/pause-home-reflect-telemetry-io-parity.test.ts`.
  });

  it('home-reflect-telemetry-io trackers stay distinct from home-reflect-io manual-open RPC wrappers', () => {
    expect(trackPauseOpenDismissed).not.toBe(openFromHomeReflectIo);
    expect(trackHomePendingPauseBannerPauseOpened).not.toBe(pauseDismissOpenPauseHomePreview);
    expect(markPauseManualStartedHomeOnce).not.toBe(pauseHomeManualOpenPorts);
    expect(trackManualPauseInstanceCreated).not.toBe(openFromHomeReflectIo);
    expect(trackPauseManualCompleted).not.toBe(pauseDismissOpenPauseHomePreview);
    expect(trackOpenDismissedFromHomeTelemetryIo).not.toBe(pauseHomeManualOpenPorts);
    expect(trackBannerOpenedFromHomeTelemetryIo).not.toBe(dismissFromHomeReflectIo);
    // Reciprocal inline pins: `application/.../manual-open/pause-home-reflect-telemetry-io-parity.test.ts`.
    // Dedicated siblings: `pause-home-reflect-telemetry-flow-reflect-telemetry-flow-sibling-parity.test.ts`;
    // `pause-home-reflect-telemetry-home-reflect-io-sibling-parity.test.ts` (application + presentation).
    // Presentation sibling: `presentation/reflect/telemetry/pause-reflect-telemetry-home-reflect-telemetry-io-sibling-parity.test.ts`.
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

    expect('trackPauseOpenDismissed' in sessionReflectTelemetryIo).toBe(false);
    expect('trackHomePendingPauseBannerPauseOpened' in sessionReflectTelemetryIo).toBe(false);
    expect('markPauseManualStartedHomeOnce' in sessionReflectTelemetryIo).toBe(false);
    expect('trackManualPauseInstanceCreated' in sessionReflectTelemetryIo).toBe(false);
    expect('trackPauseManualCompleted' in sessionReflectTelemetryIo).toBe(false);

    expect('trackPauseReflectPostItOpen' in homeReflectTelemetryIo).toBe(false);
    expect('trackPauseReflectShareTap' in homeReflectTelemetryIo).toBe(false);
    expect('trackPauseReflectWallpaperTap' in homeReflectTelemetryIo).toBe(false);
    // Reciprocal inline pins: `application/.../manual-open/pause-home-reflect-io-parity.test.ts`,
    // `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
    // Dedicated sibling: `pause-reflect-telemetry-home-reflect-telemetry-io-sibling-parity.test.ts`.
  });
});
