import { screen, waitForElementToBeRemoved } from '@testing-library/react';

/** Waits for outer `App` / route `Suspense` fallbacks before asserting on screen content. */
export async function waitForRouteLoaded(timeout = 15_000) {
  const spinners = screen.queryAllByRole('status', { name: /loading/i });
  if (spinners.length === 0) return;
  await waitForElementToBeRemoved(() => screen.queryAllByRole('status', { name: /loading/i }), {
    timeout,
  });
}
