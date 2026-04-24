import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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
 *  - One pause instance id → at most one network call across remounts.
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

  it('resetInterventionIdempotency clears both in-memory + storage so a retry fires exactly one new call', async () => {
    const factory = vi.fn().mockResolvedValue({ ok: true });

    // First call seeds both the sessionStorage marker and the in-memory
    // fallback Set (the implementation always writes to both for resilience).
    await runOnceIntervention('r-1', factory);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(hasInvokedIntervention('r-1')).toBe(true);
    expect(sessionStorage.getItem('holzen.orchestrate.intervention.invoked:r-1')).toBe('1');

    // Reset must clear BOTH layers — otherwise the gate in the call sites
    // (`if (!hasInvokedIntervention) ...`) would still short-circuit and the
    // user's retry tap would silently no-op.
    resetInterventionIdempotency('r-1');
    expect(hasInvokedIntervention('r-1')).toBe(false);
    expect(sessionStorage.getItem('holzen.orchestrate.intervention.invoked:r-1')).toBeNull();

    // Retry: exactly one *new* call (factory total = 2), and the marker is
    // re-armed so further remounts don't double-fire again.
    await runOnceIntervention('r-1', factory);
    expect(factory).toHaveBeenCalledTimes(2);
    expect(hasInvokedIntervention('r-1')).toBe(true);

    for (let i = 0; i < 3; i++) {
      if (!hasInvokedIntervention('r-1')) {
        await runOnceIntervention('r-1', factory);
      }
    }
    expect(factory).toHaveBeenCalledTimes(2);
  });

  /**
   * Reflection IDs are UUIDs minted by Postgres (always lowercase) but they
   * reach the idempotency layer through React Router params, deep links,
   * and copy-pasted admin URLs — any of which can corrupt the case or
   * tack on whitespace. Without normalization these variants would each
   * write to their own sessionStorage slot and the duplicate-call
   * guarantee would silently break across remounts that disagree on
   * spelling. This test pins the canonical form: trim + lowercase.
   */
  it('normalizes pause instance id (trim + case) so equivalent spellings share one idempotency key', async () => {
    const factory = vi.fn().mockResolvedValue({ ok: true });
    const canonical = 'a1b2c3d4-e5f6-7890-abcd-ef0123456789';
    const variants = [
      canonical,
      canonical.toUpperCase(),
      `  ${canonical}  `,
      `\n${canonical.toUpperCase()}\t`,
      canonical.replace(/[a-f]/g, (c) => c.toUpperCase()),
    ];

    // First mount uses the lowercase canonical form.
    await runOnceIntervention(canonical, factory);
    expect(factory).toHaveBeenCalledTimes(1);

    // Every variant must be recognized as already invoked — they all
    // collapse to the same key.
    for (const v of variants) {
      expect(hasInvokedIntervention(v)).toBe(true);
    }

    // Subsequent calls keyed on any variant must NOT re-fire the factory.
    for (const v of variants) {
      if (!hasInvokedIntervention(v)) {
        await runOnceIntervention(v, factory);
      }
    }
    expect(factory).toHaveBeenCalledTimes(1);

    // Only one sessionStorage slot exists — no per-spelling fragmentation.
    expect(sessionStorage.getItem(`holzen.orchestrate.intervention.invoked:${canonical}`)).toBe('1');
    expect(
      sessionStorage.getItem(`holzen.orchestrate.intervention.invoked:${canonical.toUpperCase()}`),
    ).toBeNull();

    // Reset via a dirty variant must also clear the canonical key, proving
    // both write- and read-paths use the same normalized form.
    resetInterventionIdempotency(`  ${canonical.toUpperCase()}  `);
    expect(hasInvokedIntervention(canonical)).toBe(false);
    expect(sessionStorage.getItem(`holzen.orchestrate.intervention.invoked:${canonical}`)).toBeNull();
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

  it('keeps pause instances isolated by id', async () => {
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
      expect.objectContaining({ pause_instance_prefix: 'r-2' }),
    );

    resolveFactory({ ok: true });
    await Promise.all([a, b]);
  });
});

/**
 * Safari ITP / private mode / Lockdown mode can make every `sessionStorage`
 * access throw `SecurityError` (or `QuotaExceededError` when the quota is
 * 0). The idempotency layer must NOT silently lose the marker in that
 * case — otherwise the in-flight Map clears as soon as the promise
 * settles, and a remount immediately after re-fires `companion-orchestrate`
   * for the same pause instance id.
 *
 * We simulate that by replacing `window.sessionStorage` with a stub whose
 * every method throws, then assert the duplicate-call guarantee still
 * holds via the in-memory fallback Set.
 */
