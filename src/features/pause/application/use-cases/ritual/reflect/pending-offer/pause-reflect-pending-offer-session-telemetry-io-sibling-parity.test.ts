import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import * as pendingOfferIo from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
  reflectPauseRepository,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import * as sessionReflectTelemetryFlow from '../telemetry/pause-reflect-telemetry-flow';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from '../telemetry/pause-reflect-telemetry-flow';

/**
 * Application sibling parity: pending-offer-io vs session reflect telemetry-flow
 * (parity with presentation
 * `pause-reflect-pending-offer-session-telemetry-io-sibling-parity.test.ts`; distinct from
 * `pause-reflect-pending-offer-telemetry-io-sibling-parity.test.ts` ↔ pending-offer telemetry-io).
 * Reciprocal inline pins: `pause-reflect-pending-offer-io-parity.test.ts` ↔
 * `application/.../telemetry/pause-reflect-telemetry-io-parity.test.ts`.
 */
describe('pause-reflect-pending-offer-io ↔ pause-reflect-telemetry-flow session sibling parity (application)', () => {
  it('pending-offer-io and session reflect telemetry-flow are distinct surfaces', () => {
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
    expect(typeof pauseAdoptPendingOffer).toBe('function');
    expect(typeof pauseDeclinePendingOffer).toBe('function');
    expect(typeof pauseAdoptPendingOfferWithRepository).toBe('function');
    expect(typeof pauseDeclinePendingOfferWithRepository).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');
    const surface: PauseReflectTelemetrySurface = 'pause_reflect';
    expect(surface).toBe('pause_reflect');

    expect('trackPauseReflectPostItOpen' in pendingOfferIo).toBe(false);
    expect('trackPauseReflectShareTap' in pendingOfferIo).toBe(false);
    expect('trackPauseReflectWallpaperTap' in pendingOfferIo).toBe(false);
    expect('PauseReflectTelemetrySurface' in pendingOfferIo).toBe(false);

    expect('pauseAdoptPendingOffer' in sessionReflectTelemetryFlow).toBe(false);
    expect('pauseDeclinePendingOffer' in sessionReflectTelemetryFlow).toBe(false);
    expect('getPendingPauseOfferDisplay' in sessionReflectTelemetryFlow).toBe(false);
    expect('reflectPauseRepository' in sessionReflectTelemetryFlow).toBe(false);
  });

  it('pending-offer-io exports stay off session reflect UI PostHog trackers', () => {
    expect(pauseAdoptPendingOffer).not.toBe(trackPauseReflectPostItOpen);
    expect(pauseDeclinePendingOffer).not.toBe(trackPauseReflectShareTap);
    expect(getPendingPauseOfferDisplay).not.toBe(trackPauseReflectWallpaperTap);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(trackPauseReflectPostItOpen);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(trackPauseReflectShareTap);
    expect(reflectPauseRepository).not.toBe(trackPauseReflectWallpaperTap);
  });

  it('session reflect telemetry-flow exports stay off pending-offer adopt/decline RPC and display', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseAdoptPendingOffer);
    expect(trackPauseReflectShareTap).not.toBe(pauseDeclinePendingOffer);
    expect(trackPauseReflectWallpaperTap).not.toBe(getPendingPauseOfferDisplay);
    expect(trackPauseReflectPostItOpen).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(trackPauseReflectShareTap).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(trackPauseReflectWallpaperTap).not.toBe(pauseAdoptPendingOffer);
  });
});
