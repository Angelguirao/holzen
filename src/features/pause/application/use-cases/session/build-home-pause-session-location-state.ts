import type { CompanionData, CompanionPrefs } from '@/features/pause/domain/companion-card-types';
import type {
  PauseSessionLocationState,
  PauseSeverity,
} from './location-state';

export type BuildHomePauseSessionLocationStateInput = {
  message: string | null;
  context: string | null;
  pauseInstanceId: string | undefined;
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  severity: PauseSeverity;
};

/** Router state for Home → `/pause` (open pause card or post manual trigger). */
export function buildHomePauseSessionLocationState(
  input: BuildHomePauseSessionLocationStateInput,
): PauseSessionLocationState {
  return {
    reflectionMessage: input.message ?? '',
    context: input.context,
    pauseInstanceId: input.pauseInstanceId,
    companions: input.companions,
    companionPrefs: input.companionPrefs,
    severity: input.severity,
  };
}
