import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * Verifies the persistent guard in `CheckoutConfirmation`: once a checkout
 * outcome has been confirmed, refreshing the page or navigating back with
 * the *same* checkout query params (?subscribed=true / ?credits=true&pack=…)
 * within the 30-minute window must NOT re-open the celebratory dialog and
 * must NOT trigger the underlying sync refresh.
 *
 * We simulate refresh + back-nav by unmounting and re-mounting the component
 * tree with the same `MemoryRouter` initial entry — this is exactly what a
 * real browser refresh / history pop produces from the component's POV
 * (a fresh mount with the original `location.search`).
 */

const { refreshMock, navigateMock, toastMessageMock, invokeMock } = vi.hoisted(() => ({
  refreshMock: vi.fn().mockResolvedValue(undefined),
  navigateMock: vi.fn(),
  toastMessageMock: vi.fn(),
  invokeMock: vi.fn().mockResolvedValue({ data: { events: [] }, error: null }),
}));

vi.mock('@/hooks/use-subscription', () => ({
  useSubscription: () => ({
    tier: 'pro',
    loading: false,
    subscriptionStatus: 'trialing',
    subscriptionEnd: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    trialStart: new Date().toISOString(),
    trialEnd: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    flexCreditsBalance: 0,
    refresh: refreshMock,
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: invokeMock } },
}));

