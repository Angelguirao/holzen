import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import '../shipped-app-mocks';
import { renderShippedApp } from '../render-shipped-app';

describe('F8 — dead IA routes (404 only)', () => {
  it.each([
    '/tools',
    '/tools/letters',
    '/library',
    '/journey/stats',
    '/journey/badges',
  ])('shows NotFound for %s without redirecting to Archive', async (path) => {
    renderShippedApp({ initialEntries: [path] });

    expect(await screen.findByText('Oops! Page not found')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /archive/i })).not.toBeInTheDocument();
    });
  });
});
