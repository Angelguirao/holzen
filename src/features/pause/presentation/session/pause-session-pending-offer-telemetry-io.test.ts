import { describe, expect, it, vi } from 'vitest';
import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
} from './pause-session-pending-offer-telemetry-io';

const trackPausePendingAdoptedMock = vi.hoisted(() => vi.fn());
const trackPausePendingDeclinedMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/session/pause-session-pending-offer-flow',
  () => ({
    trackPausePendingAdopted: trackPausePendingAdoptedMock,
    trackPausePendingDeclined: trackPausePendingDeclinedMock,
  }),
);

describe('pause-session-pending-offer-telemetry-io', () => {
  it('re-exports pending-offer PostHog helpers from pause-session-pending-offer-flow', () => {
    expect(typeof trackPausePendingAdopted).toBe('function');
    expect(typeof trackPausePendingDeclined).toBe('function');
    expect(trackPausePendingAdopted).toBe(trackPausePendingAdoptedMock);
    expect(trackPausePendingDeclined).toBe(trackPausePendingDeclinedMock);
  });
});
