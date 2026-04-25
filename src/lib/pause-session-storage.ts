import type { MoodValue } from '@/components/MoodCheck';
import type { CompanionData, CompanionPrefs } from '@/components/CompanionSection';
import type { PauseStep } from '@/components/pause/PauseProgress';

const SESSION_KEY = 'holzen_pause_session';

export interface PersistedSession {
  message: string;
  context: string | null;
  pauseInstanceId: string | null;
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

export interface FetchedPauseInstance {
  id: string;
  reflection_message: string;
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

export function companionDataFromArtifacts(
  rows: Array<{ kind: string; content: Record<string, unknown> }>,
): CompanionData {
  let haiku: string | null = null;
  let groundingTitle: string | null = null;
  let groundingBody: string | null = null;
  for (const r of rows) {
    if (r.kind === 'haiku' && typeof r.content?.haiku === 'string') {
      haiku = r.content.haiku as string;
    } else if (r.kind === 'ground_nudge') {
      if (typeof r.content?.title === 'string') groundingTitle = r.content.title as string;
      if (typeof r.content?.body === 'string') groundingBody = r.content.body as string;
    }
  }
  return { haiku, groundingTitle, groundingBody };
}
