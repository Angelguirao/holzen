import { describe, expect, it } from 'vitest';

import {
  trackPauseOpenDismissed as trackOpenDismissedDirect,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/home-pause-actions-telemetry';
import {
  markPauseManualStartedHomeOnce as markManualStartedDirect,
  trackManualPauseInstanceCreated as trackInstanceCreatedDirect,
  trackPauseManualCompleted as trackManualCompletedDirect,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/manual-pause-trigger-telemetry';
import {
  markPauseManualStartedHomeOnce as markManualStartedFromTelemetryFlow,
  trackManualPauseInstanceCreated as trackInstanceCreatedFromTelemetryFlow,
  trackPauseManualCompleted as trackManualCompletedFromTelemetryFlow,
  trackPauseOpenDismissed as trackOpenDismissedFromTelemetryFlow,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/pause-home-reflect-telemetry-flow';

import {
  markPauseManualStartedHomeOnce,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
} from './pause-home-reflect-telemetry-io';

describe('pause-home-reflect-telemetry-io re-exports', () => {
  it('re-exports Home reflect PostHog helpers from manual-open telemetry leaf modules', () => {
    expect(typeof markPauseManualStartedHomeOnce).toBe('function');
    expect(typeof trackManualPauseInstanceCreated).toBe('function');
    expect(typeof trackPauseManualCompleted).toBe('function');
    expect(typeof trackPauseOpenDismissed).toBe('function');

    expect(trackPauseOpenDismissed).toBe(trackOpenDismissedDirect);
    expect(markPauseManualStartedHomeOnce).toBe(markManualStartedDirect);
    expect(trackManualPauseInstanceCreated).toBe(trackInstanceCreatedDirect);
    expect(trackPauseManualCompleted).toBe(trackManualCompletedDirect);
  });

  it('presentation I/O bindings match pause-home-reflect-telemetry-flow CI anchor (leaf parity)', () => {
    expect(trackPauseOpenDismissed).toBe(trackOpenDismissedFromTelemetryFlow);
    expect(markPauseManualStartedHomeOnce).toBe(markManualStartedFromTelemetryFlow);
    expect(trackManualPauseInstanceCreated).toBe(trackInstanceCreatedFromTelemetryFlow);
    expect(trackPauseManualCompleted).toBe(trackManualCompletedFromTelemetryFlow);
  });
});
