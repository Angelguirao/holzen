import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';
import {
  PAUSE_RITUAL_SCHEMA_VERSION,
} from '@/features/pause/domain/ritual-types';
import type { PersistedSession } from '@/features/pause/domain/session-model';

type LegacyPauseStep = 'breathe' | 'feel' | 'reflect' | 'shift' | 'decide';

function normalizePauseRitualFields(raw: PersistedSession): Pick<
  PersistedSession,
  'breathingFirstCompleted' | 'breathingSecondCompleted' | 'frameDone'
> {
  return {
    breathingFirstCompleted: raw.breathingFirstCompleted ?? raw.breathingCompleted ?? false,
    breathingSecondCompleted: raw.breathingSecondCompleted ?? false,
    frameDone: raw.frameDone ?? false,
  };
}

/** Normalize localStorage from legacy five/six-step rituals to current `PauseStep` union. */
export function migratePersistedPauseSession(raw: PersistedSession): PersistedSession {
  if (raw.pauseRitualSchema === PAUSE_RITUAL_SCHEMA_VERSION) {
    const n = normalizePauseRitualFields(raw);
    const fromChoose = (raw.step as string) === 'choose';
    return {
      ...raw,
      ...n,
      step: fromChoose ? ('decide' as PauseStep) : raw.step,
      decideOnBackStep:
        (raw.decideOnBackStep as string) === 'choose' || fromChoose
          ? 'breath2'
          : raw.decideOnBackStep,
      breathingSecondCompleted: fromChoose ? true : n.breathingSecondCompleted,
    };
  }

  if (raw.pauseRitualSchema === 3) {
    return migratePersistedPauseSession({
      ...raw,
      ...normalizePauseRitualFields(raw),
      ritualDepth: 'deep',
      pauseRitualSchema: PAUSE_RITUAL_SCHEMA_VERSION,
    });
  }

  if (raw.pauseRitualSchema === 2) {
    return migratePersistedPauseSession({
      ...raw,
      ...normalizePauseRitualFields(raw),
      decideOnBackStep:
        (raw.decideOnBackStep as string) === 'choose'
          ? 'breath2'
          : (raw.decideOnBackStep ?? (raw.step === 'decide' ? 'breath2' : undefined)),
      ritualDepth: 'deep',
      pauseRitualSchema: PAUSE_RITUAL_SCHEMA_VERSION,
    });
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
    decideOnBackStep: step === 'decide' ? 'breath2' : undefined,
    ritualDepth: 'deep',
    pauseRitualSchema: PAUSE_RITUAL_SCHEMA_VERSION,
  };
}
