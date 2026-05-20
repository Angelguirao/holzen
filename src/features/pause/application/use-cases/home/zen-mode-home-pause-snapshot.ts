import type { CompanionPrefs } from '@/features/pause/domain/companion-card-types';
import { DEFAULT_COMPANIONS } from '@/features/pause/domain/session-model';
import type { PauseSeverity } from '../session/location-state';

/**
 * Companion prefs for Zen reflection Home — breathing only; other slots off until `/pause`.
 * Intentionally stricter than {@link DEFAULT_PREFS} on the dashboard widget.
 */
export const ZEN_MODE_HOME_COMPANION_PREFS: CompanionPrefs = {
  breathing: true,
  haiku: false,
  grounding: false,
  signal: false,
  zoomOut: false,
  history: false,
};

/** Static pause fields for Zen reflection Home (no open instance in zen route). */
export function zenModeHomePauseSnapshot(): {
  companions: typeof DEFAULT_COMPANIONS;
  companionPrefs: CompanionPrefs;
  severity: PauseSeverity;
  lastPauseInstanceId: null;
} {
  return {
    companions: DEFAULT_COMPANIONS,
    companionPrefs: ZEN_MODE_HOME_COMPANION_PREFS,
    severity: 'mild',
    lastPauseInstanceId: null,
  };
}
