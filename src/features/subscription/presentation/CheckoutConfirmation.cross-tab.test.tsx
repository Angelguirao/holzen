import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { reactRouterFutureFlags } from '@/lib/router-future';

/**
 * UI-level cross-tab guard verification.
 *
 * Two scenarios:
 *   1. **Sibling broadcast closes a locally-open dialog.** This tab opened
 *      the celebratory dialog from a fresh checkout. Another tab confirms
 *      the same checkout (or already had); the broadcast handler should
 *      silently close the dialog here.
 *   2. **A second mount with the guard already present skips `sub.refresh()`.**
 *      The detect-mode effect already covers this synchronously, but with
 *      the cross-tab idempotency promotion the second tab's mount-slot is
 *      also blocked even if it raced before reading the local guard.
 */

const { refreshMock, navigateMock, toastMessageMock, invokeMock } = vi.hoisted(() => ({
  refreshMock: vi.fn().mockResolvedValue(undefined),
  navigateMock: vi.fn(),
  toastMessageMock: vi.fn(),
  invokeMock: vi.fn().mockResolvedValue({ data: { events: [] }, error: null }),
}));

vi.mock('@/features/subscription/public-hooks', () => ({
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
  return { ...actual, useNavigate: () => navigateMock };
});

import { CheckoutConfirmation } from '@/features/subscription/presentation/CheckoutConfirmation';

const PING_KEY = 'holzen_checkout_guard_ping';
const CONFIRMED_KEY = 'holzen_checkout_confirmed';
const REFRESH_IDEMPOTENCY_KEY = 'holzen_checkout_refresh_idempotency';

function renderAt(path: string) {
  return render(
    <MemoryRouter future={reactRouterFutureFlags} initialEntries={[path]}>
      <CheckoutConfirmation />
    </MemoryRouter>,
  );
}

describe('CheckoutConfirmation cross-tab sync', () => {
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

  it('closes a locally-open dialog when a sibling tab broadcasts the same confirmation', async () => {
    renderAt('/?subscribed=true');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Simulate a sibling tab posting a fresh confirmation broadcast for the
    // same mode. The handler should fold the local dialog quietly.
    await act(async () => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: PING_KEY,
          newValue: JSON.stringify({
            mode: 'subscription',
            ts: Date.now(),
            source: 'sibling-tab-id',
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Quiet status line surfaced — no praise wording, no extra `sub.refresh`.
    expect(toastMessageMock).toHaveBeenCalled();
    const [copy] = toastMessageMock.mock.calls.at(-1)!;
    expect(String(copy)).toMatch(/another tab/i);
  });

  it('a fresh broadcast pre-claims the mount slot so the local detect-mode effect skips its refresh', async () => {
    // Simulate sibling having just broadcast (and persisted its guard +
    // pre-claimed mount slot in shared localStorage).
    const ts = Date.now();
    localStorage.setItem(
      CONFIRMED_KEY,
      JSON.stringify({ mode: 'subscription', ts }),
    );
    localStorage.setItem(
      REFRESH_IDEMPOTENCY_KEY,
      JSON.stringify({ guardTs: ts, mode: 'subscription', fired: ['mount'] }),
    );

    renderAt('/?subscribed=true');

    // Guard hit — no celebratory dialog, no refresh fired locally.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
