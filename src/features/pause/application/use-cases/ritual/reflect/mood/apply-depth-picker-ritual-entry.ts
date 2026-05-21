import {
  BRIEF_DEPTH_PICKER_RITUAL_ENTRY,
  DEEP_DEPTH_PICKER_RITUAL_ENTRY,
} from '@/features/pause/domain/reflect/mood/pause-session-mood-chrome-flow';
import type { BriefPauseStep, RitualDepth } from '@/features/pause/domain/ritual-types';

export type ApplyDepthPickerRitualEntryPorts = {
  setRitualEntry: (entry: RitualDepth | 'picker') => void;
  setBriefStep: (step: BriefPauseStep) => void;
};

/** Brief depth-picker CTA — sets ritual entry and initial brief step. */
export function applyBriefDepthPickerRitualEntry(ports: ApplyDepthPickerRitualEntryPorts): void {
  ports.setRitualEntry(BRIEF_DEPTH_PICKER_RITUAL_ENTRY.ritualEntry);
  ports.setBriefStep(BRIEF_DEPTH_PICKER_RITUAL_ENTRY.briefStep);
}

/** Deep depth-picker CTA — sets deep ritual entry only. */
export function applyDeepDepthPickerRitualEntry(
  ports: Pick<ApplyDepthPickerRitualEntryPorts, 'setRitualEntry'>,
): void {
  ports.setRitualEntry(DEEP_DEPTH_PICKER_RITUAL_ENTRY.ritualEntry);
}
