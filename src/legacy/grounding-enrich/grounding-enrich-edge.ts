import { invokeEdge } from '@/lib/invoke-edge';

/**
 * Shape returned by the legacy `grounding-enrich` edge function.
 */
export type GroundingEnrichment = {
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
};

export type GroundingEnrichBody = {
  citation: string;
  url?: string | null;
  doi?: string | null;
};

/** @deprecated Edge undeployed — see README in this folder. */
export function invokeGroundingEnrich(body: GroundingEnrichBody, signal?: AbortSignal) {
  return invokeEdge<GroundingEnrichment>('grounding-enrich', { body, signal });
}
