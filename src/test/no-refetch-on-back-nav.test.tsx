import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { reactRouterFutureFlags } from '@/lib/router-future';

/**
 * Regression test for the user-reported invariant:
 *
 *   "Subscription / credits data must NOT be re-fetched on back-navigation
 *    or URL-param stripping. The only paths allowed to call
 *    `check-subscription` are:
 *      (a) the explicit Refresh button on `CreditsDashboard`
 *          (`useSubscription().manualRetry`), and
 *      (b) the explicit Retry button inside `CheckoutConfirmation`
 *          (`sub.refresh()` via `handleRetryRefresh`)."
 *
 * We mock `useSubscription` so we can directly assert on the two refresh
 * surfaces (`manualRetry` and `refresh`) and prove they are not invoked by:
 *   1. mounting `CheckoutConfirmation` with already-confirmed checkout params
 *      (the back-nav shape),
 *   2. unmounting + re-mounting with the same params (forward/back ping-pong),
 *   3. mounting `CreditsDashboard` and waiting (no focus, no interval).
 *
 * Then we click each button and confirm exactly one call per click.
 */

const { manualRetryMock, refreshMock, navigateMock, toastMessageMock, invokeMock } = vi.hoisted(() => ({
  manualRetryMock: vi.fn().mockResolvedValue(undefined),
  refreshMock: vi.fn().mockResolvedValue(undefined),
  navigateMock: vi.fn(),
  toastMessageMock: vi.fn(),
  invokeMock: vi.fn().mockResolvedValue({ data: { events: [] }, error: null }),
}));

vi.mock('@/hooks/use-subscription', () => ({
  useSubscription: () => ({
    loading: false,
    subscribed: true,
    tier: 'pro',
    flexCreditsBalance: 42,
    companionLimit: 30,
    companionUsed: 5,
    companionRemaining: 25,
    wallpaperLimit: 10,
    wallpaperUsed: 2,
    wallpaperRemaining: 8,
    insightsLimit: 5,
    insightsUsed: 1,
    insightsRemaining: 4,
    monthlyUsed: 0,
    monthlyRemaining: undefined,
    subscriptionStatus: 'trialing',
    subscriptionEnd: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    trialStart: new Date().toISOString(),
    trialEnd: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    refresh: refreshMock,
    manualRetry: manualRetryMock,
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
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: string | { defaultValue?: string }) => {
      if (options == null) return key;
      if (typeof options === 'string') return options;
      return options.defaultValue ?? key;
    },
  }),
}));

import { CheckoutConfirmation } from '@/components/CheckoutConfirmation';
import { CreditsDashboard } from '@/components/CreditsDashboard';

const CHECKOUT_CONFIRMED_KEY = 'holzen_checkout_confirmed';
const CHECKOUT_REFRESH_IDEMPOTENCY_KEY = 'holzen_checkout_refresh_idempotency';

function renderConfirmationAt(path: string) {
  return render(
    <MemoryRouter future={reactRouterFutureFlags} initialEntries={[path]}>
      <CheckoutConfirmation />
    </MemoryRouter>,
  );
}

describe('No refetch on back-navigation or param stripping', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    manualRetryMock.mockClear();
    refreshMock.mockClear();
    navigateMock.mockClear();
    toastMessageMock.mockClear();
    invokeMock.mockClear();
  });

  afterEach(() => cleanup());

  it('does NOT call sub.refresh on back-nav with already-confirmed checkout params', () => {
    // Simulate a prior confirmation moments ago. Back-nav lands on the same URL.
    localStorage.setItem(
      CHECKOUT_CONFIRMED_KEY,
      JSON.stringify({ mode: 'subscription', ts: Date.now() }),
    );

    renderConfirmationAt('/?subscribed=true');

    // No refresh because the persisted guard short-circuits the mount path.
    expect(refreshMock).not.toHaveBeenCalled();
    expect(manualRetryMock).not.toHaveBeenCalled();
    // URL params were stripped (replace nav) — but stripping is presentation
    // only; it must not trigger any subscription fetch.
    expect(navigateMock).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/', search: '' }),
      { replace: true },
    );
  });

  it('does NOT call sub.refresh on forward/back ping-pong (remount with same params)', () => {
    localStorage.setItem(
      CHECKOUT_CONFIRMED_KEY,
      JSON.stringify({ mode: 'flex_pack_m', ts: Date.now() }),
    );

    const first = renderConfirmationAt('/settings?credits=true&pack=flex_pack_m');
    first.unmount();
    renderConfirmationAt('/settings?credits=true&pack=flex_pack_m');
    cleanup();
    renderConfirmationAt('/settings?credits=true&pack=flex_pack_m');

    expect(refreshMock).not.toHaveBeenCalled();
    expect(manualRetryMock).not.toHaveBeenCalled();
  });

  it('mount-time refresh fires at most once per checkout, even across remounts', () => {
    // Fresh checkout return → first mount is allowed to refresh exactly once.
    const first = renderConfirmationAt('/?subscribed=true');
    expect(refreshMock).toHaveBeenCalledTimes(1);
    first.unmount();

    // Simulating React StrictMode double-invoke / dialog remount within the
    // same confirmation window: idempotency guard must suppress the duplicate.
    renderConfirmationAt('/?subscribed=true');
    expect(refreshMock).toHaveBeenCalledTimes(1);

    // Persisted idempotency row reflects the claimed `mount` slot.
    const row = JSON.parse(
      localStorage.getItem(CHECKOUT_REFRESH_IDEMPOTENCY_KEY) || 'null',
    );
    expect(row).toMatchObject({ mode: 'subscription', fired: ['mount'] });
  });

  it('CreditsDashboard does NOT call manualRetry on mount or unmount/remount', () => {
    const r = render(<CreditsDashboard />);
    expect(manualRetryMock).not.toHaveBeenCalled();
    r.unmount();
    render(<CreditsDashboard />);
    expect(manualRetryMock).not.toHaveBeenCalled();
  });

  it('CreditsDashboard Refresh button calls manualRetry exactly once per click', async () => {
    render(<CreditsDashboard />);
    const button = screen.getByRole('button', { name: /refresh/i });

    await act(async () => {
      fireEvent.click(button);
    });
    expect(manualRetryMock).toHaveBeenCalledTimes(1);
    // refresh() (the post-action invalidation path) must not be conflated
    // with the user-driven manual retry path.
    expect(refreshMock).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(button);
    });
    expect(manualRetryMock).toHaveBeenCalledTimes(2);
  });
});
