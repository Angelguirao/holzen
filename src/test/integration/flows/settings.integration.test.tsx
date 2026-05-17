import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import '../shipped-app-mocks';
import { renderShippedApp } from '../render-shipped-app';

describe('F7 — Settings', () => {
  it('registers /settings without 404 or legacy tools links', async () => {
    renderShippedApp({ initialEntries: ['/settings'] });

    await waitFor(
      () => {
        expect(screen.queryByText(/Oops! Page not found/i)).not.toBeInTheDocument();
      },
      { timeout: 8000 },
    );
    expect(screen.queryByRole('link', { name: /^tools$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /badges/i })).not.toBeInTheDocument();
  });
});
