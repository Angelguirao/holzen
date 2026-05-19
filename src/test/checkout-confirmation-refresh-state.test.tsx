import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, act, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { reactRouterFutureFlags } from '@/lib/router-future';

/**
 * Verifies the wallet-refresh lifecycle in `CheckoutConfirmation` for
 * flex-pack confirmations:
 *
 *   updating  → polled while the wallet hasn't caught up
 *   timeout   → after 45s without the wallet reflecting the purchase
 *   error     → when a user-initiated `sub.refresh()` rejects
 *   idle      → wallet now reflects the purchase (balance >= expected)
 *
 * The dialog is opened on a fresh `?credits=true&pack=flex_pack_s` URL
 * (so the 30-min guard does NOT suppress it). All side-effects
 * (`useSubscription`, supabase invoke, navigation, sonner) are mocked so
 * the test focuses on lifecycle transitions only.
 */

const subState = {
  flexCreditsBalance: 0 as number,
  refresh: vi.fn().mockResolvedValue(undefined) as ReturnType<typeof vi.fn>,
};

const { navigateMock, invokeMock, toastMessageMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  invokeMock: vi.fn().mockResolvedValue({ data: { events: [] }, error: null }),
  toastMessageMock: vi.fn(),
}));

vi.mock('@/hooks/use-subscription', () => ({
  useSubscription: () => ({
    tier: 'free',
    loading: false,
    subscriptionStatus: 'free',
    subscriptionEnd: null,
    trialStart: null,
    trialEnd: null,
    flexCreditsBalance: subState.flexCreditsBalance,
    refresh: subState.refresh,
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

import { CheckoutConfirmation } from '@/features/subscription/presentation/CheckoutConfirmation';

function renderAt(path: string) {
  return render(
    <MemoryRouter future={reactRouterFutureFlags} initialEntries={[path]}>
      <CheckoutConfirmation />
    </MemoryRouter>,
  );
}

describe('CheckoutConfirmation refreshState lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    sessionStorage.clear();
    subState.flexCreditsBalance = 0;
    subState.refresh = vi.fn().mockResolvedValue(undefined);
    navigateMock.mockClear();
    invokeMock.mockClear();
    invokeMock.mockResolvedValue({ data: { events: [] }, error: null });
    toastMessageMock.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('enters "updating" state on first mount when the wallet has not caught up', async () => {
    renderAt('/settings?credits=true&pack=flex_pack_s');

    // The dialog opened.
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    // Two occurrences of "Updating balance…": one in the SummaryRow's
    // pendingHint and one inside the lifecycle banner — confirms the
    // `updating` branch is rendering, distinct from the bare hint.
    await waitFor(() => {
      expect(screen.getAllByText(/Updating balance…/i).length).toBeGreaterThanOrEqual(2);
    });
    // Initial mount-time refresh fires once.
    expect(subState.refresh).toHaveBeenCalledTimes(1);
  });

  it('flips to "timeout" after 45s without the wallet catching up', async () => {
    renderAt('/settings?credits=true&pack=flex_pack_s');

    await screen.findByRole('dialog');

    // Advance past the 45s budget — lifecycle effect should trip to 'timeout'.
    await act(async () => {
      vi.advanceTimersByTime(45_000);
    });

    expect(
      await screen.findByText(/Balance not yet updated\. Credits are recorded server-side\./i),
    ).toBeInTheDocument();
    // "Try again" affordance is now reachable.
    expect(screen.getByRole('button', { name: /Try again/i })).toBeEnabled();
  });

  it('flips to "error" when a user-initiated retry rejects', async () => {
    // First retry rejects so we drive the lifecycle into the explicit error
    // branch (vs. the timer-driven "timeout" branch).
    subState.refresh = vi
      .fn()
      .mockResolvedValueOnce(undefined) // initial mount-time call succeeds
      .mockRejectedValueOnce(new Error('network down')); // user retry fails

    renderAt('/settings?credits=true&pack=flex_pack_s');

    // Get into 'timeout' so the "Try again" button is rendered.
    await act(async () => {
      vi.advanceTimersByTime(45_000);
    });
    const retryBtn = await screen.findByRole('button', { name: /Try again/i });

    await act(async () => {
      fireEvent.click(retryBtn);
    });

    // Error banner replaces the timeout banner with the rejection message.
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/Balance refresh failed/i)).toBeInTheDocument();
    expect(screen.getByText(/network down/i)).toBeInTheDocument();
    // Mount-time call + the user retry.
    expect(subState.refresh).toHaveBeenCalledTimes(2);
  });

  it('returns to "idle" (banner removed) once the server reports the grant as applied', async () => {
    // Make `list-checkout-events` report the grant as applied immediately, so
    // `balanceReflectsPurchase` is true on first render → lifecycle stays idle
    // and the lifecycle banner is suppressed.
    invokeMock.mockResolvedValue({
      data: {
        events: [
          {
            session_id: 'cs_test_idle',
            created: Math.floor(Date.now() / 1000),
            pack_type: 'flex_pack_s',
            expected_credits: 30,
            payment_status: 'paid',
            grant_status: 'applied',
            granted_credits: 30,
          },
        ],
      },
      error: null,
    });

    renderAt('/settings?credits=true&pack=flex_pack_s');

    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    // Wait for the events poll to resolve and flip `grantApplied` → idle.
    await waitFor(() => {
      // None of the lifecycle banner's signature affordances should render
      // when the state is idle. These strings are unique to the banner
      // (timeout / error branches) and to its retry button.
      expect(
        screen.queryByText(/Balance not yet updated\. Credits are recorded server-side\./i),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/Balance refresh failed/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Try again/i })).not.toBeInTheDocument();
    });

    // The lifecycle persistence effect short-circuits on idle, so no
    // refresh-state row should be written for this confirmation.
    expect(localStorage.getItem('holzen_checkout_refresh_state')).toBeNull();
  });
});