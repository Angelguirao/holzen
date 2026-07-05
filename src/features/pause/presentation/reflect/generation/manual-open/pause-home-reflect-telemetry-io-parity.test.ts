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
  trackPauseOpenDismissed as trackOpenDismissedDirect,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/home-pause-actions-telemetry';
import {
  markPauseManualStartedHomeOnce as markManualStartedDirect,
  trackManualPauseInstanceCreated as trackInstanceCreatedDirect,
  trackPauseManualCompleted as trackManualCompletedDirect,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/manual-pause-trigger-telemetry';
import {
  markPauseManualStartedHomeOnce,
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
  trackManualPauseInstanceCreated as trackInstanceCreatedFromHomeTelemetryIo,
  trackPauseManualCompleted as trackManualCompletedFromHomeTelemetryIo,
  trackPauseOpenDismissed as trackOpenDismissedFromHomeTelemetryIo,
} from './pause-home-reflect-telemetry-io';
import * as homeReflectTelemetryIo from './pause-home-reflect-telemetry-io';

describe('pause-home-reflect-telemetry-io parity', () => {
  it('presentation I/O Home reflect telemetry matches home-reflect-telemetry-flow CI umbrella', () => {
    expect(trackPauseOpenDismissed).toBe(trackOpenDismissedFromHomeTelemetryIo);
    expect(markPauseManualStartedHomeOnce).toBe(markManualStartedFromHomeTelemetryIo);
    expect(trackManualPauseInstanceCreated).toBe(trackInstanceCreatedFromHomeTelemetryIo);
    expect(trackPauseManualCompleted).toBe(trackManualCompletedFromHomeTelemetryIo);
  });

  it('home-reflect-telemetry-flow CI umbrella composes the same leaf trackers as presentation I/O', () => {
    expect(trackPauseOpenDismissed).toBe(trackOpenDismissedDirect);
    expect(markPauseManualStartedHomeOnce).toBe(markManualStartedDirect);
    expect(trackManualPauseInstanceCreated).toBe(trackInstanceCreatedDirect);
    expect(trackPauseManualCompleted).toBe(trackManualCompletedDirect);
    expect(trackOpenDismissedFromHomeTelemetryIo).toBe(trackOpenDismissedDirect);
    expect(markManualStartedFromHomeTelemetryIo).toBe(markManualStartedDirect);
    expect(trackInstanceCreatedFromHomeTelemetryIo).toBe(trackInstanceCreatedDirect);
    expect(trackManualCompletedFromHomeTelemetryIo).toBe(trackManualCompletedDirect);
  });

  it('home-pause-actions and manual-pause-trigger leaf trackers stay namespace-separated', () => {
    expect(trackOpenDismissedDirect).not.toBe(markManualStartedDirect);
    expect(trackPauseOpenDismissed).not.toBe(trackManualPauseInstanceCreated);
    expect(trackPauseOpenDismissed).not.toBe(trackPauseManualCompleted);
  });

  it('presentation home-reflect-telemetry-io stays off home-reflect-io manual-open exports', () => {
    expect('openManualPauseFromHome' in homeReflectTelemetryIo).toBe(false);
    expect('dismissOpenPauseHome' in homeReflectTelemetryIo).toBe(false);
    expect('pauseHomeManualOpenPorts' in homeReflectTelemetryIo).toBe(false);
    expect('buildManualPauseOpenParams' in homeReflectTelemetryIo).toBe(false);
    expect('trackPauseOpenDismissed' in homeReflectIo).toBe(false);
    expect('markPauseManualStartedHomeOnce' in homeReflectIo).toBe(false);
    expect('trackManualPauseInstanceCreated' in homeReflectIo).toBe(false);
    expect('trackPauseManualCompleted' in homeReflectIo).toBe(false);
  });

  it('home-reflect-telemetry-io trackers stay distinct from home-reflect-io manual-open RPC wrappers', () => {
    expect(trackPauseOpenDismissed).not.toBe(openFromHomeReflectIo);
    expect(markPauseManualStartedHomeOnce).not.toBe(pauseHomeManualOpenPorts);
    expect(trackManualPauseInstanceCreated).not.toBe(openFromHomeReflectIo);
    expect(trackPauseManualCompleted).not.toBe(pauseDismissOpenPauseHomePreview);
    expect(trackOpenDismissedFromHomeTelemetryIo).not.toBe(pauseHomeManualOpenPorts);
    expect(trackOpenDismissedFromHomeTelemetryIo).not.toBe(dismissFromHomeReflectIo);
  });

  it('home-reflect-telemetry-io trackers stay distinct from manual-open-flow and session reflect UI telemetry-flow', () => {
    expect(trackPauseOpenDismissed).not.toBe(openManualPauseFromHome);
    expect(markPauseManualStartedHomeOnce).not.toBe(openManualPauseFromHome);
    expect(trackManualPauseInstanceCreated).not.toBe(dismissOpenPauseHome);
    expect(trackPauseManualCompleted).not.toBe(openManualPauseFromHome);
    expect(trackOpenDismissedFromHomeTelemetryIo).not.toBe(dismissOpenPauseHome);
    expect(trackPauseOpenDismissed).not.toBe(trackPauseReflectPostItOpen);
    expect(markPauseManualStartedHomeOnce).not.toBe(trackPauseReflectWallpaperTap);
    expect(trackManualPauseInstanceCreated).not.toBe(trackPauseReflectPostItOpen);
    expect(trackPauseManualCompleted).not.toBe(trackPauseReflectShareTap);
    expect(trackOpenDismissedFromHomeTelemetryIo).not.toBe(trackPauseReflectWallpaperTap);
  });

  it('sibling cluster: session reflect telemetry-io exports stay distinct from Home manual-open telemetry-io', () => {
    expect(trackPauseOpenDismissed).not.toBe(trackPauseReflectPostItOpen);
    expect(markPauseManualStartedHomeOnce).not.toBe(trackPauseReflectWallpaperTap);
    expect(trackManualPauseInstanceCreated).not.toBe(trackPauseReflectPostItOpen);
    expect(trackPauseManualCompleted).not.toBe(trackPauseReflectShareTap);
    expect(trackOpenDismissedFromHomeTelemetryIo).not.toBe(trackPauseReflectPostItOpen);
    expect(markManualStartedFromHomeTelemetryIo).not.toBe(trackPauseReflectWallpaperTap);

    expect('trackPauseOpenDismissed' in sessionReflectTelemetryIo).toBe(false);
    expect('markPauseManualStartedHomeOnce' in sessionReflectTelemetryIo).toBe(false);
    expect('trackManualPauseInstanceCreated' in sessionReflectTelemetryIo).toBe(false);
    expect('trackPauseManualCompleted' in sessionReflectTelemetryIo).toBe(false);

    expect('trackPauseReflectPostItOpen' in homeReflectTelemetryIo).toBe(false);
    expect('trackPauseReflectShareTap' in homeReflectTelemetryIo).toBe(false);
    expect('trackPauseReflectWallpaperTap' in homeReflectTelemetryIo).toBe(false);
  });
});
