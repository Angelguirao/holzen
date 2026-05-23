import type { FeelStepTile } from '@/features/pause/domain/feel-step-tile';
import type { MoodValue } from '@/features/pause/domain/mood-value';
import type { InitialEmotionLogOpts } from './initial-emotion-log';

export type InitialEmotionUiState = {
  moodDone: boolean;
  selectedMood: MoodValue | null;
  feelIntensity: number | null;
  selectedBriefFace: FeelStepTile | null;
};

const ROLLBACK_UI: InitialEmotionUiState = {
  moodDone: false,
  selectedMood: null,
  feelIntensity: null,
  selectedBriefFace: null,
};

/** Optimistic Feel-step UI after mood select (before / after RPC). */
export function buildInitialEmotionSelectUi(
  mood: MoodValue,
  intensity: number | undefined,
  opts?: InitialEmotionLogOpts,
): InitialEmotionUiState {
  return {
    moodDone: true,
    selectedMood: mood,
    feelIntensity: typeof intensity === 'number' ? intensity : null,
    selectedBriefFace: opts?.briefFace ?? null,
  };
}

/** UI applied when `initial_emotion_logged` RPC fails after mood select. */
export function initialEmotionSelectRollbackUi(): InitialEmotionUiState {
  return { ...ROLLBACK_UI };
}

/** UI after Feel-step skip (local or synced). */
export function buildInitialEmotionSkipUi(): Pick<
  InitialEmotionUiState,
  'moodDone' | 'feelIntensity'
> {
  return { moodDone: true, feelIntensity: null };
}

/** Clears Feel-step UI + dedupe ref (hook applies `logKey` null separately). */
export function initialEmotionResetUi(): InitialEmotionUiState {
  return { ...ROLLBACK_UI };
}
