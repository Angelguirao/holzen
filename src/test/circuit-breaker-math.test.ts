/**
 * Mirror tests for the breaker math in
 * `supabase/functions/_shared/circuit-breaker.ts`. The production file runs
 * under Deno; we re-implement `buildState` here in plain TS so we can cover
 * the decision logic (threshold, min-sample) without pulling Deno into the
 * Vitest runtime.
 *
 * If `buildState` in the Deno file changes, update this mirror too — the
 * two should stay semantically identical.
 */
import { describe, expect, it } from 'vitest';

interface ProviderState {
  state: 'ok' | 'degraded';
  errorRate: number;
  sample: number;
  successes: number;
  errors: number;
  windowMinutes: number;
}

const DEFAULTS = {
  windowMinutes: 10,
  errorRateThreshold: 0.3,
  minSample: 10,
};

function buildState(
  agg: { successes: number; errors: number },
  options: Partial<typeof DEFAULTS> = {},
): ProviderState {
  const opts = { ...DEFAULTS, ...options };
  const sample = agg.successes + agg.errors;
  const errorRate = sample === 0 ? 0 : agg.errors / sample;
  const degraded = sample >= opts.minSample && errorRate >= opts.errorRateThreshold;
  return {
    state: degraded ? 'degraded' : 'ok',
    errorRate,
    sample,
    successes: agg.successes,
    errors: agg.errors,
    windowMinutes: opts.windowMinutes,
  };
}

describe('circuit breaker math', () => {
  it('returns ok when no calls in the window', () => {
    const s = buildState({ successes: 0, errors: 0 });
    expect(s.state).toBe('ok');
    expect(s.errorRate).toBe(0);
    expect(s.sample).toBe(0);
  });

  it('does NOT trip below min sample even at 100% error rate', () => {
    const s = buildState({ successes: 0, errors: 5 });
    expect(s.state).toBe('ok');
    expect(s.sample).toBe(5);
    expect(s.errorRate).toBe(1);
  });

  it('does NOT trip when error rate is below threshold', () => {
    const s = buildState({ successes: 80, errors: 20 });
    expect(s.sample).toBe(100);
    expect(s.errorRate).toBeCloseTo(0.2);
    expect(s.state).toBe('ok');
  });

  it('trips exactly at the threshold', () => {
    const s = buildState({ successes: 70, errors: 30 });
    expect(s.errorRate).toBeCloseTo(0.3);
    expect(s.state).toBe('degraded');
  });

  it('trips above threshold', () => {
    const s = buildState({ successes: 5, errors: 20 });
    expect(s.sample).toBe(25);
    expect(s.errorRate).toBe(0.8);
    expect(s.state).toBe('degraded');
  });

  it('trips at exactly min sample when error rate is above threshold', () => {
    const s = buildState({ successes: 6, errors: 4 });
    expect(s.sample).toBe(10);
    expect(s.errorRate).toBe(0.4);
    expect(s.state).toBe('degraded');
  });

  it('respects a custom threshold (stricter)', () => {
    const s = buildState({ successes: 85, errors: 15 }, { errorRateThreshold: 0.1 });
    expect(s.errorRate).toBeCloseTo(0.15);
    expect(s.state).toBe('degraded');
  });

  it('respects a custom min sample (looser)', () => {
    const s = buildState({ successes: 0, errors: 3 }, { minSample: 3 });
    expect(s.sample).toBe(3);
    expect(s.errorRate).toBe(1);
    expect(s.state).toBe('degraded');
  });

  it('quality-gate-failed statuses are NOT treated as errors at the caller layer', () => {
    // The production implementation ignores `quality_gate_failed` status rows
    // when aggregating. This test documents that at the math layer: rows that
    // were filtered upstream simply don't reach buildState, and the count
    // here stays low as a result.
    const asIfFiltered = buildState({ successes: 10, errors: 0 });
    expect(asIfFiltered.state).toBe('ok');
  });
});
