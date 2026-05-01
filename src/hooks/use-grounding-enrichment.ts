import { useQuery } from '@tanstack/react-query';
import { invokeEdge } from '@/lib/invoke-edge';

/**
 * Shape returned by the `grounding-enrich` edge function. All fields are
 * nullable / possibly-empty so the UI can degrade gracefully when upstream
 * providers (Crossref, Semantic Scholar, Gemini) fail — we never block the
 * page waiting on them.
 */
export interface GroundingEnrichment {
  citation_hash: string;
  doi: string | null;
  url: string | null;
  abstract: string | null;
  researchers: Array<{ name: string; bio: string }>;
  citation_count: number | null;
  source_provenance: {
    abstract_source?: string | null;
    bio_source?: string | null;
    citation_count_source?: string | null;
  };
  cached: boolean;
}

interface EnrichmentInput {
  citation: string | null | undefined;
  url?: string | null;
  doi?: string | null;
}

async function fetchEnrichment(input: Required<Pick<EnrichmentInput, 'citation'>> & EnrichmentInput): Promise<GroundingEnrichment | null> {
  const { data, error } = await invokeEdge<GroundingEnrichment>('grounding-enrich', {
    body: {
      citation: input.citation,
      url: input.url ?? null,
      doi: input.doi ?? null,
    },
  });
  if (error) throw error;
  return data ?? null;
}

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
export function useGroundingEnrichment(input: EnrichmentInput) {
  const citation = input.citation?.trim() ?? '';
  const enabled = citation.length > 0;

  return useQuery({
    queryKey: ['grounding-enrichment', citation, input.doi ?? null, input.url ?? null],
    enabled,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    queryFn: () => fetchEnrichment({ citation, url: input.url, doi: input.doi }),
  });
}
