import { trackEvent } from '@/lib/posthog';
import type { CompanionSlotSource, RegenerateCompanionSlot } from '@/lib/companion-orchestrate-types';

const SLOT_TO_TAX: Record<RegenerateCompanionSlot, 'signal' | 'grounding' | 'history' | 'zoom_out'> = {
  signal: 'signal',
  grounding: 'grounding',
  history: 'history',
  zoomOut: 'zoom_out',
};

/**
 * Fires `companion.served` (PostHog) when a card first renders with real content.
 * PII-safe: only type, source tier, and slot name.
 */
export function trackCompanionServed(
  slot: RegenerateCompanionSlot,
  source: CompanionSlotSource,
): void {
  try {
    trackEvent('companion.served', {
      companion_type: SLOT_TO_TAX[slot],
      source,
      slot,
    });
  } catch {
    /* no-op */
  }
}
