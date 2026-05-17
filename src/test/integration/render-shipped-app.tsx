import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { reactRouterFutureFlags } from '@/lib/router-future';

/** App embeds `BrowserRouter`; tests supply `MemoryRouter` — passthrough avoids nested routers. */
vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...mod,
    BrowserRouter: ({ children }: { children: ReactNode }) => children,
  };
});

import App from '@/App';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export type RenderShippedAppOptions = {
  initialEntries?: string[];
  queryClient?: QueryClient;
} & Omit<RenderOptions, 'wrapper'>;

/** RTL harness: real `App` routes with auth/subscription stubs (integration, not E2E). */
export function renderShippedApp({
  initialEntries = ['/'],
  queryClient = createTestQueryClient(),
  ...renderOptions
}: RenderShippedAppOptions = {}) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter future={reactRouterFutureFlags} initialEntries={initialEntries}>
        <Suspense fallback={<div role="status">Loading</div>}>
          <App />
        </Suspense>
      </MemoryRouter>
    </QueryClientProvider>,
    renderOptions,
  );
}

export { createTestQueryClient };
