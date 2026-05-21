import type { QueryClient } from '@tanstack/react-query';

/**
 * Lets non-React pause code (RPC wrappers, query invalidation) reach the app
 * TanStack QueryClient. Registered from `HolzenQueryClientRegister` in `App.tsx`
 * via `src/lib/holzen-query-client-ref.ts` shim.
 */
let client: QueryClient | null = null;

export function setHolzenQueryClient(c: QueryClient | null): void {
  client = c;
}

export function getHolzenQueryClient(): QueryClient | null {
  return client;
}
