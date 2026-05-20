import type { CompanionPrefs } from '@/features/pause/domain/companion-card-types';
import type { RegenerateCompanionSlot } from '@/features/pause/domain/companion-orchestrate';
import type { PauseSeverity } from '@/features/pause/application/use-cases/session/location-state';

/** Breathing-room delay before feedback CTAs on companion Full View routes. */
export const COMPANION_FULL_VIEW_BREATHING_ROOM_MS = 8000;

const SEVERITY_ORCHESTRATE_NUMBER: Record<PauseSeverity, number> = {
  mild: 3,
  moderate: 6,
  high: 10,
};

export function pauseSeverityToOrchestrateNumber(severity: PauseSeverity): number {
  return SEVERITY_ORCHESTRATE_NUMBER[severity] ?? 6;
}

/** Force the requested slot on for full-view orchestration (mirrors prior page-local spreads). */
export function companionPrefsForFullViewSlot(
  base: CompanionPrefs,
  slot: RegenerateCompanionSlot,
): CompanionPrefs {
  switch (slot) {
    case 'signal':
      return { ...base, signal: true };
    case 'grounding':
      return { ...base, grounding: true };
    case 'history':
      return { ...base, history: true };
    case 'zoomOut':
      return { ...base, zoomOut: true };
  }
}

/** True when the slot already has payload, is loading, or failed — skip auto-fetch. */
export function isCompanionFullViewSlotSettled(
  slot: RegenerateCompanionSlot,
  fields: {
    signal: unknown;
    signalLoading: boolean;
    signalError: unknown;
    nudge: unknown;
    nudgeLoading: boolean;
    nudgeError: unknown;
    historyInsight: unknown;
    historyLoading: boolean;
    historyError: unknown;
    zoomOut: unknown;
    zoomOutLoading: boolean;
    zoomOutError: unknown;
  },
): boolean {
  switch (slot) {
    case 'signal':
      return Boolean(fields.signal || fields.signalLoading || fields.signalError);
    case 'grounding':
      return Boolean(fields.nudge || fields.nudgeLoading || fields.nudgeError);
    case 'history':
      return Boolean(fields.historyInsight || fields.historyLoading || fields.historyError);
    case 'zoomOut':
      return Boolean(fields.zoomOut || fields.zoomOutLoading || fields.zoomOutError);
  }
}
