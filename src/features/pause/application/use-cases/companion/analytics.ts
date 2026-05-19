import { trackEvent } from '@/lib/posthog';
import type { CompanionSlotSource, RegenerateCompanionSlot } from '@/features/pause/domain/companion-orchestrate';
import { companionSlotToGenerationTaxonomy } from './generation-taxonomy';

export { companionSlotToGenerationTaxonomy } from './generation-taxonomy';

/** Fires `companion.served` (PostHog) when a card first renders with real content. */
export function trackCompanionServed(
  slot: RegenerateCompanionSlot,
  source: CompanionSlotSource,
): void {
  try {
    trackEvent('companion.served', {
      companion_type: companionSlotToGenerationTaxonomy(slot),
      source,
      slot,
    });
  } catch {
    /* no-op */
  }
}