describe('orchestrate intervention idempotency — sessionStorage unavailable', () => {
  const realSessionStorage = window.sessionStorage;

  function installThrowingSessionStorage(): void {
    const throwing = {
      getItem: () => {
        throw new DOMException('sessionStorage disabled', 'SecurityError');
      },
      setItem: () => {
        throw new DOMException('sessionStorage disabled', 'SecurityError');
      },
      removeItem: () => {
        throw new DOMException('sessionStorage disabled', 'SecurityError');
      },
      clear: () => {
        throw new DOMException('sessionStorage disabled', 'SecurityError');
      },
      key: () => {
        throw new DOMException('sessionStorage disabled', 'SecurityError');
      },
      get length(): number {
        throw new DOMException('sessionStorage disabled', 'SecurityError');
      },
    };
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: throwing,
    });
  }

  beforeEach(() => {
    installThrowingSessionStorage();
    trackEvent.mockClear();
    // The in-memory Map + Set live inside the module — clear via the
    // public reset hook for the ids we touch in this block.
    resetInterventionIdempotency('safari-ref-1');
    resetInterventionIdempotency('safari-ref-2');
  });

  afterEach(() => {
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: realSessionStorage,
    });
  });

  it('still calls the factory exactly once across remounts when sessionStorage throws', async () => {
    const factory = vi.fn().mockResolvedValue({ ok: true });

    // First mount: real call, sessionStorage write throws internally.
    await runOnceIntervention('safari-ref-1', factory);
    expect(factory).toHaveBeenCalledTimes(1);

    // The marker MUST still report invoked — backed by the in-memory
    // fallback Set since sessionStorage is dead.
    expect(hasInvokedIntervention('safari-ref-1')).toBe(true);

    // Simulate 5 remounts. Each gates on `hasInvokedIntervention` first,
    // exactly like the real call sites do. Without the in-memory fallback
    // the gate would return false here and re-fire the factory.
    for (let i = 0; i < 5; i++) {
      if (!hasInvokedIntervention('safari-ref-1')) {
        await runOnceIntervention('safari-ref-1', factory);
      }
    }

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('emits the memory_fallback skip layer when sessionStorage is unavailable', async () => {
    const factory = vi.fn().mockResolvedValue({ ok: true });
    await runOnceIntervention('safari-ref-1', factory);

    trackEvent.mockClear();
    expect(hasInvokedIntervention('safari-ref-1')).toBe(true);

    expect(trackEvent).toHaveBeenCalledWith(
      'intervention_idempotency_skip',
      expect.objectContaining({ layer: 'memory_fallback' }),
    );
    // It must NOT misreport as `session_storage` — that layer threw.
    expect(trackEvent).not.toHaveBeenCalledWith(
      'intervention_idempotency_skip',
      expect.objectContaining({ layer: 'session_storage' }),
    );
  });

  it('clears the in-memory fallback on factory rejection so retry can re-invoke', async () => {
    const failing = vi.fn().mockRejectedValue(new Error('network down'));

    await expect(runOnceIntervention('safari-ref-1', failing)).rejects.toThrow('network down');
    expect(hasInvokedIntervention('safari-ref-1')).toBe(false);

    const succeeding = vi.fn().mockResolvedValue({ ok: true });
    await runOnceIntervention('safari-ref-1', succeeding);
    expect(succeeding).toHaveBeenCalledTimes(1);
    expect(hasInvokedIntervention('safari-ref-1')).toBe(true);
  });

  it('resetInterventionIdempotency clears the in-memory fallback even when sessionStorage throws', async () => {
    const factory = vi.fn().mockResolvedValue({ ok: true });
    await runOnceIntervention('safari-ref-1', factory);
    expect(hasInvokedIntervention('safari-ref-1')).toBe(true);

    resetInterventionIdempotency('safari-ref-1');
    expect(hasInvokedIntervention('safari-ref-1')).toBe(false);

    await runOnceIntervention('safari-ref-1', factory);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('keeps pause instances isolated by id when using the in-memory fallback', async () => {
    const f1 = vi.fn().mockResolvedValue('a');
    const f2 = vi.fn().mockResolvedValue('b');

    await runOnceIntervention('safari-ref-1', f1);
    expect(hasInvokedIntervention('safari-ref-1')).toBe(true);
    expect(hasInvokedIntervention('safari-ref-2')).toBe(false);

    await runOnceIntervention('safari-ref-2', f2);
    expect(hasInvokedIntervention('safari-ref-2')).toBe(true);

    expect(f1).toHaveBeenCalledTimes(1);
    expect(f2).toHaveBeenCalledTimes(1);
  });
});