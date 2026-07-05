import { useQuery } from '@tanstack/react-query';
import {
  getGroundingEnrichmentQueryOptions,
  type GroundingEnrichment,
  type GroundingEnrichmentInput,
} from './grounding-enrichment-query';

export type { GroundingEnrichment };

/** @deprecated Edge undeployed — see README in this folder. */
export function useGroundingEnrichment(input: GroundingEnrichmentInput) {
  return useQuery(getGroundingEnrichmentQueryOptions(input));
}
