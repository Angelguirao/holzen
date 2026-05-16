import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { reactRouterFutureFlags } from '@/lib/router-future';
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
