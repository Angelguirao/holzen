import type { MoodValue } from '@/components/MoodCheck';
import type { FeelStepTile } from '@/screens/pause/components/pause-feel-types';
import type { CompanionData, CompanionPrefs } from '@/screens/pause/components/CompanionSection';
import type { PauseStep } from '@/screens/pause/components/PauseProgress';
import type { PauseState } from '@/features/pause/domain/pause-state';
import type { BriefPauseStep, RitualDepth } from '@/features/pause/domain/ritual-types';

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
  /** Decide screen back target (second breath segment). */
  decideOnBackStep?: 'breath2';
  /** v4: which ritual path; omitted in older saves → treated as deep when migrating. */
  ritualDepth?: RitualDepth;
  /** v4: macro position inside the four-step brief ritual. */
  briefStep?: BriefPauseStep;
  /** v4: user finished the 20s integrate beat (or tapped Continue early). */
  briefIntegrateDone?: boolean;
  /** v4: which tile was chosen on the brief Feel grid (Other maps to uncertain in RPC mood). */
  briefFace?: FeelStepTile | null;
}

export const DEFAULT_COMPANIONS: CompanionData = {
  haiku: null,
  groundingTitle: null,
  groundingBody: null,
};

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
  /** Present when hydrating from `pause_instances` (id-only `/pause` navigation). */
  db_state?: PauseState | null;
  /** ISO timestamp when the row entered `engaged` (for `open_max_age` UI countdown). */
  engaged_at?: string | null;
}
