/**
 * Pause quality score — pure helper.
 *
 * Per `PLAN.md` §9, the quality score is **separate from the completion
 * contract**. Completion is binary (gates met or not). Quality is a 0–100
 * number that describes *how thoroughly* a user engaged with a completed
 * pause and is used only for:
 *
 *   - depth-oriented insights and nudges,
 *   - "reflection depth" badge family inputs (Phase H),
 *   - weighted stats surfaces that want to distinguish a bare-minimum
 *     completion from a rich one.
 *
 * Point allocation (total 100):
 *   breath                         20
 *   initial_emotion_logged         15
 *   shift_emotion_logged           20
 *   outcome_logged                 20
 *   companion depth                15  (>= `required_companion_count` when that
 *                                      count is > 0; when it is 0, any counted
 *                                      completion earns the points)
 *   note depth                     10  (0 / 5 / 10 by length)
 */

import type {
  PauseInstanceRow,
  PauseStepEventRow,
  PauseCompanionEventRow,
  PauseTemplateRow,
} from './pause-state';
import { collectStepTypes, countedCompanionCount } from './pause-state';

export const PAUSE_QUALITY_WEIGHTS = {
  breath: 20,
  initial_emotion: 15,
  shift_emotion: 20,
  outcome: 20,
  companion: 15,
  note: 10,
} as const;

export interface PauseQualityBreakdown {
  breath: number;
  initial_emotion: number;
  shift_emotion: number;
  outcome: number;
  companion: number;
  note: number;
  total: number;
}

/** The longest note payload.text seen for the given instance. */
function longestNoteLength(
  stepEvents: readonly PauseStepEventRow[],
  instanceId: string,
): number {
  let max = 0;
  for (const e of stepEvents) {
    if (e.pause_instance_id !== instanceId) continue;
    if (e.step_type !== 'note_updated') continue;
    const text = typeof e.payload?.text === 'string' ? (e.payload.text as string) : '';
    if (text.length > max) max = text.length;
  }
  return max;
}

export function computePauseQualityScore(params: {
  instance: PauseInstanceRow;
  template: PauseTemplateRow;
  stepEvents: readonly PauseStepEventRow[];
  companionEvents: readonly PauseCompanionEventRow[];
}): PauseQualityBreakdown {
  const { instance, template, stepEvents, companionEvents } = params;

  const seen = collectStepTypes(stepEvents, instance.id);
  const counted = countedCompanionCount(companionEvents, instance.id);

  const breath = seen.has('breath_completed') ? PAUSE_QUALITY_WEIGHTS.breath : 0;
  const initial_emotion = seen.has('initial_emotion_logged')
    ? PAUSE_QUALITY_WEIGHTS.initial_emotion
    : 0;
  const shift_emotion = seen.has('shift_emotion_logged')
    ? PAUSE_QUALITY_WEIGHTS.shift_emotion
    : 0;
  const outcome = seen.has('outcome_logged') ? PAUSE_QUALITY_WEIGHTS.outcome : 0;
  const companion =
    template.required_companion_count === 0
      ? counted > 0
        ? PAUSE_QUALITY_WEIGHTS.companion
        : 0
      : counted >= template.required_companion_count
        ? PAUSE_QUALITY_WEIGHTS.companion
        : 0;

  const noteLen = longestNoteLength(stepEvents, instance.id);
  let note = 0;
  if (noteLen >= 80) note = PAUSE_QUALITY_WEIGHTS.note;
  else if (noteLen >= 20) note = Math.floor(PAUSE_QUALITY_WEIGHTS.note / 2);

  const total = breath + initial_emotion + shift_emotion + outcome + companion + note;
  return { breath, initial_emotion, shift_emotion, outcome, companion, note, total };
}
