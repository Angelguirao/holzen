import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@/i18n';
import '../lapsed-app-mocks';
import { renderShippedApp } from '../render-shipped-app';
import { waitForRouteLoaded } from '../wait-for-route-loaded';
import { PauseEngagementBlocked } from '@/screens/pause/components/PauseEngagementBlocked';

describe('F4 — Lapsed read-only surfaces', () => {
  it('allows /archive when lapsed (no Pro gate)', async () => {
    renderShippedApp({ initialEntries: ['/archive'] });
    await waitFor(
      () => {
        expect(screen.queryByText(/feature locked/i)).not.toBeInTheDocument();
      },
      { timeout: 8000 },
    );
  });

  it('allows /journey when lapsed', async () => {
    renderShippedApp({ initialEntries: ['/journey'] });
    expect(await screen.findByRole('heading', { name: /journey/i })).toBeInTheDocument();
  });

  it('shows reactivation screen instead of ritual when lapsed', () => {
    render(
      <PauseEngagementBlocked
        entitlement="lapsed"
        checkoutLoading={false}
        trialLoading={false}
        onReactivate={vi.fn()}
        onStartTrial={vi.fn()}
      />,
    );
    expect(screen.getByText(/trial ended/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subscribe to continue/i })).toBeInTheDocument();
  });
});
