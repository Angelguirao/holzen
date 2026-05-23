import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { reactRouterFutureFlags } from '@/lib/router-future';

/**
 * Regression: subscription/credits must not re-fetch on back-nav or param stripping.
 * Lives in src/test/ so it may import screen components without inverting feature layers.
 */

const { manualRetryMock, refreshMock, navigateMock, toastMessageMock, invokeMock } = vi.hoisted(() => ({
  manualRetryMock: vi.fn().mockResolvedValue(undefined),
  refreshMock: vi.fn().mockResolvedValue(undefined),
  navigateMock: vi.fn(),
  toastMessageMock: vi.fn(),
  invokeMock: vi.fn().mockResolvedValue({ data: { events: [] }, error: null }),
}));

vi.mock('@/features/subscription/public-hooks', () => ({
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

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, options?: string | { defaultValue?: string }) => {
        if (options == null) return key;
        if (typeof options === 'string') return options;
        return options.defaultValue ?? key;
      },
    }),
  };
});

import { CheckoutConfirmation } from '@/features/subscription/presentation/CheckoutConfirmation';
import { CreditsDashboard } from '@/screens/settings/components/CreditsDashboard';

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
    localStorage.setItem(
      CHECKOUT_CONFIRMED_KEY,
      JSON.stringify({ mode: 'subscription', ts: Date.now() }),
    );

    renderConfirmationAt('/?subscribed=true');

    expect(refreshMock).not.toHaveBeenCalled();
    expect(manualRetryMock).not.toHaveBeenCalled();
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
    const first = renderConfirmationAt('/?subscribed=true');
    expect(refreshMock).toHaveBeenCalledTimes(1);
    first.unmount();

    renderConfirmationAt('/?subscribed=true');
    expect(refreshMock).toHaveBeenCalledTimes(1);

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
    expect(refreshMock).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(button);
    });
    expect(manualRetryMock).toHaveBeenCalledTimes(2);
  });
});
