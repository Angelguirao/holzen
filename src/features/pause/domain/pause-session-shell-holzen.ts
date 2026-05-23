import type { CompanionData, CompanionPrefs } from '@/features/pause/domain/companion-card-types';

/** Home/open-pause snapshot passed into pause session shell hydration. */
export type PauseSessionShellHolzen = {
  message: string | null;
  context: string | null;
  lastPauseInstanceId: string | null;
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  severity: 'mild' | 'moderate' | 'high';
};
