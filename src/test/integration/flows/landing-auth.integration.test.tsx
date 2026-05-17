import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import '../public-app-mocks';
import { renderShippedApp } from '../render-shipped-app';

describe('Public auth route (optional F1 complement)', () => {
  // `/welcome` (Landing) is lazy + animation-heavy; jsdom often trips ErrorBoundary — cover in manual/E2E.

  it('renders /auth without app shell when signed out', async () => {
    renderShippedApp({ initialEntries: ['/auth'] });

    await waitFor(() => {
      expect(screen.queryByTestId('app-shell')).not.toBeInTheDocument();
      expect(screen.queryByText(/Oops! Page not found/i)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });
});
