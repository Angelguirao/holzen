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

export interface GroundingEnrichmentInput {
  citation: string | null | undefined;
  url?: string | null;
  doi?: string | null;
}

export const GROUNDING_ENRICHMENT_DISABLED_QUERY_KEY = ['grounding-enrichment', 'disabled'] as const;

export function groundingEnrichmentQueryKey(
  citation: string,
  doi: string | null | undefined,
  url: string | null | undefined,
) {
  return ['grounding-enrichment', citation, doi ?? null, url ?? null] as const;
}

export async function fetchGroundingEnrichment(
  input: GroundingEnrichmentInput,
  signal?: AbortSignal,
): Promise<GroundingEnrichment | null> {
  const citation = input.citation?.trim() ?? '';
  if (!citation) return null;
  const { data, error } = await invokeEdge<GroundingEnrichment>('grounding-enrich', {
    body: {
      citation,
      url: input.url ?? null,
      doi: input.doi ?? null,
    },
    signal,
  });
  if (error) throw error;
  return data ?? null;
}

/**
 * TanStack options for `grounding-enrich` (edge already applies a cross-user cache;
 * this layer dedupes within the session).
 */
export function getGroundingEnrichmentQueryOptions(input: GroundingEnrichmentInput) {
  const citation = input.citation?.trim() ?? '';
  const enabled = citation.length > 0;
  return {
    queryKey: enabled
      ? groundingEnrichmentQueryKey(citation, input.doi, input.url)
      : GROUNDING_ENRICHMENT_DISABLED_QUERY_KEY,
    queryFn: ({ signal }: { signal: AbortSignal }) => fetchGroundingEnrichment(input, signal),
    enabled,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  } as const;
}
