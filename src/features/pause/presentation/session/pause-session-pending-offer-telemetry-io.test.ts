import { describe, expect, it, vi } from 'vitest';
import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from './pause-session-pending-offer-telemetry-io';

const trackPausePendingAdoptedMock = vi.hoisted(() => vi.fn());
const trackPausePendingDeclinedMock = vi.hoisted(() => vi.fn());
const trackPauseSessionAbandonedMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-pending-offer-telemetry-flow',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-pending-offer-telemetry-flow')
    >();
    return {
      ...actual,
      trackPausePendingAdopted: trackPausePendingAdoptedMock,
      trackPausePendingDeclined: trackPausePendingDeclinedMock,
      trackPauseSessionAbandoned: trackPauseSessionAbandonedMock,
    };
  },
);

describe('pause-session-pending-offer-telemetry-io', () => {
  it('re-exports adopt, decline, and abandoned from pause-pending-offer-telemetry-flow', () => {
    expect(typeof trackPausePendingAdopted).toBe('function');
    expect(typeof trackPausePendingDeclined).toBe('function');
    expect(typeof trackPauseSessionAbandoned).toBe('function');
    expect(trackPausePendingAdopted).toBe(trackPausePendingAdoptedMock);
    expect(trackPausePendingDeclined).toBe(trackPausePendingDeclinedMock);
    expect(trackPauseSessionAbandoned).toBe(trackPauseSessionAbandonedMock);
  });
});
