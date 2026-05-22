import { describe, expect, it } from 'vitest';

import {
  trackPausePendingAdopted as trackAdoptedDirect,
  trackPausePendingDeclined as trackDeclinedDirect,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pending-pause-offer-telemetry';
import {
  trackPausePendingAdopted as trackAdoptedFromTelemetryFlow,
  trackPausePendingDeclined as trackDeclinedFromTelemetryFlow,
  trackPauseSessionAbandoned as trackAbandonedFromTelemetryFlow,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-pending-offer-telemetry-flow';
import { trackPauseSessionAbandoned as trackAbandonedDirect } from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-session-abandoned-telemetry';

import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from './pause-reflect-pending-offer-telemetry-io';

describe('pause-reflect-pending-offer-telemetry-io re-exports', () => {
  it('re-exports pending-offer PostHog helpers from ritual/reflect/pending-offer leaf modules', () => {
    expect(typeof trackPausePendingAdopted).toBe('function');
    expect(typeof trackPausePendingDeclined).toBe('function');
    expect(typeof trackPauseSessionAbandoned).toBe('function');

    expect(trackPausePendingAdopted).toBe(trackAdoptedDirect);
    expect(trackPausePendingDeclined).toBe(trackDeclinedDirect);
    expect(trackPauseSessionAbandoned).toBe(trackAbandonedDirect);
  });

  it('presentation I/O bindings match pause-pending-offer-telemetry-flow CI anchor (leaf parity)', () => {
    expect(trackPausePendingAdopted).toBe(trackAdoptedFromTelemetryFlow);
    expect(trackPausePendingDeclined).toBe(trackDeclinedFromTelemetryFlow);
    expect(trackPauseSessionAbandoned).toBe(trackAbandonedFromTelemetryFlow);
  });
});
