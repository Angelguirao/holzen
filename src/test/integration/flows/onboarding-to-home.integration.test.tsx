import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@/i18n';

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return { ...actual, useReducedMotion: () => true };
});

const startTrialCheckout = vi.fn().mockResolvedValue(undefined);

vi.mock('@/features/subscription/public-hooks', () => ({
  useSubscription: () => ({
    startTrialCheckout,
    ensureTrial: startTrialCheckout,
    trialLoading: false,
    checkoutLoading: false,
    startCheckout: vi.fn(),
  }),
}));

import { OnboardingFlow } from '@/screens/onboarding/components/OnboardingFlow';

describe('F1 — Sign up → onboard → trial', () => {
  beforeEach(() => {
    startTrialCheckout.mockClear();
  });

  it('runs the 4-step flow and opens trial Checkout after saving the draft', async () => {
    const onSaveMotivations = vi.fn().mockResolvedValue(undefined);
    const onSaveDraft = vi.fn().mockResolvedValue(undefined);
    render(
      <QueryClientProvider client={new QueryClient()}>
        <OnboardingFlow
          initialMotivations={[]}
          initialTrackedAssetId="bitcoin"
          initialThreshold={5}
          onSaveMotivations={onSaveMotivations}
          onSaveDraft={onSaveDraft}
          onStartTrial={startTrialCheckout}
          trialLoading={false}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByText('1/4')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Financial freedom/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(onSaveMotivations).toHaveBeenCalledWith(['freedom']);
    });
    expect(await screen.findByText('2/4')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(await screen.findByText('3/4')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(await screen.findByText('4/4')).toBeInTheDocument();
    const trialBtn = await screen.findByRole('button', { name: /free trial/i });
    fireEvent.click(trialBtn);

    await waitFor(() => {
      expect(onSaveDraft).toHaveBeenCalledTimes(1);
      expect(startTrialCheckout).toHaveBeenCalledTimes(1);
    });
    expect(onSaveDraft).toHaveBeenCalledWith({
      trackedAssetId: 'bitcoin',
      threshold: 5,
      thresholdDown: 5,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  });
});
