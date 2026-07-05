import { describe, expect, it, vi } from 'vitest';
import {
  markPauseManualStartedHomeOnce,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
} from './pause-home-reflect-telemetry-io';

const markPauseManualStartedHomeOnceMock = vi.hoisted(() => vi.fn());
const trackManualPauseInstanceCreatedMock = vi.hoisted(() => vi.fn());
const trackPauseManualCompletedMock = vi.hoisted(() => vi.fn());
const trackPauseOpenDismissedMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/home-pause-actions-telemetry',
  () => ({
    trackPauseOpenDismissed: trackPauseOpenDismissedMock,
  }),
);

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/manual-pause-trigger-telemetry',
  () => ({
    markPauseManualStartedHomeOnce: markPauseManualStartedHomeOnceMock,
    trackManualPauseInstanceCreated: trackManualPauseInstanceCreatedMock,
    trackPauseManualCompleted: trackPauseManualCompletedMock,
  }),
);

describe('pause-home-reflect-telemetry-io (reflect/telemetry cluster)', () => {
  it('re-exports Home reflect PostHog helpers from manual-open telemetry leaf modules', () => {
    expect(typeof markPauseManualStartedHomeOnce).toBe('function');
    expect(typeof trackManualPauseInstanceCreated).toBe('function');
    expect(typeof trackPauseManualCompleted).toBe('function');
    expect(typeof trackPauseOpenDismissed).toBe('function');
    expect(markPauseManualStartedHomeOnce).toBe(markPauseManualStartedHomeOnceMock);
    expect(trackManualPauseInstanceCreated).toBe(trackManualPauseInstanceCreatedMock);
    expect(trackPauseManualCompleted).toBe(trackPauseManualCompletedMock);
    expect(trackPauseOpenDismissed).toBe(trackPauseOpenDismissedMock);
  });

  it('routes manual-open started through the manual-trigger telemetry module', () => {
    markPauseManualStartedHomeOnce();
    expect(markPauseManualStartedHomeOnceMock).toHaveBeenCalled();
  });
});
