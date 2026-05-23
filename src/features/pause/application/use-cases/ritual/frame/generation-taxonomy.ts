import type { RegenerateCompanionSlot } from '@/features/pause/domain/companion-orchestrate';

/** PostHog `generation.initiated` / `companion.served` companion_type values. */
export const COMPANION_SLOT_GENERATION_TAXONOMY: Record<
  RegenerateCompanionSlot,
  'signal' | 'grounding' | 'history' | 'zoom_out'
> = {
  signal: 'signal',
  grounding: 'grounding',
  history: 'history',
  zoomOut: 'zoom_out',
};

export function companionSlotToGenerationTaxonomy(
  slot: RegenerateCompanionSlot,
): 'signal' | 'grounding' | 'history' | 'zoom_out' {
  return COMPANION_SLOT_GENERATION_TAXONOMY[slot];
}
