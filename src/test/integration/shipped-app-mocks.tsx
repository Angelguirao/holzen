import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { vi } from 'vitest';
import '@/i18n';

const TEST_USER = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'mvp@test.holzen.app',
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
    subscriptionStatus: 'trialing',
    subscriptionEnd: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    trialStart: new Date().toISOString(),
    trialEnd: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    flexCreditsBalance: 0,
    refresh: vi.fn().mockResolvedValue(undefined),
    startCheckout: vi.fn(),
    openPortal: vi.fn(),
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          gte: () => ({
            order: () => ({
              limit: async () => ({ data: [], error: null }),
            }),
          }),
        }),
      }),
    }),
    auth: {
      getSession: async () => ({ data: { session: { user: TEST_USER } }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    functions: { invoke: vi.fn().mockResolvedValue({ data: {}, error: null }) },
  },
}));

vi.mock('@/lib/posthog', () => ({
  trackEvent: vi.fn(),
  initPostHog: vi.fn(),
}));

vi.mock('@/components/FeedbackWidget', () => ({
  FeedbackWidget: () => null,
}));

vi.mock('@/components/AppLayout', () => ({
  AppLayout: () => (
    <div data-testid="app-shell">
      <main>
        <Outlet />
      </main>
    </div>
  ),
}));

vi.mock('@/components/BottomNav', () => ({
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
