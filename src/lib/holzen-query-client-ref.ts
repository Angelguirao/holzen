import type { QueryClient } from '@tanstack/react-query';

/**
 * Lets non-React code (e.g. pause RPC wrappers) invalidate TanStack Query caches
 * after mutations. Set from `HolzenQueryClientRegister` in `App.tsx`.
 */
let client: QueryClient | null = null;

export function setHolzenQueryClient(c: QueryClient | null): void {
  client = c;
}

export function getHolzenQueryClient(): QueryClient | null {
  return client;
}
