import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import '../shipped-app-mocks';
import { renderShippedApp } from '../render-shipped-app';

describe('F5 — Archive browse', () => {
  it('loads /archive for signed-in users without a Pro paywall', async () => {
    renderShippedApp({ initialEntries: ['/archive'] });

    await waitFor(
      () => {
        expect(screen.queryByText(/Oops! Page not found/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/feature locked/i)).not.toBeInTheDocument();
      },
      { timeout: 8000 },
    );
    expect(screen.queryByRole('link', { name: /library/i })).not.toBeInTheDocument();
  });
});
