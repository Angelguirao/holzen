import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from './pause-reflect-telemetry-io';
import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from './pause-reflect-pending-offer-telemetry-io';

const trackPausePendingAdoptedMock = vi.hoisted(() => vi.fn());
const trackPausePendingDeclinedMock = vi.hoisted(() => vi.fn());
const trackPauseSessionAbandonedMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/telemetry/pending-pause-offer-telemetry',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/reflect/telemetry/pending-pause-offer-telemetry')
    >();
    return {
      ...actual,
      trackPausePendingAdopted: trackPausePendingAdoptedMock,
      trackPausePendingDeclined: trackPausePendingDeclinedMock,
    };
  },
);

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-session-abandoned-telemetry',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-session-abandoned-telemetry')
    >();
    return {
      ...actual,
      trackPauseSessionAbandoned: trackPauseSessionAbandonedMock,
    };
  },
);

describe('pause-reflect-pending-offer-telemetry-io', () => {
  it('re-exports adopt, decline, and abandoned from pending-offer telemetry leaf modules', () => {
    expect(typeof trackPausePendingAdopted).toBe('function');
    expect(typeof trackPausePendingDeclined).toBe('function');
    expect(typeof trackPauseSessionAbandoned).toBe('function');
    expect(trackPausePendingAdopted).toBe(trackPausePendingAdoptedMock);
    expect(trackPausePendingDeclined).toBe(trackPausePendingDeclinedMock);
    expect(trackPauseSessionAbandoned).toBe(trackPauseSessionAbandonedMock);
  });

  it('sibling cluster: session reflect telemetry-io exports stay distinct from pending-offer telemetry-io', () => {
    expect(trackPausePendingAdopted).not.toBe(trackPauseReflectPostItOpen);
    expect(trackPausePendingDeclined).not.toBe(trackPauseReflectShareTap);
    expect(trackPauseSessionAbandoned).not.toBe(trackPauseReflectWallpaperTap);
  });

  it('sibling cluster: pending-offer-io exports stay distinct from pending-offer-telemetry-io', () => {
    expect(trackPausePendingAdopted).not.toBe(pauseAdoptPendingOffer);
    expect(trackPausePendingDeclined).not.toBe(pauseDeclinePendingOffer);
    expect(trackPauseSessionAbandoned).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(trackPausePendingAdopted).not.toBe(getPendingPauseOfferDisplay);
    expect(trackPausePendingDeclined).not.toBe(pauseDeclinePendingOfferWithRepository);
    // Full cross-I/O pins: `pause-reflect-pending-offer-telemetry-io-sibling-parity.test.ts`.
  });
});
