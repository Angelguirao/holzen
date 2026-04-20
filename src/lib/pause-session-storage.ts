import type { MoodValue } from '@/components/MoodCheck';
import type { CompanionData, CompanionPrefs } from '@/components/CompanionSection';
import type { PauseStep } from '@/components/pause/PauseProgress';

const SESSION_KEY = 'holzen_pause_session';

export interface PersistedSession {
  message: string;
  context: string | null;
  reflectionId: string | null;
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  severity: 'mild' | 'moderate' | 'high';
  moodDone: boolean;
  moodAfterDone: boolean;
  selectedMood?: MoodValue | null;
  selectedMoodAfter?: MoodValue | null;
  phase: 'session' | 'done';
  decision: string | null;
  step: PauseStep;
  breathingCompleted?: boolean;
}

export const DEFAULT_COMPANIONS: CompanionData = { haiku: null, groundingTitle: null, groundingBody: null };

export const DEFAULT_PREFS: CompanionPrefs = {
  breathing: true,
  haiku: true,
  grounding: true,
  signal: true,
  zoomOut: true,
  history: true,
};

export interface FetchedReflectionRow {
  id: string;
  message: string;
  context: string | null;
  haiku: string | null;
  grounding_title: string | null;
  grounding_body: string | null;
}

export function saveSession(data: PersistedSession) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function viewRowToCompanionData(row: {
  haiku?: string | null;
  grounding_title?: string | null;
  grounding_body?: string | null;
}): CompanionData {
  return {
    haiku: row.haiku ?? null,
    groundingTitle: row.grounding_title ?? null,
    groundingBody: row.grounding_body ?? null,
  };
}
