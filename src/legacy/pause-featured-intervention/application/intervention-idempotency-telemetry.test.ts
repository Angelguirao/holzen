import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emitInterventionIdempotencyMetric } from './intervention-idempotency-telemetry';

const trackEvent = vi.fn();
const companionLog = vi.fn();

vi.mock('@/lib/posthog', () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

vi.mock('@/lib/holzen-console', () => ({
  holzenLog: { companion: (...args: unknown[]) => companionLog(...args) },
}));

describe('intervention-idempotency-telemetry', () => {
  beforeEach(() => {
    trackEvent.mockClear();
    companionLog.mockClear();
  });

  it('forwards metrics to PostHog and holzen companion console', () => {
    emitInterventionIdempotencyMetric('intervention_idempotency_skip', {
      pause_instance_prefix: 'abc12345',
      layer: 'session_storage',
    });
    expect(trackEvent).toHaveBeenCalledWith('intervention_idempotency_skip', {
      pause_instance_prefix: 'abc12345',
      layer: 'session_storage',
    });
    expect(companionLog).toHaveBeenCalledWith('intervention_idempotency_skip', {
      pause_instance_prefix: 'abc12345',
      layer: 'session_storage',
    });
  });
});
