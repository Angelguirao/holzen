/**
 * Cross-cutting TanStack QueryClient registration (app boot ↔ pause RPC invalidation).
 * Re-export from pause `public-queries` — do not import pause infrastructure from app/screens directly.
 */
export {
  getHolzenQueryClient,
  setHolzenQueryClient,
} from '@/features/pause/public-queries';
