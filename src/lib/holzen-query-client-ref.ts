/**
 * App-shell shim — implementation in pause infrastructure; re-export via public-queries.
 * @see src/features/pause/infrastructure/holzen-query-client-ref.ts
 */
export {
  getHolzenQueryClient,
  setHolzenQueryClient,
} from '@/features/pause/public-queries';
