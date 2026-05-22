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
import * as telemetryIo from './pause-reflect-telemetry-io';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from './pause-reflect-telemetry-io';

/**
 * Presentation sibling parity: pending-offer-io vs session reflect telemetry-io
 * (colocated beside `pause-reflect-telemetry-io.ts`; distinct from
 * `pause-reflect-pending-offer-telemetry-io-sibling-parity.test.ts` ↔ pending-offer telemetry-io).
 * Application mirror: `application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-session-telemetry-io-sibling-parity.test.ts`.
 */
describe('pause-reflect-pending-offer-io ↔ pause-reflect-telemetry-io sibling parity', () => {
  it('pending-offer-io and session reflect telemetry-io are distinct presentation I/O surfaces', () => {
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

    expect('pauseAdoptPendingOffer' in telemetryIo).toBe(false);
    expect('pauseDeclinePendingOffer' in telemetryIo).toBe(false);
    expect('getPendingPauseOfferDisplay' in telemetryIo).toBe(false);
    expect('reflectPauseRepository' in telemetryIo).toBe(false);
  });

  it('pending-offer-io exports stay off session reflect UI PostHog trackers', () => {
    expect(pauseAdoptPendingOffer).not.toBe(trackPauseReflectPostItOpen);
    expect(pauseDeclinePendingOffer).not.toBe(trackPauseReflectShareTap);
    expect(getPendingPauseOfferDisplay).not.toBe(trackPauseReflectWallpaperTap);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(trackPauseReflectPostItOpen);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(trackPauseReflectShareTap);
    expect(reflectPauseRepository).not.toBe(trackPauseReflectWallpaperTap);
  });

  it('session reflect telemetry-io exports stay off pending-offer adopt/decline RPC and display', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseAdoptPendingOffer);
    expect(trackPauseReflectShareTap).not.toBe(pauseDeclinePendingOffer);
    expect(trackPauseReflectWallpaperTap).not.toBe(getPendingPauseOfferDisplay);
    expect(trackPauseReflectPostItOpen).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(trackPauseReflectShareTap).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(trackPauseReflectWallpaperTap).not.toBe(pauseAdoptPendingOffer);
  });
});
