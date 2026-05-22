import { describe, expect, it, vi } from 'vitest';
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
});
