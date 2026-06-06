/** Snapshot passed into the pause “done” / impact shell after a successful Decide. */
export type PauseImpactData = {
  mood: string | null;
  moodAfter: string | null;
  breathingCompleted: boolean;
  decision: string | null;
  context: string | null;
  engagedTools: number;
  wroteNote: boolean;
  usedTags: boolean;
  feelIntensity?: number | null;
  shiftIntensity?: number | null;
  reflectionMessage?: string | null;
  haiku?: string | null;
};
