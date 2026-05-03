import type { MoodValue } from '@/components/MoodCheck';
import type { CompanionData, CompanionPrefs } from '@/components/CompanionSection';
import type { PauseStep } from '@/components/pause/PauseProgress';

const SESSION_KEY = 'holzen_pause_session';
/** Bump when persisted step model changes (Figma six-step alignment). */
export const PAUSE_RITUAL_SCHEMA_VERSION = 2 as const;

export interface PersistedSession {
  message: string;
  context: string | null;
  pauseInstanceId: string | null;
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  severity: 'mild' | 'moderate' | 'high';
  moodDone: boolean;
  /** Shift-step mood; still logged as `shift_emotion_logged` when Frame completes. */
  moodAfterDone: boolean;
  selectedMood?: MoodValue | null;
  selectedMoodAfter?: MoodValue | null;
  /** 1–5 from Feel intensity step (optional for older saved sessions). */
  feelIntensity?: number | null;
  shiftIntensity?: number | null;
  phase: 'session' | 'done';
  decision: string | null;
  step: PauseStep;
  /** First breath segment (after Feel) */
  breathingFirstCompleted?: boolean;
  /** Second breath segment (after Frame) */
  breathingSecondCompleted?: boolean;
  /** User finished Frame hub (“I'm done”) */
  frameDone?: boolean;
  /**
   * @deprecated v1 single breath flag — read as `breathingFirstCompleted` when schema &lt; 2
   */
  breathingCompleted?: boolean;
  /** Present when `PAUSE_RITUAL_SCHEMA_VERSION` */
  pauseRitualSchema?: number;
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

type LegacyPauseStep = 'breathe' | 'feel' | 'reflect' | 'shift' | 'decide';

/** Normalize localStorage from pre–six-step ritual to current `PauseStep` union. */
export function migratePersistedPauseSession(raw: PersistedSession): PersistedSession {
  if (raw.pauseRitualSchema === PAUSE_RITUAL_SCHEMA_VERSION) {
    return {
      ...raw,
      breathingFirstCompleted: raw.breathingFirstCompleted ?? raw.breathingCompleted ?? false,
      breathingSecondCompleted: raw.breathingSecondCompleted ?? false,
      frameDone: raw.frameDone ?? false,
    };
  }

  const legacy = raw.step as LegacyPauseStep | PauseStep;
  const oldBreathDone = raw.breathingCompleted ?? false;

  let step: PauseStep = 'feel';
  let breathingFirstCompleted = false;
  let breathingSecondCompleted = false;
  let frameDone = false;
  let moodDone = raw.moodDone;
  let moodAfterDone = raw.moodAfterDone;

  // Legacy order: breathe → feel → reflect → shift → decide
  if (legacy === 'breathe') {
    step = 'feel';
    breathingFirstCompleted = false;
  } else if (legacy === 'feel') {
    // Old order was breathe → feel; new order is feel → breathe — do not carry “first breath done” into the new step.
    step = 'feel';
    breathingFirstCompleted = false;
  } else if (legacy === 'reflect') {
    step = 'reflect';
    breathingFirstCompleted = true;
    moodDone = true;
  } else if (legacy === 'shift') {
    step = 'frame';
    breathingFirstCompleted = true;
    moodDone = true;
    frameDone = raw.moodAfterDone;
  } else if (legacy === 'decide') {
    step = 'decide';
    breathingFirstCompleted = true;
    breathingSecondCompleted = true;
    frameDone = true;
    moodDone = true;
    moodAfterDone = true;
  } else {
    step = legacy as PauseStep;
    breathingFirstCompleted = raw.breathingFirstCompleted ?? oldBreathDone;
    breathingSecondCompleted = raw.breathingSecondCompleted ?? false;
    frameDone = raw.frameDone ?? false;
  }

  return {
    ...raw,
    step,
    moodDone,
    moodAfterDone,
    breathingFirstCompleted,
    breathingSecondCompleted,
    frameDone,
    pauseRitualSchema: PAUSE_RITUAL_SCHEMA_VERSION,
  };
}

export function saveSession(data: PersistedSession) {
  try {
    const normalized: PersistedSession = {
      ...data,
      pauseRitualSchema: PAUSE_RITUAL_SCHEMA_VERSION,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
  } catch {
    /* ignore */
  }
}

export function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSession;
    return migratePersistedPauseSession(parsed);
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
