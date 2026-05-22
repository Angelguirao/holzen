/**
 * Legacy re-export for pause TanStack QueryClient registration.
 * App boot imports `@/features/pause/public-queries` directly (May 2026).
 * Implementation: `@/features/pause/infrastructure/holzen-query-client-ref`.
 */
export {
  getHolzenQueryClient,
  setHolzenQueryClient,
} from '@/features/pause/public-queries';
