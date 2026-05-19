import { describe, it, expect } from 'vitest';
import { screen, waitForElementToBeRemoved } from '@testing-library/react';
import '../shipped-app-mocks';
import { renderShippedApp } from '../render-shipped-app';

describe('F6 — Journey overview', () => {
  it('renders overview at /journey with Archive CTA', async () => {
    renderShippedApp({ initialEntries: ['/journey'] });

    const spinners = screen.queryAllByRole('status', { name: /loading/i });
    if (spinners.length > 0) {
      await waitForElementToBeRemoved(() => screen.queryAllByRole('status', { name: /loading/i }), {
        timeout: 15_000,
      });
    }

    expect(await screen.findByRole('heading', { name: /journey/i }, { timeout: 15_000 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open your pause library/i })).toHaveAttribute('href', '/archive');
    expect(screen.queryByRole('link', { name: /journey\/stats/i })).not.toBeInTheDocument();
  });
});
