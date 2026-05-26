import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@/i18n';

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return { ...actual, useReducedMotion: () => true };
});

const ensureTrial = vi.fn().mockResolvedValue(undefined);

vi.mock('@/features/subscription/public-hooks', () => ({
  useSubscription: () => ({
    ensureTrial,
    trialLoading: false,
    checkoutLoading: false,
    startCheckout: vi.fn(),
  }),
}));

import { OnboardingFlow } from '@/screens/onboarding/components/OnboardingFlow';

describe('F1 — Sign up → onboard → trial', () => {
  beforeEach(() => {
    ensureTrial.mockClear();
  });

  it('runs the 3-step flow and calls ensureTrial after saving the draft', async () => {
    const onSaveDraft = vi.fn().mockResolvedValue(undefined);
    const onComplete = vi.fn().mockResolvedValue(undefined);
    render(
      <QueryClientProvider client={new QueryClient()}>
        <OnboardingFlow
          initialTrackedAssetId="bitcoin"
          initialThreshold={5}
          onSaveDraft={onSaveDraft}
          onStartTrial={ensureTrial}
          onComplete={onComplete}
          trialLoading={false}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByText('1/3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(await screen.findByText('2/3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(await screen.findByText('3/3')).toBeInTheDocument();
    const trialBtn = await screen.findByRole('button', { name: /free trial/i });
    fireEvent.click(trialBtn);

    await waitFor(() => {
      expect(onSaveDraft).toHaveBeenCalledTimes(1);
      expect(ensureTrial).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
    expect(onSaveDraft).toHaveBeenCalledWith({
      trackedAssetId: 'bitcoin',
      threshold: 5,
      thresholdDown: 5,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  });
});
