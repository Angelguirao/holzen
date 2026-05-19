import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

import { Onboarding } from '@/screens/home/components/Onboarding';

describe('F1 — Sign up → onboard → trial', () => {
  beforeEach(() => {
    ensureTrial.mockClear();
  });

  it('runs the 2-step flow and calls ensureTrial (no checkout redirect)', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    render(<Onboarding onComplete={onComplete} />);

    expect(screen.getByText('1/2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(await screen.findByText('2/2')).toBeInTheDocument();
    const trialBtn = await screen.findByRole('button', { name: /free trial/i });
    fireEvent.click(trialBtn);

    await waitFor(() => {
      expect(ensureTrial).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledTimes(2);
    });
    expect(onComplete.mock.calls[0]?.[1]).toEqual({ setLocalOnboarded: false });
  });
});
