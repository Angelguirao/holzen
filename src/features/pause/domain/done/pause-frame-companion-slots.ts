import type { CompanionUiCompletionState } from '@/features/pause/domain/companion/companion-ui-completion-types';

/** Frame hub companion slots (excludes breathing). */
export const PAUSE_FRAME_COMPANION_SLOTS = ['haiku', 'grounding', 'signal', 'zoomOut', 'history'] as const;

export type PauseFrameCompanionSlot = (typeof PAUSE_FRAME_COMPANION_SLOTS)[number];

export function countEngagedFrameCompanionTools(
  completion: Pick<CompanionUiCompletionState, PauseFrameCompanionSlot>,
): number {
  return PAUSE_FRAME_COMPANION_SLOTS.filter((slot) => completion[slot]).length;
}

export function listCompletedFrameCompanionSlots(
  completion: Pick<CompanionUiCompletionState, PauseFrameCompanionSlot>,
): PauseFrameCompanionSlot[] {
  return PAUSE_FRAME_COMPANION_SLOTS.filter((slot) => completion[slot]);
}
