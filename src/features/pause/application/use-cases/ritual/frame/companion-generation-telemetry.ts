import { trackEvent } from '@/lib/posthog';
import type { CompanionSlotSource, RegenerateCompanionSlot } from '@/features/pause/domain/companion-orchestrate';
import { companionSlotToGenerationTaxonomy } from '@/features/pause/application/use-cases/ritual/frame/generation-taxonomy';
import type { CompanionSlotOrchestrateMode } from './run-companion-slot-orchestrate';

/** PostHog: companion-orchestrate lazy fetch / regenerate started (taxonomy: generation.initiated). */
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

/** PostHog: companion card first renders with real content (taxonomy: companion.served). */
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
