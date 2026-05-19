import type { ReactNode } from 'react';
import { vi } from 'vitest';
import '@/i18n';

vi.mock('@/hooks/use-auth', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({
    user: null,
    loading: false,
    signOut: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-subscription', () => ({
  useSubscription: () => ({
    loading: false,
    subscribed: false,
    entitlement: 'pre_trial',
    canEngagePause: false,
    isLapsed: false,
    checkoutLoading: false,
    trialLoading: false,
    startCheckout: vi.fn(),
    startReactivationCheckout: vi.fn(),
    ensureTrial: vi.fn(),
    openPortal: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  },
}));

vi.mock('@/lib/posthog', () => ({
  trackEvent: vi.fn(),
  initPostHog: vi.fn(),
}));

vi.mock('@/app/components/FeedbackWidget', () => ({
  FeedbackWidget: () => null,
}));
