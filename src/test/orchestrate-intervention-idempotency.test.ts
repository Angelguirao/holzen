import { describe, it, expect, beforeEach, vi } from 'vitest';

// The idempotency module emits PostHog + holzen-console events. Mock both so
// tests don't depend on analytics init and can assert on emitted metrics.
const trackEvent = vi.fn();
vi.mock('@/lib/posthog', () => ({ trackEvent: (...args: unknown[]) => trackEvent(...args) }));
vi.mock('@/lib/holzen-console', () => ({
  holzenLog: { companion: vi.fn() },
}));

import {
  hasInvokedIntervention,
  runOnceIntervention,
  resetInterventionIdempotency,
} from '@/lib/orchestrate-intervention-idempotency';

/**
 * These tests pin down the contract of the per-tab-session idempotency key
 * that wraps `companion-orchestrate` intervention calls:
 *
 *  - One reflectionId → at most one network call across remounts.
 *  - Concurrent callers (StrictMode double-invoke, near-simultaneous
 *    remounts) share a single in-flight Promise.
 *  - The retry affordance (`resetInterventionIdempotency`) clears both
 *    layers so a fresh call goes through.
 *  - A rejected factory clears the marker automatically so users aren't
 *    wedged out of a manual retry.
 */
describe('orchestrate intervention idempotency', () => {
  beforeEach(() => {
    sessionStorage.clear();
    trackEvent.mockClear();
    // Ensure the in-memory single-flight map starts empty between tests.
    resetInterventionIdempotency('r-1');
    resetInterventionIdempotency('r-2');
  });

  it('invokes the factory exactly once across simulated remounts', async () => {
    const factory = vi.fn().mockResolvedValue({ ok: true });

    // First mount: real call.
    await runOnceIntervention('r-1', factory);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(hasInvokedIntervention('r-1')).toBe(true);

    // Subsequent remounts must see the marker and bail BEFORE invoking
    // runOnceIntervention. The hook contract is: callers gate on
    // `hasInvokedIntervention` first; we mirror that here.
    for (let i = 0; i < 5; i++) {
      if (!hasInvokedIntervention('r-1')) {
        await runOnceIntervention('r-1', factory);
      }
    }

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('shares a single in-flight Promise for concurrent callers (StrictMode)', async () => {
    let resolveFactory: (value: { ok: boolean }) => void = () => {};
    const factory = vi.fn(
      () =>
        new Promise<{ ok: boolean }>((resolve) => {
          resolveFactory = resolve;
        }),
    );

    // Two near-simultaneous calls (StrictMode double-invoke / fast remount)
    // before the first promise has settled.
    const a = runOnceIntervention('r-1', factory);
    const b = runOnceIntervention('r-1', factory);

    expect(factory).toHaveBeenCalledTimes(1);

    resolveFactory({ ok: true });
    const [resA, resB] = await Promise.all([a, b]);

    expect(resA).toEqual({ ok: true });
    expect(resB).toEqual({ ok: true });
    expect(factory).toHaveBeenCalledTimes(1);
    expect(hasInvokedIntervention('r-1')).toBe(true);
  });

  it('keeps reflections isolated by id', async () => {
    const factory1 = vi.fn().mockResolvedValue('r1');
    const factory2 = vi.fn().mockResolvedValue('r2');

    await runOnceIntervention('r-1', factory1);
    await runOnceIntervention('r-2', factory2);

    expect(factory1).toHaveBeenCalledTimes(1);
    expect(factory2).toHaveBeenCalledTimes(1);
    expect(hasInvokedIntervention('r-1')).toBe(true);
    expect(hasInvokedIntervention('r-2')).toBe(true);
  });

  it('clears the marker on factory rejection so manual retry can re-invoke', async () => {
    const failing = vi.fn().mockRejectedValue(new Error('network down'));

    await expect(runOnceIntervention('r-1', failing)).rejects.toThrow('network down');
    // Marker must NOT persist after a failure — otherwise the user is
    // wedged out of retrying.
    expect(hasInvokedIntervention('r-1')).toBe(false);

    const succeeding = vi.fn().mockResolvedValue({ ok: true });
    await runOnceIntervention('r-1', succeeding);
    expect(succeeding).toHaveBeenCalledTimes(1);
    expect(hasInvokedIntervention('r-1')).toBe(true);
  });

  it('resetInterventionIdempotency lets the retry path re-invoke after success', async () => {
    const factory = vi.fn().mockResolvedValue({ ok: true });

    await runOnceIntervention('r-1', factory);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(hasInvokedIntervention('r-1')).toBe(true);

    // Simulate the user tapping "Try again" — the retry affordance must
    // explicitly clear both layers before re-invoking.
    resetInterventionIdempotency('r-1');
    expect(hasInvokedIntervention('r-1')).toBe(false);

    await runOnceIntervention('r-1', factory);
    expect(factory).toHaveBeenCalledTimes(2);
    expect(hasInvokedIntervention('r-1')).toBe(true);
  });

  it('reset is a no-op for unknown / empty ids', () => {
    expect(() => resetInterventionIdempotency('')).not.toThrow();
    expect(() => resetInterventionIdempotency('never-seen')).not.toThrow();
    expect(hasInvokedIntervention('')).toBe(false);
  });

  it('emits idempotency + latency metrics', async () => {
    const factory = vi.fn().mockResolvedValue({ ok: true });
    await runOnceIntervention('r-1', factory);

    // First call → exactly one latency event (success).
    const latency = trackEvent.mock.calls.find(
      ([name]) => name === 'intervention_first_call_latency',
    );
    expect(latency?.[1]).toMatchObject({ outcome: 'success' });
    expect(typeof latency?.[1]?.latency_ms).toBe('number');

    // Subsequent gate read → skip event (sessionStorage layer).
    trackEvent.mockClear();
    expect(hasInvokedIntervention('r-1')).toBe(true);
    expect(trackEvent).toHaveBeenCalledWith(
      'intervention_idempotency_skip',
      expect.objectContaining({ layer: 'session_storage' }),
    );
  });

  it('emits a dedup metric when a concurrent caller joins the in-flight Promise', async () => {
    let resolveFactory: (v: { ok: boolean }) => void = () => {};
    const factory = vi.fn(
      () => new Promise<{ ok: boolean }>((r) => { resolveFactory = r; }),
    );

    const a = runOnceIntervention('r-2', factory);
    const b = runOnceIntervention('r-2', factory);

    expect(trackEvent).toHaveBeenCalledWith(
      'intervention_idempotency_dedup',
      expect.objectContaining({ reflection_prefix: 'r-2' }),
    );

    resolveFactory({ ok: true });
    await Promise.all([a, b]);
  });
});