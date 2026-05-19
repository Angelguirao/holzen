import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { vi } from 'vitest';
import '@/i18n';
import { createIntegrationSupabaseMock } from './integration-supabase-mock';

const TEST_USER = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'pause@test.holzen.app',
};

vi.mock('@/hooks/use-auth', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({
    user: TEST_USER,
    loading: false,
    signOut: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-subscription', () => ({
  useSubscription: () => ({
    tier: 'pro',
    loading: false,
    subscribed: true,
    entitlement: 'trialing',
    canEngagePause: true,
    isLapsed: false,
    subscriptionStatus: 'trialing',
    subscriptionEnd: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    trialStart: new Date().toISOString(),
    trialEnd: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    flexCreditsBalance: 0,
    checkoutLoading: false,
    refresh: vi.fn().mockResolvedValue(undefined),
    startCheckout: vi.fn(),
    startReactivationCheckout: vi.fn(),
    ensureTrial: vi.fn().mockResolvedValue(undefined),
    trialLoading: false,
    openPortal: vi.fn(),
  }),
}));

vi.mock('@/integrations/supabase/client', () => {
  const base = createIntegrationSupabaseMock();
  return {
    supabase: {
      ...base,
      auth: {
        getSession: async () => ({ data: { session: { user: TEST_USER } }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      functions: { invoke: vi.fn().mockResolvedValue({ data: {}, error: null }) },
    },
  };
});

vi.mock('@/lib/posthog', () => ({
  trackEvent: vi.fn(),
  initPostHog: vi.fn(),
}));

vi.mock('@/app/components/FeedbackWidget', () => ({
  FeedbackWidget: () => null,
}));

vi.mock('@/app/components/AppLayout', () => ({
  AppLayout: () => (
    <div data-testid="app-shell">
      <main>
        <Outlet />
      </main>
    </div>
  ),
}));

vi.mock('@/app/components/BottomNav', () => ({
  BottomNav: () => <nav aria-label="Primary" />,
  isPrimaryTabActive: () => false,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: ReactNode }) => children,
  };
});
