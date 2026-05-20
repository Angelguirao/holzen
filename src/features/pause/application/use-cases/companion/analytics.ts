import { trackEvent } from '@/lib/posthog';
import type { CompanionSlotSource, RegenerateCompanionSlot } from '@/features/pause/domain/companion-orchestrate';
import { companionSlotToGenerationTaxonomy } from './generation-taxonomy';
import type { CompanionSlotOrchestrateMode } from './run-companion-slot-orchestrate';

export { companionSlotToGenerationTaxonomy } from './generation-taxonomy';

/** Fires `generation.initiated` before `companion-orchestrate` lazy fetch / regenerate. */
export function trackCompanionGenerationInitiated(
  slot: RegenerateCompanionSlot,
  mode: CompanionSlotOrchestrateMode,
): void {
  try {
    trackEvent('generation.initiated', {
      companion_type: companionSlotToGenerationTaxonomy(slot),
      source: mode === 'lazy_fetch' ? 'lazy' : 'regenerate',
    });
  } catch {
    /* no-op */
  }
}

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
