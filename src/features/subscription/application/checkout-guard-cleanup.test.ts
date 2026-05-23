import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  sweepStaleCheckoutGuards,
  scheduleCheckoutGuardCleanup,
  setCheckoutSuppressionWindowMinutes,
  resetCheckoutSuppressionWindow,
} from '@/features/subscription/public';

const CONFIRMED_KEY = 'holzen_checkout_confirmed';
const REFRESH_STATE_KEY = 'holzen_checkout_refresh_state';
const REFRESH_IDEMPOTENCY_KEY = 'holzen_checkout_refresh_idempotency';
const STARTED_KEY = 'holzen_checkout_started_at';

describe('sweepStaleCheckoutGuards', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetCheckoutSuppressionWindow();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps a fresh confirmed-guard row and any siblings pinned to it', () => {
    const ts = Date.now();
    localStorage.setItem(CONFIRMED_KEY, JSON.stringify({ mode: 'subscription', ts }));
    localStorage.setItem(
      REFRESH_STATE_KEY,
      JSON.stringify({ guardTs: ts, mode: 'subscription', state: 'idle' }),
    );
    // Idempotency row was promoted from sessionStorage → localStorage so a
    // sibling tab opening the same checkout-success URL doesn't double-fire
    // the mount-slot `sub.refresh()`. Cleanup must follow it.
    localStorage.setItem(
      REFRESH_IDEMPOTENCY_KEY,
      JSON.stringify({ guardTs: ts, mode: 'subscription', fired: ['mount'] }),
    );
    sessionStorage.setItem(STARTED_KEY, String(ts));

    const report = sweepStaleCheckoutGuards();

    expect(report.removed).toEqual([]);
    expect(localStorage.getItem(CONFIRMED_KEY)).not.toBeNull();
    expect(localStorage.getItem(REFRESH_STATE_KEY)).not.toBeNull();
    expect(localStorage.getItem(REFRESH_IDEMPOTENCY_KEY)).not.toBeNull();
    expect(sessionStorage.getItem(STARTED_KEY)).not.toBeNull();
  });

  it('removes an expired confirmed-guard and cascades cleanup to all pinned siblings', () => {
    const expiredTs = Date.now() - 31 * 60 * 1000; // older than the 30-min default
    localStorage.setItem(CONFIRMED_KEY, JSON.stringify({ mode: 'subscription', ts: expiredTs }));
    localStorage.setItem(
      REFRESH_STATE_KEY,
      JSON.stringify({ guardTs: expiredTs, mode: 'subscription', state: 'idle' }),
    );
    localStorage.setItem(
      REFRESH_IDEMPOTENCY_KEY,
      JSON.stringify({ guardTs: expiredTs, mode: 'subscription', fired: ['mount'] }),
    );
    sessionStorage.setItem(STARTED_KEY, String(expiredTs));

    const report = sweepStaleCheckoutGuards();

    expect(localStorage.getItem(CONFIRMED_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_STATE_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_IDEMPOTENCY_KEY)).toBeNull();
    expect(sessionStorage.getItem(STARTED_KEY)).toBeNull();
    expect(report.removed).toContain(CONFIRMED_KEY);
    expect(report.removed).toContain(REFRESH_STATE_KEY);
    expect(report.removed).toContain(REFRESH_IDEMPOTENCY_KEY);
    expect(report.removed).toContain(STARTED_KEY);
  });

  it('removes orphan refresh-state and idempotency rows when no live guard exists', () => {
    const orphanTs = Date.now();
    localStorage.setItem(
      REFRESH_STATE_KEY,
      JSON.stringify({ guardTs: orphanTs, mode: 'subscription', state: 'idle' }),
    );
    localStorage.setItem(
      REFRESH_IDEMPOTENCY_KEY,
      JSON.stringify({ guardTs: orphanTs, mode: 'subscription', fired: [] }),
    );

    sweepStaleCheckoutGuards();

    expect(localStorage.getItem(REFRESH_STATE_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_IDEMPOTENCY_KEY)).toBeNull();
  });

  it('removes malformed JSON in any guard slot defensively', () => {
    localStorage.setItem(CONFIRMED_KEY, '{not json');
    localStorage.setItem(REFRESH_STATE_KEY, 'also bad');
    localStorage.setItem(REFRESH_IDEMPOTENCY_KEY, 'nope');
    sessionStorage.setItem(STARTED_KEY, 'NaN-ish');

    sweepStaleCheckoutGuards();

    expect(localStorage.getItem(CONFIRMED_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_STATE_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_IDEMPOTENCY_KEY)).toBeNull();
    expect(sessionStorage.getItem(STARTED_KEY)).toBeNull();
  });

  it('respects a custom suppression window when deciding expiry', () => {
    setCheckoutSuppressionWindowMinutes(5);
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    localStorage.setItem(CONFIRMED_KEY, JSON.stringify({ mode: 'subscription', ts: tenMinutesAgo }));
    sessionStorage.setItem(STARTED_KEY, String(tenMinutesAgo));

    sweepStaleCheckoutGuards();

    expect(localStorage.getItem(CONFIRMED_KEY)).toBeNull();
    expect(sessionStorage.getItem(STARTED_KEY)).toBeNull();
  });
});

describe('scheduleCheckoutGuardCleanup', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetCheckoutSuppressionWindow();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs immediately and again on the polling interval', () => {
    const stop = scheduleCheckoutGuardCleanup(1000);

    // First sweep ran on schedule.
    localStorage.setItem(
      CONFIRMED_KEY,
      JSON.stringify({ mode: 'subscription', ts: Date.now() - 60 * 60 * 1000 }),
    );

    vi.advanceTimersByTime(1000);
    expect(localStorage.getItem(CONFIRMED_KEY)).toBeNull();

    stop();

    // After teardown the interval no longer fires.
    localStorage.setItem(
      CONFIRMED_KEY,
      JSON.stringify({ mode: 'subscription', ts: Date.now() - 60 * 60 * 1000 }),
    );
    vi.advanceTimersByTime(5000);
    expect(localStorage.getItem(CONFIRMED_KEY)).not.toBeNull();
  });
});