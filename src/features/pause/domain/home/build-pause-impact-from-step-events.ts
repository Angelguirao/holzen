import type { PauseImpactData } from '@/features/pause/domain/decide/pause-impact-data';
import type { PauseStepType } from '@/features/pause/domain/pause-state';

export type HomePracticeStepEventRow = {
  step_type: PauseStepType | string;
  payload?: Record<string, unknown> | null;
};

/** Derives a Done-screen impact snapshot from persisted ritual step events. */
export function buildPauseImpactFromStepEvents(
  events: readonly HomePracticeStepEventRow[],
  context: string | null,
  engagedTools: number,
): PauseImpactData {
  let mood: string | null = null;
  let moodAfter: string | null = null;
  let breathingCompleted = false;
  let decision: string | null = null;
  let wroteNote = false;
  let usedTags = false;

  for (const event of events) {
    switch (event.step_type) {
      case 'breath_completed':
        breathingCompleted = true;
        break;
      case 'initial_emotion_logged':
        if (typeof event.payload?.mood === 'string') mood = event.payload.mood;
        break;
      case 'post_pause_emotion_logged':
      case 'shift_emotion_logged':
        if (typeof event.payload?.mood === 'string') moodAfter = event.payload.mood;
        break;
      case 'outcome_logged':
        if (typeof event.payload?.outcome === 'string') decision = event.payload.outcome;
        break;
      case 'note_updated':
        wroteNote = true;
        break;
      case 'tag_updated':
        usedTags = true;
        break;
      default:
        break;
    }
  }

  return {
    mood,
    moodAfter,
    breathingCompleted,
    decision,
    context,
    engagedTools,
    wroteNote,
    usedTags,
    ritualDepth: resolveHomePracticeRitualVariant(events) === 'brief' ? 'brief' : 'deep',
  };
}

export function resolveHomePracticeRitualVariant(
  events: readonly HomePracticeStepEventRow[],
): 'default' | 'brief' {
  if (
    events.some(
      (e) => e.payload?.brief_ritual === true || e.payload?.briefRitual === true,
    )
  ) {
    return 'brief';
  }
  const hasReflect = events.some((e) => e.step_type === 'reflection_step');
  const hasOutcome = events.some((e) => e.step_type === 'outcome_logged');
  if (hasOutcome && !hasReflect) return 'brief';
  return 'default';
}
