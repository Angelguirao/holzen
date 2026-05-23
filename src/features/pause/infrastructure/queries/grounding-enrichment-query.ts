import {
  invokeGroundingEnrich,
  type GroundingEnrichment,
  type GroundingEnrichBody,
} from '../edge/grounding-enrich-edge';

export type { GroundingEnrichment };

export interface GroundingEnrichmentInput {
  citation: string | null | undefined;
  url?: string | null;
  doi?: string | null;
}

export const GROUNDING_ENRICHMENT_QUERY_PREFIX = ['grounding-enrichment'] as const;

export const GROUNDING_ENRICHMENT_DISABLED_SEGMENT = 'disabled' as const;

export const GROUNDING_ENRICHMENT_DISABLED_QUERY_KEY = [
  ...GROUNDING_ENRICHMENT_QUERY_PREFIX,
  GROUNDING_ENRICHMENT_DISABLED_SEGMENT,
] as const;

export function groundingEnrichmentQueryKey(
  citation: string,
  doi: string | null | undefined,
  url: string | null | undefined,
) {
  return [...GROUNDING_ENRICHMENT_QUERY_PREFIX, citation, doi ?? null, url ?? null] as const;
}

export async function fetchGroundingEnrichment(
  input: GroundingEnrichmentInput,
  signal?: AbortSignal,
): Promise<GroundingEnrichment | null> {
  const citation = input.citation?.trim() ?? '';
  if (!citation) return null;
  const body: GroundingEnrichBody = {
    citation,
    url: input.url ?? null,
    doi: input.doi ?? null,
  };
  const { data, error } = await invokeGroundingEnrich(body, signal);
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