vi.mock('sonner', () => ({
  toast: { message: toastMessageMock, success: vi.fn(), error: vi.fn() },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

import { CheckoutConfirmation } from '@/components/CheckoutConfirmation';

const CHECKOUT_CONFIRMED_KEY = 'holzen_checkout_confirmed';
const CHECKOUT_STARTED_KEY = 'holzen_checkout_started_at';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CheckoutConfirmation />
    </MemoryRouter>,
  );
}

describe('CheckoutConfirmation 30-minute guard', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    refreshMock.mockClear();
    navigateMock.mockClear();
    toastMessageMock.mockClear();
    invokeMock.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('opens the dialog on first arrival and persists the guard', () => {
    renderAt('/?subscribed=true');

    // Dialog content rendered (tier confirmation copy).
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Subscription sync was kicked off on the fresh checkout return.
    expect(refreshMock).toHaveBeenCalledTimes(1);
    // Persistent guard now seeded.
    const stored = JSON.parse(localStorage.getItem(CHECKOUT_CONFIRMED_KEY) || 'null');
    expect(stored).toMatchObject({ mode: 'subscription' });
    expect(typeof stored.ts).toBe('number');
  });

  it('does NOT re-open the dialog on a refresh with the same params', () => {
    // Seed the guard as if a confirmation already happened seconds ago.
    localStorage.setItem(
      CHECKOUT_CONFIRMED_KEY,
      JSON.stringify({ mode: 'subscription', ts: Date.now() }),
    );
    sessionStorage.setItem(CHECKOUT_STARTED_KEY, String(Date.now()));

    renderAt('/?subscribed=true');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // No redundant subscription sync — the persisted outcome is authoritative.
    expect(refreshMock).not.toHaveBeenCalled();
    // The forced-refresh sentinel is cleared so `useSubscription` won't fire
    // an initial `check-subscription` with `{ force: true }` either.
    expect(sessionStorage.getItem(CHECKOUT_STARTED_KEY)).toBeNull();
    // Quiet, non-celebratory status line surfaced exactly once.
    expect(toastMessageMock).toHaveBeenCalledTimes(1);
    // URL params stripped via replace navigation.
    expect(navigateMock).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/', search: '' }),
      { replace: true },
    );
  });

  it('does NOT re-open on simulated back-navigation to the same flex-pack URL', () => {
    localStorage.setItem(
      CHECKOUT_CONFIRMED_KEY,
      JSON.stringify({ mode: 'flex_pack_m', ts: Date.now() }),
    );

    // First "back-nav" mount.
    const first = renderAt('/settings?credits=true&pack=flex_pack_m');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    first.unmount();

    // Second "back-nav" (e.g. forward then back again) — same URL, same window.
    renderAt('/settings?credits=true&pack=flex_pack_m');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    expect(refreshMock).not.toHaveBeenCalled();
    // Toast deduped to one per (mode, search) key — back/forward shouldn't stack.
    // Each fresh mount has its own ref, so we expect one per mount but never
    // multiple within a single mount. Cap at one per render confirms dedup logic.
    expect(toastMessageMock.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it('re-opens once the 30-minute window has elapsed', () => {
    // Guard older than the window.
    localStorage.setItem(
      CHECKOUT_CONFIRMED_KEY,
      JSON.stringify({ mode: 'subscription', ts: Date.now() - 31 * 60 * 1000 }),
    );

    renderAt('/?subscribed=true');

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(refreshMock).toHaveBeenCalledTimes(1);
    // Stale guard replaced with a fresh stamp.
    const stored = JSON.parse(localStorage.getItem(CHECKOUT_CONFIRMED_KEY) || 'null');
    expect(Date.now() - stored.ts).toBeLessThan(5_000);
  });

  describe('30-minute boundary precision', () => {
    const WINDOW_MS = 30 * 60 * 1000;

    it('keeps the dialog suppressed when the guard is 1 second inside the window (1799s old)', () => {
      // 1,799,000 ms ago — just *under* the 30-minute boundary. The guard
      // must still be considered live: no dialog, no sub.refresh().
      const justInside = Date.now() - (WINDOW_MS - 1_000);
      localStorage.setItem(
        CHECKOUT_CONFIRMED_KEY,
        JSON.stringify({ mode: 'subscription', ts: justInside }),
      );
      sessionStorage.setItem(CHECKOUT_STARTED_KEY, String(justInside));

      renderAt('/?subscribed=true');

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(refreshMock).not.toHaveBeenCalled();
      // Original timestamp preserved — the window keeps counting from it.
      const stored = JSON.parse(localStorage.getItem(CHECKOUT_CONFIRMED_KEY) || 'null');
      expect(stored.ts).toBe(justInside);
    });

    it('re-opens the dialog when the guard is 1 second past the window (1801s old)', () => {
      // 1,801,000 ms ago — just *over* the boundary. The guard must be
      // treated as expired: dialog re-opens, sub.refresh() fires, and the
      // stale timestamp is replaced with a fresh stamp.
      const justOutside = Date.now() - (WINDOW_MS + 1_000);
      localStorage.setItem(
        CHECKOUT_CONFIRMED_KEY,
        JSON.stringify({ mode: 'subscription', ts: justOutside }),
      );

      renderAt('/?subscribed=true');

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(refreshMock).toHaveBeenCalledTimes(1);
      const stored = JSON.parse(localStorage.getItem(CHECKOUT_CONFIRMED_KEY) || 'null');
      // Fresh stamp, not the stale one.
      expect(stored.ts).not.toBe(justOutside);
      expect(Date.now() - stored.ts).toBeLessThan(5_000);
    });

    it('treats a guard exactly at the boundary (ts === now - WINDOW_MS) as still live', () => {
      // Exactly on the boundary. Implementation uses `now - ts > windowMs`
      // (strict greater-than), so equality counts as inside the window.
      // Locking this in prevents a future off-by-one regression that would
      // re-open the dialog on the tick the window closes.
      const onBoundary = Date.now() - WINDOW_MS;
      localStorage.setItem(
        CHECKOUT_CONFIRMED_KEY,
        JSON.stringify({ mode: 'subscription', ts: onBoundary }),
      );

      renderAt('/?subscribed=true');

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(refreshMock).not.toHaveBeenCalled();
      const stored = JSON.parse(localStorage.getItem(CHECKOUT_CONFIRMED_KEY) || 'null');
      expect(stored.ts).toBe(onBoundary);
    });
  });

  it('skips BOTH dialog and subscription sync when returning within the 30-minute window', () => {
    // Simulate a confirmation that happened 5 minutes ago — well within the
    // 30-minute guard window. The user navigates back to the confirmation
    // route (e.g. via browser back, deep link, or shared URL) with the
    // original ?subscribed=true params still present.
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    localStorage.setItem(
      CHECKOUT_CONFIRMED_KEY,
      JSON.stringify({ mode: 'subscription', ts: fiveMinutesAgo }),
    );
    sessionStorage.setItem(CHECKOUT_STARTED_KEY, String(fiveMinutesAgo));

    renderAt('/?subscribed=true');

    // 1. Celebratory dialog must NOT re-open.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // 2. Subscription sync (`check-subscription` via sub.refresh) must be skipped.
    expect(refreshMock).not.toHaveBeenCalled();
    // 3. The forced-refresh sentinel is cleared so the next `useSubscription`
    //    initial fetch will not be promoted to `{ force: true }` either.
    expect(sessionStorage.getItem(CHECKOUT_STARTED_KEY)).toBeNull();
    // 4. Persisted guard timestamp is preserved (not overwritten on revisit),
    //    so the window keeps counting from the original confirmation.
    const stored = JSON.parse(localStorage.getItem(CHECKOUT_CONFIRMED_KEY) || 'null');
    expect(stored.ts).toBe(fiveMinutesAgo);
    expect(stored.mode).toBe('subscription');
    // 5. URL params stripped via replace nav (cosmetic only, no fetch).
    expect(navigateMock).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/', search: '' }),
      { replace: true },
    );
  });
});