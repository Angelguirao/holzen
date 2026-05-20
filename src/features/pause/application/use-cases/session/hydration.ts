import type { CompanionData, CompanionPrefs } from '@/features/pause/public';
import type { PauseSeverity } from './location-state';
import {
  DEFAULT_COMPANIONS,
  DEFAULT_PREFS,
  type FetchedPauseInstance,
  type PersistedSession,
} from '@/features/pause/domain/session-model';
import { hasPersistedPauseSessionPayload } from '@/features/pause/application/use-cases/session/persisted-session-guards';

/**
 * Pure hydration merge for `/pause`: which reflection payload wins (restore vs nav vs Holzen) and
 * when to enter **fetch** (load instance by id) vs **empty** vs **ready**.
 *
 * **Orchestration:** `presentation/use-pause-session-shell-bootstrap.ts` calls these helpers; do not reorder branches
 * in `computePauseSessionHydration` without product review (see existing note on that function).
 * **Contract:** `docs/systems/pause-system.md` section 7.2; **code map:** same doc, section 10.
 */

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
  if (p.restored && hasPersistedPauseSessionPayload(p.restored)) {
    return {
      status: 'ready',
      message: p.restored.message?.trim() ?? '',
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

  if (
    p.holzenAligned &&
    p.holzenLastPauseInstanceId &&
    !p.navReflectionMessage &&
    !p.holzenMessage &&
    !(p.restored && hasPersistedPauseSessionPayload(p.restored))
  ) {
    return { status: 'fetch', pauseInstanceId: p.holzenLastPauseInstanceId };
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

/** After optional `pause_instances` + artifacts fetch, fold `fetchedInstance` into a ready shell. */
export type PauseSessionResolvedInput = {
  hydration: PauseSessionHydrationState;
  fetchedInstance: FetchedPauseInstance | null;
  navCompanionPrefs: CompanionPrefs | undefined;
  holzenCompanionPrefs: CompanionPrefs;
  navSeverity: PauseSeverity | undefined;
  holzenSeverity: 'mild' | 'moderate' | 'high';
};

export function computePauseSessionResolved(
  p: PauseSessionResolvedInput,
): PauseSessionHydrationReady | null {
  if (p.hydration.status === 'ready') return p.hydration;
  // Instance may exist before `reflection_text` artifact (reflect-step generation).
  if (p.hydration.status === 'fetch' && p.fetchedInstance) {
    const f = p.fetchedInstance;
    return {
      status: 'ready',
      message: f.reflection_message ?? '',
      context: f.context ?? null,
      pauseInstanceId: f.id,
      companions: {
        haiku: f.haiku,
        groundingTitle: f.grounding_title,
        groundingBody: f.grounding_body,
      },
      companionPrefs: p.navCompanionPrefs ?? p.holzenCompanionPrefs ?? DEFAULT_PREFS,
      severity: p.navSeverity ?? p.holzenSeverity,
    };
  }
  return null;
}
