import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import { runDeepPausePickerEntryIfPro } from '@/features/pause/application/use-cases/ritual/feel/pause-session-mood-chrome-flow';
import type {
  BriefPauseStep,
  CompanionData,
  CompanionPrefs,
  PauseStep,
  RitualDepth,
} from '@/features/pause/public-hooks';
import type { FeelStepTile } from '../domain/feel-step-tile';
import type { MoodValue } from '../domain/mood-value';
import { usePauseFeelShiftLogDedupeRefs } from './use-pause-feel-shift-log-dedupe-refs';
import { usePauseSessionDepthPickerHandlers } from './use-pause-session-depth-picker-handlers';
import { usePauseSessionFeelTilesSelect } from './use-pause-session-feel-tiles-select';
import { usePauseSessionInitialMoodHandlers } from './use-pause-session-initial-mood-handlers';
import { usePauseSessionPersistToStorage } from './use-pause-session-persist-to-storage';
import { usePauseSessionRitualStorageSync } from './use-pause-session-ritual-storage-sync';

export interface UsePauseSessionMoodAndPersistParams {
  pauseInstanceId: string | null;
  t: TFunction;
  requirePro: (feature: 'deep_pause') => boolean;
  ritualEntry: RitualDepth | 'picker';
  message: string;
  context: string | null;
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
  briefStep: BriefPauseStep;
  briefIntegrateDone: boolean;
  selectedBriefFace: FeelStepTile | null;
  setRitualEntry: Dispatch<SetStateAction<RitualDepth | 'picker'>>;
  setBriefStep: Dispatch<SetStateAction<BriefPauseStep>>;
  setBriefIntegrateDone: Dispatch<SetStateAction<boolean>>;
  setSelectedBriefFace: Dispatch<SetStateAction<FeelStepTile | null>>;
  setMoodDone: Dispatch<SetStateAction<boolean>>;
  setSelectedMood: Dispatch<SetStateAction<MoodValue | null>>;
  setFeelIntensity: Dispatch<SetStateAction<number | null>>;
}

/**
 * Feel/mood RPC dedupe, depth picker entry, ritual localStorage sync + persist snapshot.
 */
export function usePauseSessionMoodAndPersist({
  pauseInstanceId,
  t,
  requirePro,
  ritualEntry,
  message,
  context,
  companions,
  companionPrefs,
  severity,
  moodDone,
  moodAfterDone,
  selectedMood,
  selectedMoodAfter,
  feelIntensity,
  shiftIntensity,
  phase,
  decision,
  step,
  breathingFirstCompleted,
  breathingSecondCompleted,
  frameDone,
  briefStep,
  briefIntegrateDone,
  selectedBriefFace,
  setRitualEntry,
  setBriefStep,
  setBriefIntegrateDone,
  setSelectedBriefFace,
  setMoodDone,
  setSelectedMood,
  setFeelIntensity,
}: UsePauseSessionMoodAndPersistParams) {
  const { lastFeelLogKeyRef, lastShiftLogKeyRef } = usePauseFeelShiftLogDedupeRefs(pauseInstanceId);

  const { onBrief: depthPickerOnBrief, onDeep: depthPickerOnDeep } = usePauseSessionDepthPickerHandlers({
    setRitualEntry,
    setBriefStep,
  });

  const handleDepthPickerDeep = useCallback(() => {
    runDeepPausePickerEntryIfPro(requirePro, depthPickerOnDeep);
  }, [requirePro, depthPickerOnDeep]);

  const { handleMoodSelect } = usePauseSessionInitialMoodHandlers({
    pauseInstanceId,
    t,
    lastFeelLogKeyRef,
    setMoodDone,
    setSelectedMood,
    setFeelIntensity,
    setSelectedBriefFace,
  });

  const { onFeelTilesSelect } = usePauseSessionFeelTilesSelect({
    handleMoodSelect,
    isBriefRitual: ritualEntry === 'brief',
  });

  usePauseSessionRitualStorageSync({
    pauseInstanceId,
    setRitualEntry,
    setBriefStep,
    setBriefIntegrateDone,
    setSelectedBriefFace,
  });

  usePauseSessionPersistToStorage({
    message,
    context,
    pauseInstanceId,
    companions,
    companionPrefs,
    severity,
    moodDone,
    moodAfterDone,
    selectedMood,
    selectedMoodAfter,
    feelIntensity,
    shiftIntensity,
    phase,
    decision,
    step,
    breathingFirstCompleted,
    breathingSecondCompleted,
    frameDone,
    ritualEntry,
    briefStep,
    briefIntegrateDone,
    selectedBriefFace,
  });

  return {
    lastFeelLogKeyRef,
    lastShiftLogKeyRef,
    depthPickerOnBrief,
    handleDepthPickerDeep,
    onFeelTilesSelect,
  };
}
