import type { CompanionData, CompanionPrefs } from '@/components/CompanionSection';
import type { PauseSeverity } from '@/lib/router-location-state';
import type { PersistedSession } from '@/lib/pause-session-storage';
import { DEFAULT_COMPANIONS, DEFAULT_PREFS } from '@/lib/pause-session-storage';

/** Resolved pause shell payload (reflection + instance id + prefs) before optional DB fetch. */
export type PauseSessionHydrationReady = {
  status: 'ready';
  message: string;
  context: string | null;
  pauseInstanceId: string | null;
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  severity: 'mild' | 'moderate' | 'high';
};

export type PauseSessionHydrationState =
  | PauseSessionHydrationReady
  | { status: 'fetch'; pauseInstanceId: string }
  | { status: 'empty' };

/** Inputs mirror `PauseSession`’s `useHolzen` + `parsePauseSessionLocationState` + restored session slice. */
export type PauseSessionHydrationInput = {
  restored: PersistedSession | null;
  navPauseInstanceId: string | null;
  navReflectionMessage: string;
  navContext: string | null;
  navCompanions: CompanionData | undefined;
  navCompanionPrefs: CompanionPrefs | undefined;
  navSeverity: PauseSeverity | undefined;
  holzenMessage: string | null;
  holzenContext: string | null;
  holzenLastPauseInstanceId: string | null;
  holzenCompanions: CompanionData;
  holzenCompanionPrefs: CompanionPrefs;
  holzenSeverity: 'mild' | 'moderate' | 'high';
  holzenAligned: boolean;
};

/**
 * Pure merge: local restore → aligned Holzen open pause → nav reflection message
 * → fetch-by-id → unaligned Holzen message → empty.
 * Order matches `PauseSession` historical behavior; do not reorder without product review.
 */
export function computePauseSessionHydration(p: PauseSessionHydrationInput): PauseSessionHydrationState {
  if (p.restored?.message) {
    return {
      status: 'ready',
      message: p.restored.message,
      context: p.restored.context ?? null,
      pauseInstanceId:
        p.restored.pauseInstanceId ?? p.navPauseInstanceId ?? p.holzenLastPauseInstanceId,
      companions: p.restored.companions ?? p.holzenCompanions ?? DEFAULT_COMPANIONS,
      companionPrefs: p.restored.companionPrefs ?? p.holzenCompanionPrefs ?? DEFAULT_PREFS,
      severity: p.restored.severity ?? p.holzenSeverity,
    };
  }

  if (p.holzenMessage && p.holzenAligned) {
    return {
      status: 'ready',
      message: p.holzenMessage,
      context: p.holzenContext,
      pauseInstanceId: p.holzenLastPauseInstanceId,
      companions: p.holzenCompanions ?? DEFAULT_COMPANIONS,
      companionPrefs: p.holzenCompanionPrefs ?? DEFAULT_PREFS,
      severity: p.holzenSeverity,
    };
  }

  if (p.navReflectionMessage) {
    return {
      status: 'ready',
      message: p.navReflectionMessage,
      context: p.navContext ?? p.holzenContext,
      pauseInstanceId: p.navPauseInstanceId ?? p.holzenLastPauseInstanceId,
      companions: p.navCompanions ?? p.holzenCompanions ?? DEFAULT_COMPANIONS,
      companionPrefs: p.navCompanionPrefs ?? p.holzenCompanionPrefs ?? DEFAULT_PREFS,
      severity: p.navSeverity ?? p.holzenSeverity,
    };
  }

  if (p.navPauseInstanceId) {
    return { status: 'fetch', pauseInstanceId: p.navPauseInstanceId };
  }

  if (p.holzenMessage) {
    return {
      status: 'ready',
      message: p.holzenMessage,
      context: p.holzenContext,
      pauseInstanceId: p.holzenLastPauseInstanceId,
      companions: p.holzenCompanions ?? DEFAULT_COMPANIONS,
      companionPrefs: p.holzenCompanionPrefs ?? DEFAULT_PREFS,
      severity: p.holzenSeverity,
    };
  }

  return { status: 'empty' };
}
