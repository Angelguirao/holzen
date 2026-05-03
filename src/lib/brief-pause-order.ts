import type { BriefPauseStep } from '@/lib/pause-session-storage';

/** Canonical macro order for the brief pause ritual (UI + navigation must stay aligned). */
export const BRIEF_PAUSE_ORDER: readonly BriefPauseStep[] = ['feel', 'breath', 'integrate', 'decide'];
