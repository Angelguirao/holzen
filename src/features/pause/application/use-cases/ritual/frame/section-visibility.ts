import type { CompanionData, CompanionPrefs } from '@/features/pause/domain/companion-card-types';

export type CompanionSectionVisibility = {
  hasHaiku: boolean;
  hasGrounding: boolean;
  hasSignal: boolean;
  hasZoomOut: boolean;
  hasHistory: boolean;
};

/** Which inline companion cards render in `CompanionSection` (intervention runs via data hook either way). */
export function getCompanionSectionVisibility(
  prefs: CompanionPrefs,
  companions: CompanionData,
  pauseInstanceId: string | null | undefined,
): CompanionSectionVisibility {
  return {
    hasHaiku: Boolean(prefs.haiku && companions.haiku),
    hasGrounding: prefs.grounding,
    hasSignal: Boolean(prefs.signal && pauseInstanceId),
    hasZoomOut: Boolean(prefs.zoomOut && pauseInstanceId),
    hasHistory: Boolean(prefs.history && pauseInstanceId),
  };
}

export function isCompanionSectionVisible(visibility: CompanionSectionVisibility): boolean {
  return (
    visibility.hasHaiku ||
    visibility.hasGrounding ||
    visibility.hasSignal ||
    visibility.hasZoomOut ||
    visibility.hasHistory
  );
}
