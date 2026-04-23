import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, act, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * E2E-ish lifecycle persistence test for `CheckoutConfirmation`.
 *
 * Scenario covered (the one the user actually files bugs about):
 *
 *   1. User returns from Stripe with a flex-pack URL and the dialog opens.
 *      Wallet hasn't caught up → banner is in `updating`, "+N credits" /
 *      projected balance numbers are computed and shown.
 *   2. User clicks the close (×) button while still `updating` — they did
 *      NOT acknowledge the wallet refresh, they just dismissed the modal.
 *   3. The component fully unmounts. We then re-mount within the same
 *      30-min suppression guard (same `?credits=true&pack=…` URL) to
 *      simulate the "back-nav with checkout params" / "re-trigger from a
 *      surfaced banner" path.
 *   4. The dialog must come back showing the SAME `updating` banner and
 *      the SAME numbers — never reset to `idle`, never regress to a lower
 *      "+N credits" or projected balance, never re-fire `sub.refresh()`
 *      (the per-checkout idempotency guard owns the `mount` slot).
 *
 * All side-effects (`useSubscription`, supabase invoke, navigation, sonner)
 * are mocked so the test focuses on persistence + lifecycle restore.
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

import { CheckoutConfirmation } from '@/components/CheckoutConfirmation';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CheckoutConfirmation />
    </MemoryRouter>,
  );
}

describe('CheckoutConfirmation close + re-open within the same guard', () => {
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

  it('persists banner + numbers across close → unmount → re-trigger within the guard window', async () => {
    // ── 1. First arrival: dialog opens in `updating`. ─────────────────
    const first = renderAt('/settings?credits=true&pack=flex_pack_s');

    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    // The lifecycle banner is rendering (two occurrences of "Updating
    // balance…": SummaryRow's pendingHint + the lifecycle banner).
    await waitFor(() => {
      expect(screen.getAllByText(/Updating balance…/i).length).toBeGreaterThanOrEqual(2);
    });

    // Mount-time `sub.refresh()` fired exactly once.
    expect(subState.refresh).toHaveBeenCalledTimes(1);

    // Capture the projected "+N" credits line so we can assert it doesn't
    // regress on re-open. flex_pack_s = 30 credits via PRICING. The number
    // and the "credits added" label live in sibling spans, so match the
    // delta directly inside the SummaryRow that owns it.
    // The "+N" delta lives in its own span next to a "Credits added" label.
    // We assert the literal "+30" appears at least once on screen — that's
    // unique to this dialog and proves the sticky display value rendered.
    expect(screen.getAllByText('+30').length).toBeGreaterThanOrEqual(1);

    // ── 2. User closes the dialog while still `updating`. ─────────────
    // The Radix DialogClose renders an "×" button with sr-only "Close".
    // Multiple "Close" affordances exist (Radix × in the corner + the
    // explicit footer button). Either path tears the dialog down via the
    // same `setMode(null)` handler — pick the first one for stability.
    const closeBtn = screen.getAllByRole('button', { name: /close/i })[0];
    await act(async () => {
      fireEvent.click(closeBtn);
    });

    // Dialog is gone but persistence row stuck around (state !== 'timeout',
    // state !== 'idle' → the unmount cleanup does NOT wipe it).
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(localStorage.getItem('holzen_checkout_refresh_state')).not.toBeNull();
    const persistedRaw = localStorage.getItem('holzen_checkout_refresh_state')!;
    const persisted = JSON.parse(persistedRaw);
    expect(persisted.state).toBe('updating');
    expect(persisted.mode).toBe('flex_pack_s');
    expect(persisted.stickyCreditsAdded).toBe(30);

    // ── 3. Fully unmount and re-trigger inside the guard window. ──────
    first.unmount();

    // Same URL → `alreadyConfirmed` branch fires, hydrates from persisted
    // row, re-opens the dialog with the same banner.
    renderAt('/settings?credits=true&pack=flex_pack_s');

    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    // ── 4. Banner + numbers must persist; refresh must NOT re-fire. ───
    await waitFor(() => {
      expect(screen.getAllByText(/Updating balance…/i).length).toBeGreaterThanOrEqual(2);
    });
    // Sticky monotonic display value — must not regress to 0 / fallback.
    expect(screen.getAllByText('+30').length).toBeGreaterThanOrEqual(1);
    // No "Try again" button — that only renders in `timeout` / `error`.
    expect(screen.queryByRole('button', { name: /Try again/i })).not.toBeInTheDocument();

    // The mount-time refresh slot for this `(guardTs, mode)` is already
    // claimed → the re-trigger path must NOT fire `sub.refresh()` again.
    expect(subState.refresh).toHaveBeenCalledTimes(1);
  });
});
