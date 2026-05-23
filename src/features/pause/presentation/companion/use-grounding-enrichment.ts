import { useQuery } from '@tanstack/react-query';
import {
  getGroundingEnrichmentQueryOptions,
  type GroundingEnrichment,
  type GroundingEnrichmentInput,
} from '@/features/pause/public-queries';

export type { GroundingEnrichment };

/**
 * Fetch (cached) enrichment data for a grounding citation.
 *
 * The edge function already applies a shared cross-user cache keyed by citation
 * hash — this hook layers TanStack Query on top so multiple mounts of the Full
 * View (e.g. the user navigating back and forth) don't re-invoke the function.
 *
 * Returns `{ data: null, isLoading: false }` when no citation is provided so
 * `<GroundingFullView enrichmentSlot={...} />` can be rendered conditionally
 * without extra guards.
 */
export function useGroundingEnrichment(input: GroundingEnrichmentInput) {
  return useQuery(getGroundingEnrichmentQueryOptions(input));
}
