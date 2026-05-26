import type { ReactNode } from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ProfileRow } from '@/features/user/domain/user-profile-row';
import { useProfile } from './use-profile';

const { mockProfileRowRef, updateProfileFieldsMock } = vi.hoisted(() => ({
  mockProfileRowRef: { current: null as ProfileRow | null },
  updateProfileFieldsMock: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock('@/features/auth/public', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
  }),
}));

vi.mock('../public-queries', () => {
  const PROFILE_QUERY_KEY = (userId: string) => ['profile', userId] as const;

  return {
    PROFILE_QUERY_KEY,
    fetchProfileRowForUser: vi.fn(),
    getProfileRowQueryOptions: (userId: string | undefined) => ({
      queryKey: PROFILE_QUERY_KEY(userId ?? 'signed-out'),
      enabled: Boolean(userId),
      queryFn: async () => mockProfileRowRef.current,
      retry: false,
    }),
    fetchProfileLastTriggerAt: vi.fn(),
    updateProfileFields: updateProfileFieldsMock,
  };
});

function buildProfileRow(overrides: Partial<ProfileRow> = {}): ProfileRow {
  return {
    user_id: 'user-1',
    threshold: 5,
    threshold_down: 5,
    cumulative_threshold: 15,
    last_context: null,
    email_notifications: true,
    has_onboarded: false,
    companion_haiku: true,
    companion_grounding: true,
    companion_signal: true,
    companion_zoom_out: true,
    companion_history: true,
    reflection_tone: 'stoic',
    cooldown_hours: 6,
    last_trigger_at: null,
    silent_mode: false,
    custom_prompt: null,
    reflection_style: 'standard',
    quiet_hours_start: null,
    quiet_hours_end: null,
    first_name: 'Ada',
    motivations: [],
    mantra: null,
    hold_goal_currency: 'USD',
    hold_goal_type: null,
    hold_goal_start: null,
    hold_goal_target_months: null,
    hold_goal_target_price: null,
    tracked_asset_id: 'bitcoin',
    language: 'en',
    grounding_activities: [],
    referral_code: null,
    created_at: null,
    snoozed_until: null,
    is_admin: false,
    ...overrides,
  };
}

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useProfile', () => {
  beforeEach(() => {
    mockProfileRowRef.current = buildProfileRow({ has_onboarded: false });
    updateProfileFieldsMock.mockClear().mockImplementation(async (_userId: string, fields: { has_onboarded?: boolean }) => {
      if (fields.has_onboarded === true) {
        mockProfileRowRef.current = buildProfileRow({ has_onboarded: true });
      }
      return { error: null };
    });
  });

  it('uses fetched onboarding state on the first loaded render', async () => {
    const renders: Array<{ profileLoaded: boolean; hasOnboarded: boolean }> = [];

    const { result } = renderHook(() => {
      const value = useProfile();
      renders.push({
        profileLoaded: value.profileLoaded,
        hasOnboarded: value.hasOnboarded,
      });
      return value;
    }, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.profileLoaded).toBe(true);
    });

    const firstLoadedRender = renders.find((entry) => entry.profileLoaded);
    expect(firstLoadedRender).toEqual({
      profileLoaded: true,
      hasOnboarded: false,
    });
    expect(result.current.hasOnboarded).toBe(false);
  });

  it('optimistically flips onboarding complete in the shared query cache', async () => {
    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.profileLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.completeOnboarding();
    });

    expect(updateProfileFieldsMock).toHaveBeenCalledWith('user-1', {
      has_onboarded: true,
    });
    await waitFor(() => {
      expect(result.current.hasOnboarded).toBe(true);
    });
  });
});
