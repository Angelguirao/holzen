import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import '@/i18n';

const navigateMock = vi.fn();
const startTrialCheckoutMock = vi.fn();
const completeOnboardingMock = vi.fn().mockResolvedValue(undefined);
const finishOnboardingAfterActiveTrialMock = vi.fn().mockResolvedValue(undefined);

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('@/features/subscription/public-hooks', () => ({
  useSubscription: () => ({
    startTrialCheckout: startTrialCheckoutMock,
    trialLoading: false,
  }),
}));

vi.mock('@/screens/onboarding/hooks/finish-onboarding-after-active-trial', () => ({
  finishOnboardingAfterActiveTrial: (...args: unknown[]) =>
    finishOnboardingAfterActiveTrialMock(...args),
}));

import { useOnboardingTrialStart } from '@/screens/onboarding/hooks/use-onboarding-trial-start';

describe('useOnboardingTrialStart', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    startTrialCheckoutMock.mockReset();
    completeOnboardingMock.mockClear();
    finishOnboardingAfterActiveTrialMock.mockClear();
  });

  it('finishes onboarding and navigates home when trial is already active', async () => {
    startTrialCheckoutMock.mockResolvedValue('trial_already_active');

    const { result } = renderHook(() =>
      useOnboardingTrialStart({
        trackedAssetId: 'bitcoin',
        threshold: 5,
        completeOnboarding: completeOnboardingMock,
      }),
    );

    await act(async () => {
      await result.current.handleStartTrial();
    });

    await waitFor(() => {
      expect(startTrialCheckoutMock).toHaveBeenCalledWith({ fromOnboarding: true });
      expect(finishOnboardingAfterActiveTrialMock).toHaveBeenCalledTimes(1);
    });

    expect(finishOnboardingAfterActiveTrialMock).toHaveBeenCalledWith(
      expect.objectContaining({
        completeOnboarding: completeOnboardingMock,
        trackedAssetId: 'bitcoin',
        threshold: 5,
        goHome: expect.any(Function),
      }),
    );

    const goHome = finishOnboardingAfterActiveTrialMock.mock.calls[0]?.[0]?.goHome as
      | (() => void)
      | undefined;
    goHome?.();
    expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
  });

  it('does not finish onboarding when checkout redirects to Stripe', async () => {
    startTrialCheckoutMock.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useOnboardingTrialStart({
        trackedAssetId: 'bitcoin',
        threshold: 5,
        completeOnboarding: completeOnboardingMock,
      }),
    );

    await act(async () => {
      await result.current.handleStartTrial();
    });

    expect(finishOnboardingAfterActiveTrialMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
