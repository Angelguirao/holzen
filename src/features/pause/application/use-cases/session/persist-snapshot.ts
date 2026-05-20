import type { PauseStep } from '@/features/pause/public';
import type { FeelStepTile } from '@/features/pause/domain/feel-step-tile';
import type { MoodValue } from '@/features/pause/domain/mood-value';
import type { CompanionData, CompanionPrefs } from '@/features/pause/public';
import type { BriefPauseStep, RitualDepth } from '@/features/pause/domain/ritual-types';
import type { PersistedSession } from '@/features/pause/domain/session-model';

/** Fields that flow into the `saveSession` autosync effect in `PauseSession`. */
export type PauseSessionPersistSnapshotInput = {
  message: string;
  context: string | null;
  pauseInstanceId: string | null;
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  severity: 'mild' | 'moderate' | 'high';
  moodDone: boolean;
  moodAfterDone: boolean;
  selectedMood: MoodValue | null;
  selectedMoodAfter: MoodValue | null;
  feelIntensity: number | null;
  shiftIntensity: number | null;
  phase: 'session' | 'done';
  decision: string | null;
  step: PauseStep;
  breathingFirstCompleted: boolean;
  breathingSecondCompleted: boolean;
  frameDone: boolean;
  ritualEntry: RitualDepth | 'picker';
  briefStep: BriefPauseStep;
  briefIntegrateDone: boolean;
  selectedBriefFace: FeelStepTile | null;
};

/**
 * Builds the `PersistedSession` payload written by the pause route autosave effect.
 * Keeps ritual/brief optional fields aligned with `ritualEntry` (same rules as before extraction).
 */
export function buildPauseSessionPersistSnapshot(p: PauseSessionPersistSnapshotInput): PersistedSession {
  return {
    message: p.message,
    context: p.context,
    pauseInstanceId: p.pauseInstanceId,
    companions: p.companions,
    companionPrefs: p.companionPrefs,
    severity: p.severity,
    moodDone: p.moodDone,
    moodAfterDone: p.moodAfterDone,
    selectedMood: p.selectedMood,
    selectedMoodAfter: p.selectedMoodAfter,
    feelIntensity: p.feelIntensity,
    shiftIntensity: p.shiftIntensity,
    phase: p.phase,
    decision: p.decision,
    step: p.step,
    breathingFirstCompleted: p.breathingFirstCompleted,
    breathingSecondCompleted: p.breathingSecondCompleted,
    frameDone: p.frameDone,
    decideOnBackStep: p.ritualEntry !== 'brief' && p.step === 'decide' ? 'breath2' : undefined,
    ritualDepth: p.ritualEntry === 'picker' ? undefined : p.ritualEntry,
    briefStep: p.ritualEntry === 'brief' ? p.briefStep : undefined,
    briefIntegrateDone: p.ritualEntry === 'brief' ? p.briefIntegrateDone : undefined,
    briefFace: p.ritualEntry === 'brief' ? p.selectedBriefFace ?? undefined : undefined,
  };
}
